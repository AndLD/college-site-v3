import { google } from 'googleapis'
import logger from '../utils/logger'
import key from '../configs/service-account.json'
import { googleDrive } from '../utils/constants'
import { Readable } from 'stream'
import { bufferFolderPath, bufferService } from './buffer'
import { appSettingsService } from './appSettings'
import { AllowedFileExtension } from '../utils/types'

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

async function _getFilesMetadataByDocIds(
    docIds: string[],
    options?: {
        [key: string]: [
            AllowedFileExtension,
            AllowedFileExtension?,
            AllowedFileExtension?,
            AllowedFileExtension?
        ]
    }
) {
    const nameCondition = docIds
        .map((docId) =>
            ((options && options[docId]) || ['html', 'docx', 'pdf', 'json'])
                .map((ext) => `name="${docId}.${ext}"`)
                .join(' or ')
        )
        .join(' or ')

    const response = await drive.files.list({
        auth: jwtToken,
        q: `'${googleDrive.testFolderId}' in parents and trashed=false and (${nameCondition})`,
        fields: 'files(id, name, fileExtension, size)'
    })
    const filesMetadata = response.data.files
    if (!filesMetadata?.length) throw 'No file obtained'

    return filesMetadata.map(
        ({ id, name, fileExtension, size }: any) =>
            ({
                id,
                name,
                fileExtension,
                size
            } as { id: string; name: string; fileExtension: string; size: number })
    )
}

async function downloadFiles(
    docIds: string[],
    options?: {
        [key: string]: [
            AllowedFileExtension,
            AllowedFileExtension?,
            AllowedFileExtension?,
            AllowedFileExtension?
        ]
    }
) {
    const filesMetadata = await _getFilesMetadataByDocIds(docIds, options)

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
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number }
) {
    const response = await drive.files.create({
        auth: jwtToken,
        resource: {
            name: `${docId}.${file.ext}`,
            parents: [googleDrive.testFolderId]
        },
        media: {
            mimeType: file.mimetype,
            body: Readable.from(file.body)
        },
        fields: 'id'
    } as any)
    return response.data
}

async function updateFile(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number }
) {
    // TODO: Check if specified file truly deleted
    await deleteFiles([docId])

    const uploadingResult = await uploadFile(docId, file)

    return uploadingResult
}

async function deleteFiles(docIds: string[]) {
    const responses = []

    const filesMetadata = await _getFilesMetadataByDocIds(docIds)

    for (const fileMetadata of filesMetadata) {
        const response = await drive.files.delete({
            auth: jwtToken,
            fileId: fileMetadata.id
        })
        responses.push(response.data)

        if (
            bufferService.getBufferMetadata(fileMetadata.name) &&
            bufferService.doesFileAvailable(fileMetadata.name)
        ) {
            bufferService.deleteFile(fileMetadata.name)
        }
    }

    return responses
}

export const googleDriveService = {
    downloadFiles,
    uploadFile,
    updateFile,
    deleteFiles
}
