import { google } from 'googleapis'
import logger from '../utils/logger'
import key from '../configs/service-account.json'
import { googleDrive } from '../utils/constants'
import { Readable } from 'stream'

const drive: any = google.drive('v3')

const jwtToken = new google.auth.JWT(
    key.client_email,
    undefined,
    key.private_key,
    ['https://www.googleapis.com/auth/drive'],
    drive
)

jwtToken.authorize((err: any) => {
    if (err) logger.error(err)
    else logger.info('Google service account successfully authorized.')
})

export async function getFileIdsByDocIds(docIds: string[]) {
    let nameQueryPart = docIds
        .map(
            (docId) =>
                `name='${docId}.html' or name='${docId}.docx' or name='${docId}.pdf' or name='${docId}.json'`
        )
        .join(' or ')

    const response = await drive.files.list({
        auth: jwtToken,
        // pageSize: 10,
        q: `'${googleDrive.testFolderId}' in parents and trashed=false and (${nameQueryPart})`,
        fields: 'files(id)'
    })
    const filesInfo = response.data.files
    if (!filesInfo?.length) throw 'No file obtained'

    return filesInfo.map(({ id }: { id: string }) => id)
}

export async function downloadFile() {}

export async function uploadFile(
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
    })
    return response.data
}

export async function updateFile(
    docId: string,
    file: { ext: string; mimetype: string; body: Buffer; size: number }
) {
    const deletionResult = await deleteFiles([docId])
    // if (!deletionResult?.length) throw 'File has not deleted!'

    const uploadingResult = await uploadFile(docId, file)

    return uploadingResult
}

export async function deleteFiles(docIds: string[]) {
    const responses = []

    const ids = await getFileIdsByDocIds(docIds)

    for (const id of ids) {
        const response = await drive.files.delete({
            auth: jwtToken,
            fileId: id
        })
        console.log(response)
        responses.push(response.data)
    }

    return responses
}
