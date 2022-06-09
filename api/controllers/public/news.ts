import { Request, Response } from 'express'
import JSZip from 'jszip'
import { bufferFolderPath, bufferService } from '../../services/buffer'
import { googleDriveService } from '../../services/google-drive'
import { newsService } from '../../services/news'
import { bufferUtils } from '../../utils/buffer'
import { getLogger } from '../../utils/logger'
import { Options } from '../../utils/types'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { appSettingsService } from '../../services/app-settings'
import { tryCatch } from '../../utils/decorators'

const logger = getLogger('controller/public/news')

// TODO: Refactor: code dublicates (similar endpoint in news private route)
async function getDownloadNews(req: any, res: Response) {
    res.set('Access-Control-Expose-Headers', 'Content-Disposition')

    let ids = req.query.ids && req.query.ids.split(',')

    if (!ids)
        return res.status(400).json({
            error: '"ids" query param is missed!'
        })

    let options: Options | undefined =
        req.headers['download-options'] && JSON.parse(req.headers['download-options'])

    ;[ids, options] = (await newsService.replaceOldIds(ids, options)) as [string[], Options]

    const bufferOptions =
        (options && bufferService.getBufferAvailableOptions('news', ids, options)) || undefined

    const substractedOptions =
        (options && bufferOptions && bufferUtils.substractOptions(options, bufferOptions)) ||
        undefined

    const filenames: {
        path: string
        name: string
    }[] = []

    for (const id in bufferOptions) {
        for (const bufferOption of bufferOptions[id]) {
            const filename = `${id}.${bufferOption}`

            if (substractedOptions && !substractedOptions[id]?.includes(bufferOption)) {
                bufferService.recordDownload({ name: filename })
            }

            filenames.push({
                path: `${bufferFolderPath}/${filename}`,
                name: filename
            })
        }
    }

    if (substractedOptions && Object.keys(substractedOptions).length) {
        const downloadedFilenames = await googleDriveService.downloadFiles(
            ids,
            'news',
            substractedOptions
        )

        if (!downloadedFilenames.length) {
            return res.sendStatus(404)
        }

        filenames.push(...downloadedFilenames)
    }

    // If we have single file we send it to download
    if (filenames.length === 1) {
        return res.download(filenames[0].path)
    } else if (filenames.length === 0) {
        return res.sendStatus(404)
    }

    // Else we create an archive, fill it with our files and send to download
    const zip = new JSZip()

    for (const filename of filenames) {
        zip.file(filename.name, fs.readFileSync(filename.path))
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
    const zipName = `${uuidv4()}.zip`

    bufferService.addFile(zipName, zipBuffer)

    res.download(`${bufferFolderPath}/${zipName}`, (err) => {
        if (err) {
            logger.error('Error sending file: ', err)
        }

        bufferService.deleteFile(zipName)
    })
}

function getPinnedNewsIds(_: Request, res: Response) {
    const pinnedNewsIds = appSettingsService.get().pinnedNewsIds || []

    res.json({
        result: pinnedNewsIds
    })
}

export const publicNewsControllers = {
    getDownloadNews: tryCatch(getDownloadNews),
    getPinnedNewsIds: tryCatch(getPinnedNewsIds)
}
