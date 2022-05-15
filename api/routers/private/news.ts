import { Response, Router } from 'express'
import { controller } from '../../controller/controller'
import multer from 'multer'
import {
    IAction,
    NewsAllowedFileExtension,
    NewsFileData,
    NewsAllowedFileType,
    Options
} from '../../utils/types'
import JSZip from 'jszip'
import fs from 'fs'
import { bufferFolderPath, bufferService } from '../../services/buffer'
import { v4 as uuidv4 } from 'uuid'
import { getLogger } from '../../utils/logger'
import { actionsService } from '../../services/actions'
import { newsAllowedFileTypes } from '../../utils/constants'
import { firebase } from '../../configs/firebase-config'
import { getAllCompatibleInputForString } from '../../utils/functions'
import { bufferUtils } from '../../utils/buffer'
import { appSettingsService } from '../../services/appSettings'
import { INews, INewsPost, INewsPut, INewsUpdate, NewsData } from '../../utils/interfaces/news/news'
import { newsService } from '../../services/news'
import { googleDriveService } from '../../services/googleDrive'

const logger = getLogger('routes/private/news')

const upload = multer()

interface IRequestFile {
    originalname: string
    buffer: Buffer
    size: number
}

function processFile(file: IRequestFile): NewsFileData {
    const nameSplittedByDot = file.originalname.split('.')
    const ext = nameSplittedByDot[nameSplittedByDot.length - 1]

    if (!ext) throw 'No file extension!'

    if (!Object.keys(newsAllowedFileTypes).includes(ext)) throw 'Bad file extension!'

    return {
        ext,
        mimetype: newsAllowedFileTypes[ext as NewsAllowedFileExtension] as NewsAllowedFileType,
        body: file.buffer,
        size: file.size
    }
}

export default Router()
    // News getting
    .get('/', controller)

    // Download news
    .get('/download', async (req: any, res: Response) => {
        res.set('Access-Control-Expose-Headers', 'Content-Disposition')

        let ids = req.query.ids && req.query.ids.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        ids = await newsService.replaceOldIds(ids)

        const options: Options | undefined =
            req.headers['download-options'] && JSON.parse(req.headers['download-options'])

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
                return res.sendStatus(500)
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
    })

    // News getting by id
    .get('/:id', controller)

    // TODO: Add validation middleware
    // News adding
    .post(
        '/',
        upload.fields([
            { name: 'file', maxCount: 1 },
            { name: 'image', maxCount: 1 }
        ]),
        async (req: any, res: Response) => {
            const user = {
                email: req.user.email,
                status: req.user._doc.status
            }
            const timestamp = Date.now()

            try {
                var body: INewsPost = JSON.parse(req.body.json)
                var file = req.files.file[0] && processFile(req.files.file[0])
                var image =
                    req.files.image?.length && req.files.image[0] && processFile(req.files.image[0])

                if (!file) {
                    throw 'File missed'
                }
            } catch (e) {
                logger.error(e)
                return res.status(400).json({
                    error: e
                })
            }

            if (body.oldId) {
                // TODO: Rename the variable :)
                const sameOldIdNewsIds = await newsService.checkOldIdUsage(body.oldId)
                if (sameOldIdNewsIds.length) {
                    return res.status(400).json({
                        error: `"oldId" is used by news [${sameOldIdNewsIds.join(', ')}]`
                    })
                }
            }

            const data: NewsData = {}
            data[file.ext as NewsAllowedFileExtension] = true
            if (file.mimetype === newsAllowedFileTypes.docx) {
                data.html = true
            }
            if (image?.ext === 'png') {
                data.png = true
            }

            const newsMetadata: INews = {
                ...body,
                publicTimestamp: timestamp,
                data,
                user: user.email
            }
            if (body.publicTimestamp) newsMetadata.publicTimestamp = timestamp

            const docId = firebase.db.collection('news').doc().id
            const actionId = firebase.db.collection('actions').doc().id

            const actionMetadata: IAction = {
                entity: 'news',
                action: 'add',
                status: user.status === 'admin' ? 'approved' : 'pending',
                payload: newsMetadata,
                payloadIds: [docId],
                user: user.email,
                keywords: [
                    ...getAllCompatibleInputForString(actionId),
                    ...getAllCompatibleInputForString(docId)
                ],
                timestamp
            }

            // If action auto approve disabled for current admin
            if (
                user.status === 'admin' &&
                !appSettingsService.get().actionAutoApproveEnabledForAdmins?.includes(user.email)
            ) {
                actionMetadata.status = 'pending'
            }

            try {
                await actionsService.addAction(actionId, actionMetadata, file, image)

                if (actionMetadata.status === 'pending') {
                    return res.json({
                        result: { actionId }
                    })
                }

                var result = await newsService.addNews(docId, newsMetadata, file, image)
            } catch (e: any) {
                logger.error(e)
                return res.status(500).json({
                    error: e
                })
            }

            return res.json({
                result
            })
        }
    )

    // News editing by id
    .put(
        '/:id',
        upload.fields([
            { name: 'file', maxCount: 1 },
            { name: 'image', maxCount: 1 }
        ]),
        async (req: any, res: Response) => {
            const user = {
                email: req.user.email,
                status: req.user._doc.status
            }
            let docId = req.params.id

            const newsMetadatas = await newsService.checkMetadatasExistance([docId])
            if (!newsMetadatas.length) {
                return res.sendStatus(404)
            }
            const newsMetadata = newsMetadatas[0]

            const body: INewsPut = JSON.parse(req.body.json)

            if (body.oldId) {
                // TODO: Rename the variable :)
                const sameOldIdNewsIds = await newsService.checkOldIdUsage(body.oldId)
                if (sameOldIdNewsIds.length) {
                    return res.status(400).json({
                        error: `"oldId" is used by news [${sameOldIdNewsIds.join(', ')}]`
                    })
                }
            }

            const newsMetadataUpdate: INewsUpdate = {
                ...body
            }

            try {
                var file =
                    req.files.file?.length && req.files.file[0] && processFile(req.files.file[0])
                var image =
                    req.files.image?.length && req.files.image[0] && processFile(req.files.image[0])
            } catch (e) {
                logger.error(e)
                return res.status(400).json({
                    error: e
                })
            }

            const data: any = newsMetadata.data

            if (file) {
                data.docx = false
                data.html = false

                data[file.ext] = true
                if (file.mimetype === newsAllowedFileTypes.docx) {
                    data.html = true
                }
            }
            if (image?.ext === 'png') {
                data[image.ext] = true
            }

            if (Object.keys(data).length) {
                newsMetadataUpdate.data = data
            }

            const actionId = firebase.db.collection('actions').doc().id

            const actionMetadata: IAction = {
                entity: 'news',
                action: 'update',
                status: user.status === 'admin' ? 'approved' : 'pending',
                payload: newsMetadataUpdate,
                payloadIds: [docId],
                user: user.email,
                keywords: [
                    ...getAllCompatibleInputForString(actionId),
                    ...getAllCompatibleInputForString(docId)
                ],
                timestamp: Date.now()
            }

            // If action auto approve disabled for current admin
            if (
                user.status === 'admin' &&
                !appSettingsService.get().actionAutoApproveEnabledForAdmins?.includes(user.email)
            ) {
                actionMetadata.status = 'pending'
            }

            try {
                await actionsService.addAction(actionId, actionMetadata, file, image)

                if (actionMetadata.status === 'pending') {
                    return res.json({
                        result: { actionId }
                    })
                }

                var result = await newsService.updateNews(docId, newsMetadataUpdate, file, image)
            } catch (e: any) {
                logger.error(e)
                return res.status(500).json({
                    error: e
                })
            }

            return res.json({
                result
            })
        }
    )

    // News deleting by array of ids
    .delete('/', async (req: any, res: Response) => {
        const user = {
            email: req.user.email,
            status: req.user._doc.status
        }

        let ids = req.query.ids && req.query.ids.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        const newsMetadatas = await newsService.checkMetadatasExistance(ids)
        if (!newsMetadatas.length) {
            return res.sendStatus(404)
        }
        ids = newsMetadatas.map((newsMetadata: INews) => newsMetadata.id)

        const actionId = firebase.db.collection('actions').doc().id

        const keywords = [...getAllCompatibleInputForString(actionId)]
        for (const id of ids) {
            keywords.push(...getAllCompatibleInputForString(id))
        }

        const actionMetadata: IAction = {
            entity: 'news',
            action: 'delete',
            status: user.status === 'admin' ? 'approved' : 'pending',
            payload: {},
            payloadIds: ids,
            user: user.email,
            keywords,
            timestamp: Date.now()
        }

        // If action auto approve disabled for current admin
        if (
            user.status === 'admin' &&
            !appSettingsService.get().actionAutoApproveEnabledForAdmins?.includes(user.email)
        ) {
            actionMetadata.status = 'pending'
        }

        try {
            await actionsService.addAction(actionId, actionMetadata)

            if (actionMetadata.status === 'pending') {
                return res.json({
                    result: { actionId }
                })
            }

            await newsService.deleteNews(ids)
        } catch (e) {
            logger.error(e)
            return res.status(500).json({
                error: e
            })
        }

        return res.json({
            result: null
        })
    })
