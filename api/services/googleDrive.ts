import { google } from 'googleapis'
import logger from '../utils/logger'

const drive: any = google.drive('v3')
import key from '../configs/service-account.json'
import { googleDrive } from '../utils/constants'

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

export async function getFilesList() {
    const response = await drive.files.list({
        auth: jwtToken,
        pageSize: 10,
        q: `'${googleDrive.rootFolderId}' in parents and trashed=false`,
        fields: 'files(id, name)'
    })
    const files = response.data.files
    return files
}

export async function downloadFile() {}

export async function uploadFile() {}

export async function replaceFile() {}

export async function deleteFile() {}
