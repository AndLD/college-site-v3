import { Response } from 'express'
import { model } from '../model/model'
import { IArticle } from '../utils/interfaces/articles/articles'
import { Error, ModelResult } from '../utils/types'
import { googleDriveService } from './googleDrive'

const collection = 'articles'

async function addMetadataToDB(obj: IArticle) {
    // Add article metadata to DB
    const [modelResult, modelError] = (await model({
        collection,
        action: 'add',
        obj
    })) as [ModelResult | null, Error | null]

    if (modelError) throw modelError.msg

    if (!modelResult?.mainResult?.id) throw 'Article info was not stored to DB!'

    return modelResult
}

async function deleteMetadataFromDB(docId: string, errorMsg: string) {
    const [_, deleteModelError] = await model({
        action: 'delete',
        docId,
        collection
    })

    if (deleteModelError) throw errorMsg
}

async function addFileToGoogleDrive(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number }
) {
    // Upload file to Google Drive
    const result = (await googleDriveService.uploadFile(docId, file)) as { id: string }
    if (!result?.id) {
        // If file was not stored to Google Drive, delete record from DB
        await deleteMetadataFromDB(
            docId,
            `Article file [${docId}.${file.ext}] was not stored to Google Drive! Unable to remove article metadata from database!`
        )

        throw `Article file [${docId}.${file.ext}] was not stored to Google Drive!`
    }
}

export const articlesService = {
    addMetadataToDB,
    addFileToGoogleDrive,
    deleteMetadataFromDB
}
