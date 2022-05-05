import { google } from 'googleapis'
import { getLogger } from '../utils/logger'
import key from '../configs/service-account.json'
import { environment, googleDrive } from '../utils/constants'
import { Readable } from 'stream'
import { bufferFolderPath, bufferService } from './buffer'
import { AllowedFileExtension, EntityName } from '../utils/types'

const logger = getLogger('services/googleDrive')

const drive = google.drive('v3')

const jwtToken = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/drive']
})

jwtToken.authorize((err: any) => {
    if (err) logger.error(err)
    else logger.info('Google service account successfully authorized.')
})

// TODO: Wrap each function of googleDrive service with try-catch

function _getFolderIdByEntity(entity: 'articles' | 'news') {
    if (environment === 'dev') {
        if (entity === 'articles') {
            return googleDrive.testArticlesFolderId
        } else if (entity === 'news') {
            return googleDrive.testNewsFolderId
        }
    } else if (environment === 'prod') {
        if (entity === 'articles') {
            return googleDrive.articlesFolderId
        } else if (entity === 'news') {
            return googleDrive.newsFolderId
        }
    } else throw 'Invalid "environment" variable!'
}

async function getFilesMetadataByDocIds(
    docIds: string[],
    entity: 'articles' | 'news',
    options?: {
        [key: string]: [
            AllowedFileExtension,
            AllowedFileExtension?,
            AllowedFileExtension?,
            AllowedFileExtension?
        ]
    }
) {
    const folderId = _getFolderIdByEntity(entity)

    const nameCondition = docIds
        .map((docId) =>
            ((options && options[docId]) || ['html', 'docx', 'pdf', 'json'])
                .map((ext) => `name="${docId}.${ext}"`)
                .join(' or ')
        )
        .join(' or ')

    const response = await drive.files.list({
        auth: jwtToken,
        q: `'${folderId}' in parents and trashed=false and (${nameCondition})`,
        fields: 'files(id, name, fileExtension, size)'
    })
    const fileMetadatas = response.data.files

    if (!fileMetadatas?.length) return []

    return fileMetadatas.map(
        ({ id, name, fileExtension, size }: any) =>
            ({
                id,
                name,
                fileExtension,
                size
            } as { id: string; name: string; fileExtension: AllowedFileExtension; size: number })
    )
}

async function downloadFiles(
    docIds: string[],
    entity: 'articles' | 'news',
    options?: {
        [key: string]: [
            AllowedFileExtension,
            AllowedFileExtension?,
            AllowedFileExtension?,
            AllowedFileExtension?
        ]
    }
) {
    const filesMetadata = await getFilesMetadataByDocIds(docIds, entity, options)

    const filenames = []

    for (const fileMetadata of filesMetadata) {
        const filename = await _downloadFile(fileMetadata)
        if (filename) {
            filenames.push(filename)
        }
    }

    return filenames.map((filename) => ({
        path: `${bufferFolderPath}/${filename}`,
        name: filename
    }))
}

async function _downloadFile(fileMetadata: {
    id: string
    name: string
    fileExtension: string
    size: number
}) {
    const filename = fileMetadata.name

    if (bufferService.getBufferMetadata(filename) && bufferService.doesFileAvailable(filename)) {
        return filename
    }

    const response = await drive.files.get(
        {
            auth: jwtToken,
            fileId: fileMetadata.id,
            alt: 'media'
        },
        { responseType: 'stream' }
    )

    const dest = bufferService.getWriteStream(fileMetadata)

    try {
        await new Promise((resolve, reject) => {
            response.data
                .on('end', () => {
                    resolve(null)
                })
                .on('error', (err) => {
                    reject(err)
                })
                .pipe(dest)
        })
    } catch (e) {
        logger.error(`Error happened trying to download file [${filename}]: ${e}`)
        bufferService.deleteFile(filename)
        return null
    }

    logger.info(`File [${filename}] successfully downloaded from Google Drive!`)

    return filename
}

async function uploadFile(
    filename: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number }
) {
    const response = await drive.files.create({
        auth: jwtToken,
        resource: {
            name: `${filename}.${file.ext}`,
            parents: [googleDrive.testArticlesFolderId]
        },
        media: {
            mimeType: file.mimetype,
            body: Readable.from(file.body)
        },
        fields: 'id'
    } as any)
    return response.data
}

// async function updateFile(
//     docId: string,
//     file: { ext: string; mimetype: string; body: Buffer; size: number }
// ) {
//     // TODO: Check if specified file truly deleted
//     await deleteFiles([docId])

//     const uploadingResult = await uploadFile(docId, file)

//     return uploadingResult
// }

async function updateFilename(
    filename: string,
    newFilename: string,
    entity: 'articles' | 'news',
    options?: {
        [key: string]: [
            AllowedFileExtension,
            AllowedFileExtension?,
            AllowedFileExtension?,
            AllowedFileExtension?
        ]
    },
    fileId?: string
) {
    if (!fileId) {
        var [fileMetadata] = await getFilesMetadataByDocIds([filename], entity, options)
    }

    await drive.files.update({
        auth: jwtToken,
        fileId: fileId || fileMetadata.id,
        requestBody: { name: newFilename }
    })
}

async function deleteFiles(docIds: string[], entity: 'articles' | 'news') {
    const promises = []

    const fileMetadatas = await getFilesMetadataByDocIds(docIds, entity)

    for (const fileMetadata of fileMetadatas) {
        const promise = drive.files.delete({
            auth: jwtToken,
            fileId: fileMetadata.id
        })
        promises.push(promise)

        if (
            bufferService.getBufferMetadata(fileMetadata.name) &&
            bufferService.doesFileAvailable(fileMetadata.name)
        ) {
            bufferService.deleteFile(fileMetadata.name)
        }
    }

    const responses = await Promise.all(promises)

    return responses.map(({ data }: any) => data)
}

export const googleDriveService = {
    downloadFiles,
    uploadFile,
    // updateFile,
    deleteFiles,
    updateFilename,
    getFilesMetadataByDocIds
}
