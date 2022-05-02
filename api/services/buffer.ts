import fs from 'fs'
import path from 'path'
import { getLogger } from '../utils/logger'

const logger = getLogger('services/buffer')

export const bufferFolderPath = path.join(__dirname, '..', 'buffer')

const bufferMetadata: {
    [key: string]: {
        lastDownloadTimestamp: number
        requestsTotal: number
        size: number
    }
} = {}

const clearBufferInterval = 15 // minutes
const bufferMetadataExpiration = 30 // minutes

function _initBufferMetadata() {
    const filesList = getFilesList().filter((filename) => !filename.includes('.zip'))

    const timestamp = Date.now()

    for (const filename of filesList) {
        if (!bufferMetadata[filename]) {
            const stats = fs.statSync(path.join(bufferFolderPath, filename))

            bufferMetadata[filename] = {
                lastDownloadTimestamp: timestamp,
                requestsTotal: 0,
                size: stats?.size || 0
            }
        }
    }

    setInterval(_clearBuffer, clearBufferInterval * 1000 * 60)

    logger.info(
        `bufferMetadata successfully initialized, total records in the buffer: ${
            Object.keys(bufferMetadata).length
        }`
    )
}

function addFile(filename: string, data: Buffer) {
    try {
        const bufferedFilePath = path.join(bufferFolderPath, filename)
        fs.writeFileSync(bufferedFilePath, data)
        return bufferedFilePath
    } catch (e) {
        logger.error(e)
    }
}

function deleteFile(filename: string) {
    try {
        fs.unlinkSync(path.join(bufferFolderPath, filename))
        delete bufferMetadata[filename]
    } catch (e) {
        logger.error(e)
    }
}

function getWriteStream(fileMetadata: {
    id: string
    name: string
    fileExtension: string
    size: number
}) {
    _download(fileMetadata)

    return fs.createWriteStream(path.join(bufferFolderPath, fileMetadata.name))
}

function getFilesList() {
    return fs.readdirSync(bufferFolderPath)
}

function _download({
    name: filename,
    size
}: {
    id: string
    name: string
    fileExtension: string
    size: number
}) {
    if (bufferMetadata[filename]) {
        bufferMetadata[filename].lastDownloadTimestamp = Date.now()
        bufferMetadata[filename].requestsTotal++
    } else {
        bufferMetadata[filename] = {
            lastDownloadTimestamp: Date.now(),
            requestsTotal: 1,
            size
        }
    }
}

function _clearBuffer() {
    const deleted = []

    for (const filename in bufferMetadata) {
        // If last download of a file was happened more than 1 hour ago and requests count by last 15 minutes is less than 5 then we delete file from the buffer
        if (
            Date.now() - bufferMetadata[filename].lastDownloadTimestamp >
                bufferMetadataExpiration * 1000 * 60 &&
            bufferMetadata[filename].requestsTotal < 5
        ) {
            deleteFile(filename)
            deleted.push(filename)
        } else {
            bufferMetadata[filename].requestsTotal = 0
        }
    }

    // TODO: Check for sum size of files in the buffer, sort by timestamp and delete some count of last records according to it's sum size

    logger.info(`Buffer cleared. Deleted ${deleted.length} records [${deleted.join(', ')}]`)
}

function getBufferMetadata(filename: string) {
    return bufferMetadata[filename]
}

function doesFileAvailable(filename: string) {
    try {
        fs.statSync(path.join(bufferFolderPath, filename))
        return true
    } catch {
        return false
    }
}

_initBufferMetadata()

export const bufferService = {
    addFile,
    deleteFile,
    getWriteStream,
    getFilesList,
    getBufferMetadata,
    doesFileAvailable
}
