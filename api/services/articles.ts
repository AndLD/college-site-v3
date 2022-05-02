import { Response } from 'express'
import { model } from '../model/model'
import { allowedFileTypes } from '../utils/constants'
import { convertDocxToHtml, getAllCompatibleInputForString } from '../utils/functions'
import { IArticle } from '../utils/interfaces/articles/articles'
import { Error, FileData, ModelResult } from '../utils/types'
import { googleDriveService } from './googleDrive'

const articlesCollection = 'articles'

async function add(articleMetadata: IArticle, file: FileData) {
    const docId = await addMetadataToDBFlow(articleMetadata)

    await addFileToGoogleDriveFlow(docId, file)
}

async function addMetadataToDB(obj: IArticle) {
    // Add article metadata to DB
    const [modelResult, modelError] = (await model({
        collection: articlesCollection,
        action: 'add',
        obj
    })) as [ModelResult | null, Error | null]

    if (modelError) throw modelError.msg

    if (!modelResult?.mainResult?.id) throw 'Article info was not stored to DB!'

    return modelResult.mainResult as { id: string }
}

async function addMetadataToDBFlow(articleMetadata: IArticle) {
    articleMetadata.keywords = getAllCompatibleInputForString(articleMetadata.title)
    if (articleMetadata.description) {
        articleMetadata.keywords.push(
            ...getAllCompatibleInputForString(articleMetadata.description)
        )
    }

    const mainResult = await addMetadataToDB(articleMetadata)
    const docId: string = mainResult.id

    return docId
}

async function deleteMetadataFromDB(docId: string, errorMsg: string, collection?: string) {
    const [_, deleteModelError] = await model({
        action: 'delete',
        docId,
        collection: collection || articlesCollection
    })

    if (deleteModelError) throw errorMsg
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
        await deleteMetadataFromDB(
            docId,
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

            await googleDriveService.deleteFiles([filename || docId])

            await deleteMetadataFromDB(
                docId,
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

export const articlesService = {
    add,
    addMetadataToDBFlow,
    addFileToGoogleDriveFlow,
    deleteMetadataFromDB
}
