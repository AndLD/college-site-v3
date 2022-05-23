import { model } from '../model/model'
import { innerErrors, newsAllowedFileTypes } from '../utils/constants'
import { convertDocxToHtml, getAllCompatibleInputForString } from '../utils/functions'
import { INews, INewsUpdate } from '../utils/interfaces/news/news'
import { getLogger } from '../utils/logger'
import {
    ArticlesAllowedFileExtension,
    Error,
    Filter,
    ModelResult,
    NewsAllowedFileExtension,
    NewsFileData
} from '../utils/types'
import { googleDriveService } from './googleDrive'
import { notificationService } from './notification'

const logger = getLogger('services/news')

const newsCollection = 'news'

async function addNews(
    docId: string,
    newsMetadata: INews,
    file: NewsFileData,
    image?: NewsFileData
) {
    await addMetadataToDBFlow(docId, newsMetadata)

    await addFileToGoogleDriveFlow(docId, file)

    if (image) {
        await addFileToGoogleDriveFlow(docId, image)
    }

    return { id: docId }
}

async function addMetadataToDB(docId: string, obj: INews) {
    obj.timestamp = Date.now()
    // Add news metadata to DB
    const [modelResult, modelError] = (await model({
        collection: newsCollection,
        action: 'add',
        docId,
        obj
    })) as [ModelResult | null, Error | null]

    if (modelError) throw modelError.msg

    if (!modelResult?.mainResult?.id) throw 'News info was not stored to DB!'

    return modelResult.mainResult as { id: string }
}

async function addMetadataToDBFlow(docId: string, newsMetadata: INews) {
    newsMetadata.keywords = getAllCompatibleInputForString(newsMetadata.title)
    if (newsMetadata.description) {
        newsMetadata.keywords.push(...getAllCompatibleInputForString(newsMetadata.description))
    }
    if (newsMetadata.tags) {
        for (const tag of newsMetadata.tags) {
            newsMetadata.keywords.push(...getAllCompatibleInputForString(tag))
        }
    }
    newsMetadata.keywords.push(...getAllCompatibleInputForString(docId))
    if (newsMetadata.oldId) {
        newsMetadata.keywords.push(...getAllCompatibleInputForString(newsMetadata.oldId.toString()))
    }

    const mainResult = await addMetadataToDB(docId, newsMetadata)

    return mainResult.id
}

async function deleteNews(docIds: string[]) {
    await googleDriveService.deleteFiles(docIds, 'news')

    await _deleteMetadatasFromDB(docIds)
}

async function _deleteMetadatasFromDB(docIds: string[], errorMsg?: string, collection?: string) {
    const [_, deleteModelError] = await model({
        action: 'delete',
        docIds,
        collection: collection || newsCollection
    })

    if (deleteModelError)
        throw errorMsg || 'Deleting metadatas failed with error: ' + deleteModelError.msg
}

async function addFileToGoogleDrive(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number },
    filename?: string
) {
    // Upload file to Google Drive
    const result = (await googleDriveService.uploadFile(filename || docId, file, 'news')) as {
        id: string
    }
    if (!result?.id) {
        // If file was not stored to Google Drive, delete record from DB
        await _deleteMetadatasFromDB(
            [docId],
            `News file [${filename || docId}.${
                file.ext
            }] was not stored to Google Drive! Unable to remove news metadata from database!`,
            // TODO: Get that logic easier
            filename && filename.includes('_pending') ? 'actions' : undefined
        )

        throw `News file [${filename || docId}.${file.ext}] was not stored to Google Drive!`
    }
}

async function addFileToGoogleDriveFlow(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number },
    filename?: string
) {
    await addFileToGoogleDrive(docId, file, filename)

    // If we try to add DOCX then we should also convert this to HTML and add to Google Drive
    if (file.mimetype === newsAllowedFileTypes.docx) {
        try {
            var html = (await convertDocxToHtml(file.body))?.value
            if (!html) throw 'Result of convertion DOCX to HTML is empty'
        } catch {
            // If DOCX was not converted to HTML we should delete DOCX from Google Drive and it's document from database
            const baseErrorMsg = `News file [${
                filename || docId
            }.html] was not stored to Google Drive!`

            await googleDriveService.deleteFiles([filename || docId], 'news')

            await _deleteMetadatasFromDB(
                [docId],
                `${baseErrorMsg} Unable to remove news metadata from database!`,
                filename && filename.includes('_pending') ? 'actions' : undefined
            )

            throw baseErrorMsg
        }

        const htmlBuffer = Buffer.from(html)
        const htmlFile = {
            body: htmlBuffer,
            size: htmlBuffer.length,
            ext: 'html',
            mimetype: newsAllowedFileTypes.html
        }

        // Upload html file to Google Drive
        await addFileToGoogleDrive(docId, htmlFile, filename)
    }
}

async function updateNews(
    docId: string,
    newsMetadataUpdate: INewsUpdate,
    file?: NewsFileData,
    image?: NewsFileData
) {
    await updateMetadataToDBFlow(docId, newsMetadataUpdate)

    if (file) {
        await updateFileToGoogleDriveFlow(docId, file, {
            [docId]: ['docx', 'html']
        })
    }

    if (image) {
        await updateFileToGoogleDriveFlow(docId, image, {
            [docId]: ['png']
        })
    }

    return { id: docId }
}

async function updateMetadataToDBFlow(docId: string, newsMetadataUpdate: INewsUpdate) {
    const keywords = []

    const newsMetadata: INews = await _getMetadataFromDB(docId)

    if (newsMetadataUpdate.title) {
        keywords.push(...getAllCompatibleInputForString(newsMetadataUpdate.title))
    } else {
        keywords.push(...getAllCompatibleInputForString(newsMetadata.title))
    }

    if (newsMetadataUpdate.description) {
        keywords.push(...getAllCompatibleInputForString(newsMetadataUpdate.description))
    } else if (newsMetadata.description) {
        keywords.push(...getAllCompatibleInputForString(newsMetadata.description))
    }

    if (newsMetadataUpdate.tags) {
        for (const tag of newsMetadataUpdate.tags) {
            keywords.push(...getAllCompatibleInputForString(tag))
        }
    } else if (newsMetadata.tags) {
        for (const tag of newsMetadata.tags) {
            keywords.push(...getAllCompatibleInputForString(tag))
        }
    }

    keywords.push(...getAllCompatibleInputForString(docId))

    if (newsMetadataUpdate.oldId) {
        keywords.push(...getAllCompatibleInputForString(newsMetadataUpdate.oldId.toString()))
    } else if (newsMetadata.oldId) {
        keywords.push(...getAllCompatibleInputForString(newsMetadata.oldId.toString()))
    }

    newsMetadataUpdate.keywords = keywords

    const mainResult = await _updateMetadataToDB(docId, newsMetadataUpdate)

    return {
        docBeforeUpdate: newsMetadata,
        docAfterUpdate: mainResult
    }
}

async function _updateMetadataToDB(docId: string, obj: INewsUpdate) {
    obj.lastUpdateTimestamp = Date.now()
    // Update news metadata to DB
    const [modelResult, modelError] = (await model({
        collection: newsCollection,
        action: 'update',
        docId,
        obj
    })) as [ModelResult | null, Error | null]

    if (modelError) throw modelError.msg

    if (!modelResult?.mainResult?.id) throw 'News info was not stored to DB!'

    return modelResult.mainResult as { id: string }
}

async function _getMetadataFromDB(docId: string) {
    const [modelResult, modelError] = (await model({
        collection: newsCollection,
        docId,
        action: 'get'
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw modelError.msg
    }

    if (!modelResult?.mainResult) {
        throw `No news [${docId}] metadata found in DB`
    }

    return modelResult.mainResult as INews
}

async function _getMetadatasFromDB({ where, docIds }: { where?: Filter[]; docIds?: string[] }) {
    if (!(where || docIds)) {
        throw '"docIds" or "where" parameter should be specified'
    }

    const [modelResult, modelError] = (await model({
        collection: newsCollection,
        where,
        docIds,
        action: 'get'
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw modelError.msg
    }

    if (!modelResult?.mainResult) {
        return []
    }

    return modelResult.mainResult as INews[]
}

async function updateFileToGoogleDriveFlow(
    docId: string,
    file: NewsFileData,
    options?: {
        [key: string]: (ArticlesAllowedFileExtension | NewsAllowedFileExtension)[]
    }
) {
    await googleDriveService.deleteFiles([docId], 'news', options)

    await addFileToGoogleDriveFlow(docId, file)
}

async function replaceOldIds(docIds: string[]) {
    const ids: string[] = []

    const where: Filter[] = []

    for (const docId of docIds) {
        if (docId.length < 10 && !docId.includes('_pending')) {
            try {
                const oldId = parseInt(docId)
                if (oldId) {
                    where.push(['oldId', '==', docId])
                }
            } catch {}
        } else {
            ids.push(docId)
        }
    }

    if (!where.length) {
        return ids
    }

    const newsMetadatas = await _getMetadatasFromDB({ where })

    const oldIds: number[] = []

    for (const newsMetadata of newsMetadatas) {
        if (!newsMetadata.oldId || !newsMetadata.id) {
            continue
        }

        if (oldIds.includes(newsMetadata.oldId)) {
            notificationService.sendError(
                innerErrors.NEWS_OLD_ID_DUBLICATE,
                `oldId = ${newsMetadata.oldId}`
            )
            logger.error(
                `ERROR [${innerErrors.NEWS_OLD_ID_DUBLICATE.code}]: ${innerErrors.NEWS_OLD_ID_DUBLICATE.msg}: oldId = ${newsMetadata.oldId}`
            )
        } else {
            // TODO: Investigate the situation: is it possible "ids" array includes "newsMetadata.id" already
            ids.push(newsMetadata.id)
        }
    }

    return ids
}

async function checkOldIdUsage(oldId: number) {
    const where: Filter[] = [['oldId', '==', oldId.toString()]]

    const newsMetadatas = await _getMetadatasFromDB({ where })

    return newsMetadatas.map((newsMetadata: INews) => newsMetadata.id) as string[]
}

async function getMetadatasByIds(docIds: string[]) {
    const newsMetadatas = await _getMetadatasFromDB({ docIds })

    return newsMetadatas
}

export const newsService = {
    addNews,
    addMetadataToDBFlow,
    addFileToGoogleDriveFlow,
    deleteNews,
    updateNews,
    updateMetadataToDBFlow,
    updateFileToGoogleDriveFlow,
    replaceOldIds,
    checkOldIdUsage,
    getMetadatasByIds
}
