import { Response } from 'express'
import { model } from '../model/model'
import { allowedFileTypes } from '../utils/constants'
import { convertDocxToHtml, getAllCompatibleInputForString } from '../utils/functions'
import { IArticle, IArticleUpdate } from '../utils/interfaces/articles/articles'
import { Error, FileData, ModelResult } from '../utils/types'
import { googleDriveService } from './googleDrive'

const articlesCollection = 'articles'

async function addArticle(docId: string, articleMetadata: IArticle, file: FileData) {
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

    if (modelError) throw modelError.msg

    if (!modelResult?.mainResult?.id) throw 'Article info was not stored to DB!'

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

    if (deleteModelError)
        throw errorMsg || 'Deleting metadatas failed with error: ' + deleteModelError.msg
}

async function addFileToGoogleDrive(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number },
    filename?: string
) {
    // Upload file to Google Drive
    const result = (await googleDriveService.uploadFile(filename || docId, file)) as { id: string }
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

        throw `Article file [${filename || docId}.${file.ext}] was not stored to Google Drive!`
    }
}

async function addFileToGoogleDriveFlow(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number },
    filename?: string
) {
    await addFileToGoogleDrive(docId, file, filename)

    // If we try to add DOCX then we should also convert this to HTML and add to Google Drive
    if (file.mimetype === allowedFileTypes.docx) {
        try {
            var html = (await convertDocxToHtml(file.body))?.value
            if (!html) throw 'Result of convertion DOCX to HTML is empty'
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

            throw baseErrorMsg
        }

        const htmlBuffer = Buffer.from(html)
        const htmlFile = {
            body: htmlBuffer,
            size: htmlBuffer.length,
            ext: 'html',
            mimetype: allowedFileTypes.html
        }

        // Upload html file to Google Drive
        await addFileToGoogleDrive(docId, htmlFile, filename)
    }
}

async function updateArticle(
    docId: string,
    articleMetadataUpdate: IArticleUpdate,
    file?: FileData
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

    if (modelError) throw modelError.msg

    if (!modelResult?.mainResult?.id) throw 'Article info was not stored to DB!'

    return modelResult.mainResult as { id: string }
}

async function _getMetadataFromDB(docId: string) {
    const [modelResult, modelError] = (await model({
        collection: articlesCollection,
        docId,
        action: 'get'
    })) as [ModelResult | null, Error | null]

    if (modelError) {
        throw modelError.msg
    }

    if (!modelResult?.mainResult) {
        throw `No article [${docId}] metadata found in DB`
    }

    return modelResult.mainResult as IArticle
}

async function updateFileToGoogleDriveFlow(docId: string, file: FileData) {
    await googleDriveService.deleteFiles([docId], 'articles')

    await addFileToGoogleDriveFlow(docId, file)
}

export const articlesService = {
    addArticle,
    addMetadataToDBFlow,
    addFileToGoogleDriveFlow,
    deleteArticles,
    updateArticle,
    updateMetadataToDBFlow,
    updateFileToGoogleDriveFlow
}
