import { model } from '../model/model'
import { articlesAllowedFileTypes, innerErrors } from '../utils/constants'
import { convertDocxToHtml, getAllCompatibleInputForString } from '../utils/functions'
import { IArticle, IArticleUpdate } from '../utils/interfaces/articles/articles'
import { getLogger } from '../utils/logger'
import { Error, ArticleFileData, Filter, ModelResult, Options } from '../utils/types'
import { googleDriveService } from './google-drive'
import { notificationService } from './notification'

const logger = getLogger('services/articles')

const articlesCollection = 'articles'

async function addArticle(docId: string, articleMetadata: IArticle, file: ArticleFileData) {
    await addMetadataToDBFlow(docId, articleMetadata)

    await addFileToGoogleDriveFlow(docId, file)

    return { id: docId }
}

async function addMetadataToDB(docId: string, obj: IArticle) {
    obj.timestamp = Date.now()
    // Add article metadata to DB
    const [modelResult, modelError] = (await model({
        collection: articlesCollection,
        action: 'add',
        docId,
        obj
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw new Error(modelError.msg)
    }

    if (!modelResult?.mainResult?.id) {
        throw new Error('Article info was not stored to DB!')
    }

    return modelResult.mainResult as { id: string }
}

async function addMetadataToDBFlow(docId: string, articleMetadata: IArticle) {
    articleMetadata.keywords = getAllCompatibleInputForString(articleMetadata.title)
    if (articleMetadata.description) {
        articleMetadata.keywords.push(
            ...getAllCompatibleInputForString(articleMetadata.description)
        )
    }
    if (articleMetadata.tags) {
        for (const tag of articleMetadata.tags) {
            articleMetadata.keywords.push(...getAllCompatibleInputForString(tag))
        }
    }
    articleMetadata.keywords.push(...getAllCompatibleInputForString(docId))
    if (articleMetadata.oldId) {
        articleMetadata.keywords.push(
            ...getAllCompatibleInputForString(articleMetadata.oldId.toString())
        )
    }

    const mainResult = await addMetadataToDB(docId, articleMetadata)

    return mainResult.id
}

async function deleteArticles(docIds: string[]) {
    await googleDriveService.deleteFiles(docIds, 'articles')

    await _deleteMetadatasFromDB(docIds)
}

async function _deleteMetadatasFromDB(docIds: string[], errorMsg?: string, collection?: string) {
    const [_, deleteModelError] = await model({
        action: 'delete',
        docIds,
        collection: collection || articlesCollection
    })

    if (deleteModelError) {
        throw new Error(errorMsg || 'Deleting metadatas failed with error: ' + deleteModelError.msg)
    }
}

async function addFileToGoogleDrive(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number },
    filename?: string
) {
    // Upload file to Google Drive
    const result = (await googleDriveService.uploadFile(filename || docId, file, 'articles')) as {
        id: string
    }
    if (!result?.id) {
        // If file was not stored to Google Drive, delete record from DB
        await _deleteMetadatasFromDB(
            [docId],
            `Article file [${filename || docId}.${
                file.ext
            }] was not stored to Google Drive! Unable to remove article metadata from database!`,
            // TODO: Get that logic easier
            filename && filename.includes('_pending') ? 'actions' : undefined
        )

        throw new Error(
            `Article file [${filename || docId}.${file.ext}] was not stored to Google Drive!`
        )
    }
}

async function addFileToGoogleDriveFlow(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number },
    filename?: string
) {
    await addFileToGoogleDrive(docId, file, filename)

    // If we try to add DOCX then we should also convert this to HTML and add to Google Drive
    if (file.mimetype === articlesAllowedFileTypes.docx) {
        try {
            var html = (await convertDocxToHtml(file.body))?.value
            if (!html) {
                throw new Error('Result of convertion DOCX to HTML is empty')
            }
        } catch {
            // If DOCX was not converted to HTML we should delete DOCX from Google Drive and it's document from database
            const baseErrorMsg = `Article file [${
                filename || docId
            }.html] was not stored to Google Drive!`

            await googleDriveService.deleteFiles([filename || docId], 'articles')

            await _deleteMetadatasFromDB(
                [docId],
                `${baseErrorMsg} Unable to remove article metadata from database!`,
                filename && filename.includes('_pending') ? 'actions' : undefined
            )

            throw new Error(baseErrorMsg)
        }

        const htmlBuffer = Buffer.from(html)
        const htmlFile = {
            body: htmlBuffer,
            size: htmlBuffer.length,
            ext: 'html',
            mimetype: articlesAllowedFileTypes.html
        }

        // Upload html file to Google Drive
        await addFileToGoogleDrive(docId, htmlFile, filename)
    }
}

async function updateArticle(
    docId: string,
    articleMetadataUpdate: IArticleUpdate,
    file?: ArticleFileData
) {
    await updateMetadataToDBFlow(docId, articleMetadataUpdate)

    if (file) {
        await updateFileToGoogleDriveFlow(docId, file)
    }

    return { id: docId }
}

async function updateMetadataToDBFlow(docId: string, articleMetadataUpdate: IArticleUpdate) {
    const keywords = []

    const articleMetadata: IArticle = await _getMetadataFromDB(docId)

    if (articleMetadataUpdate.title) {
        keywords.push(...getAllCompatibleInputForString(articleMetadataUpdate.title))
    } else {
        keywords.push(...getAllCompatibleInputForString(articleMetadata.title))
    }

    if (articleMetadataUpdate.description) {
        keywords.push(...getAllCompatibleInputForString(articleMetadataUpdate.description))
    } else if (articleMetadata.description) {
        keywords.push(...getAllCompatibleInputForString(articleMetadata.description))
    }

    if (articleMetadataUpdate.tags) {
        for (const tag of articleMetadataUpdate.tags) {
            keywords.push(...getAllCompatibleInputForString(tag))
        }
    } else if (articleMetadata.tags) {
        for (const tag of articleMetadata.tags) {
            keywords.push(...getAllCompatibleInputForString(tag))
        }
    }

    keywords.push(...getAllCompatibleInputForString(docId))

    if (articleMetadataUpdate.oldId) {
        keywords.push(...getAllCompatibleInputForString(articleMetadataUpdate.oldId.toString()))
    } else if (articleMetadata.oldId) {
        keywords.push(...getAllCompatibleInputForString(articleMetadata.oldId.toString()))
    }

    articleMetadataUpdate.keywords = keywords

    const mainResult = await _updateMetadataToDB(docId, articleMetadataUpdate)

    return mainResult.id
}

async function _updateMetadataToDB(docId: string, obj: IArticleUpdate) {
    obj.lastUpdateTimestamp = Date.now()
    // Update article metadata to DB
    const [modelResult, modelError] = (await model({
        collection: articlesCollection,
        action: 'update',
        docId,
        obj
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw new Error(modelError.msg)
    }

    if (!modelResult?.mainResult?.id) {
        throw new Error('Article info was not stored to DB!')
    }

    return modelResult.mainResult as { id: string }
}

async function _getMetadataFromDB(docId: string) {
    const [modelResult, modelError] = (await model({
        collection: articlesCollection,
        docId,
        action: 'get'
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw new Error(modelError.msg)
    }

    if (!modelResult?.mainResult) {
        throw new Error(`No article [${docId}] metadata found in DB`)
    }

    return modelResult.mainResult as IArticle
}

async function _getMetadatasFromDB({ where, docIds }: { where?: Filter[]; docIds?: string[] }) {
    if (!(where || docIds)) {
        throw new Error('"docIds" or "where" parameter should be specified')
    }

    const [modelResult, modelError] = (await model({
        collection: articlesCollection,
        where,
        docIds,
        action: 'get'
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw new Error(modelError.msg)
    }

    if (!modelResult?.mainResult) {
        return []
    }

    return modelResult.mainResult as IArticle[]
}

async function updateFileToGoogleDriveFlow(docId: string, file: ArticleFileData) {
    await googleDriveService.deleteFiles([docId], 'articles')

    await addFileToGoogleDriveFlow(docId, file)
}

async function replaceOldIds(docIds: string[], options?: Options) {
    const ids: string[] = []

    const where: Filter[] = []

    const newOptions: Options = {}

    for (const docId of docIds) {
        if (docId.length < 10) {
            try {
                const oldId = parseInt(docId)
                if (oldId) {
                    where.push(['oldId', '==', docId])
                }
            } catch {}
        } else {
            ids.push(docId)

            if (options) {
                newOptions[docId] = options[docId]
            }
        }
    }

    if (!where.length) {
        if (options) {
            return [ids, newOptions]
        }

        return ids
    }

    const articleMetadatas = await _getMetadatasFromDB({ where })

    const oldIds: number[] = []

    for (const articleMetadata of articleMetadatas) {
        if (!articleMetadata.oldId || !articleMetadata.id) {
            continue
        }

        if (oldIds.includes(articleMetadata.oldId)) {
            notificationService.sendError(
                innerErrors.ARTICLE_OLD_ID_DUBLICATE,
                `oldId = ${articleMetadata.oldId}`
            )
            logger.error(
                `ERROR [${innerErrors.ARTICLE_OLD_ID_DUBLICATE.code}]: ${innerErrors.ARTICLE_OLD_ID_DUBLICATE.msg}: oldId = ${articleMetadata.oldId}`
            )
        } else {
            // TODO: Investigate the situation: is it possible "ids" array has included "articleMetadata.id" already
            ids.push(articleMetadata.id)

            if (options) {
                newOptions[articleMetadata.id] = options[articleMetadata.oldId]
            }
        }
    }

    if (options) {
        return [ids, newOptions]
    }

    return ids
}

async function checkOldIdUsage(oldId: number) {
    const where: Filter[] = [['oldId', '==', oldId.toString()]]

    const articleMetadatas = await _getMetadatasFromDB({ where })

    return articleMetadatas.map((articleMetadata: IArticle) => articleMetadata.id) as string[]
}

async function checkMetadatasExistance(docIds: string[]) {
    const articleMetadatas = await _getMetadatasFromDB({ docIds })

    return articleMetadatas.map((articleMetadata: IArticle) => articleMetadata.id)
}

export const articlesService = {
    addArticle,
    addMetadataToDBFlow,
    addFileToGoogleDriveFlow,
    deleteArticles,
    updateArticle,
    updateMetadataToDBFlow,
    updateFileToGoogleDriveFlow,
    replaceOldIds,
    checkOldIdUsage,
    checkMetadatasExistance
}
