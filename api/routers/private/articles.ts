import { Response, Router } from 'express'
import { controller } from '../../controller/controller'
import multer from 'multer'
import { googleDriveService } from '../../services/googleDrive'
import {
    ArticleData,
    IArticle,
    IArticlePut,
    IArticleUpdate
} from '../../utils/interfaces/articles/articles'
import {
    AllowedFileExtension,
    AllowedFileType,
    FileData,
    IAction,
    Options
} from '../../utils/types'
import JSZip from 'jszip'
import fs from 'fs'
import { bufferFolderPath, bufferService } from '../../services/buffer'
import { v4 as uuidv4 } from 'uuid'
import { getLogger } from '../../utils/logger'
import { articlesService } from '../../services/articles'
import { actionsService } from '../../services/actions'
import { allowedFileTypes } from '../../utils/constants'
import { firebase } from '../../configs/firebase-config'
import { getAllCompatibleInputForString } from '../../utils/functions'
import { bufferUtils } from '../../utils/buffer'
import { appSettingsService } from '../../services/appSettings'

const logger = getLogger('routes/private/articles')

const upload = multer()

interface IArticlePost {
    oldId?: number
    title: string
    description?: string
    tags?: string[]
    publicTimestamp?: number
}

interface IRequestFile {
    originalname: string
    buffer: Buffer
    size: number
}

function processFile(file: IRequestFile): FileData {
    const nameSplittedByDot = file.originalname.split('.')
    const ext = nameSplittedByDot[nameSplittedByDot.length - 1]

    if (!ext) throw 'No file extension!'

    if (!Object.keys(allowedFileTypes).includes(ext)) throw 'Bad file extension!'

    return {
        ext,
        mimetype: allowedFileTypes[ext as AllowedFileExtension] as AllowedFileType,
        body: file.buffer,
        size: file.size
    }
}

export default Router()
    // Articles getting
    .get('/', controller)

    // Download articles
    .get('/download', async (req: any, res: Response) => {
        res.set('Access-Control-Expose-Headers', 'Content-Disposition')

        let ids = req.query.ids && req.query.ids.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        ids = await articlesService.replaceOldIds(ids)

        const options: Options | undefined =
            req.headers['download-options'] && JSON.parse(req.headers['download-options'])

        const bufferOptions =
            (options && bufferService.getBufferAvailableOptions(ids, options)) || undefined

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

        console.log('options', options)
        console.log('bufferOptions', bufferOptions)
        console.log('substractedOptions', substractedOptions)

        if (substractedOptions && Object.keys(substractedOptions).length) {
            const downloadedFilenames = await googleDriveService.downloadFiles(
                ids,
                'articles',
                substractedOptions
            )

            if (!downloadedFilenames.length) {
                return res.sendStatus(500)
            }

            filenames.push(...downloadedFilenames)
        }

        console.log('filenames', filenames)

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

    // Article getting by id
    .get('/:id', controller)

    // TODO: Add validation middleware
    // Article adding
    .post('/', upload.single('file'), async (req: any, res: Response) => {
        const user = {
            email: req.user.email,
            status: req.user._doc.status
        }
        const timestamp = Date.now()

        const body: IArticlePost = JSON.parse(req.body.json)

        if (body.oldId) {
            // TODO: Rename the variable :)
            const sameOldIdArticleIds = await articlesService.checkOldIdUsage(body.oldId)
            if (sameOldIdArticleIds.length) {
                return res.status(400).json({
                    error: `"oldId" is used by articles [${sameOldIdArticleIds.join(', ')}]`
                })
            }
        }

        try {
            var file = req.file && processFile(req.file)

            if (!file) {
                throw 'File missed'
            }
        } catch (e) {
            logger.error(e)
            return res.status(400).json({
                error: e
            })
        }

        const data: ArticleData = {}
        data[file.ext as AllowedFileExtension] = true
        if (file.mimetype === allowedFileTypes.docx) {
            data.html = true
        }

        const articleMetadata: IArticle = {
            ...body,
            publicTimestamp: timestamp,
            data,
            user: user.email
        }
        if (body.publicTimestamp) articleMetadata.publicTimestamp = timestamp

        const docId = firebase.db.collection('articles').doc().id
        const actionId = firebase.db.collection('actions').doc().id

        const actionMetadata: IAction = {
            entity: 'articles',
            action: 'add',
            status: user.status === 'admin' ? 'approved' : 'pending',
            payload: articleMetadata,
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
            await actionsService.addAction(actionId, actionMetadata, file)

            if (actionMetadata.status === 'pending') {
                return res.json({
                    result: { actionId }
                })
            }

            var result = await articlesService.addArticle(docId, articleMetadata, file)
        } catch (e: any) {
            logger.error(e)
            return res.status(500).json({
                error: e
            })
        }

        return res.json({
            result
        })
    })

    // Article editing by id
    .put('/:id', upload.single('file'), async (req: any, res: Response) => {
        const user = {
            email: req.user.email,
            status: req.user._doc.status
        }
        let docId = req.params.id

        const checkedArticleIds = await articlesService.checkMetadatasExistance([docId])
        if (!checkedArticleIds.length) {
            return res.sendStatus(404)
        }

        ;[docId] = checkedArticleIds

        const body: IArticlePut = JSON.parse(req.body.json)

        if (body.oldId) {
            // TODO: Rename the variable :)
            const sameOldIdArticleIds = await articlesService.checkOldIdUsage(body.oldId)
            if (sameOldIdArticleIds.length) {
                return res.status(400).json({
                    error: `"oldId" is used by articles [${sameOldIdArticleIds.join(', ')}]`
                })
            }
        }

        const articleMetadataUpdate: IArticleUpdate = {
            ...body
        }

        try {
            var file = req.file && processFile(req.file)
        } catch (e) {
            logger.error(e)
            return res.status(400).json({
                error: e
            })
        }

        if (file) {
            const data: any = {
                docx: false,
                html: false,
                pdf: false,
                json: false
            }
            data[file.ext] = true
            if (file.mimetype === allowedFileTypes.docx) {
                data.html = true
            }

            articleMetadataUpdate.data = data
        }

        const actionId = firebase.db.collection('actions').doc().id

        const actionMetadata: IAction = {
            entity: 'articles',
            action: 'update',
            status: user.status === 'admin' ? 'approved' : 'pending',
            payload: articleMetadataUpdate,
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
            await actionsService.addAction(actionId, actionMetadata, file)

            if (actionMetadata.status === 'pending') {
                return res.json({
                    result: { actionId }
                })
            }

            var result = await articlesService.updateArticle(docId, articleMetadataUpdate, file)
        } catch (e: any) {
            logger.error(e)
            return res.status(500).json({
                error: e
            })
        }

        return res.json({
            result
        })
    })

    // Articles deleting by array of ids
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

        ids = await articlesService.checkMetadatasExistance(ids)
        if (!ids.length) {
            return res.sendStatus(404)
        }

        const actionId = firebase.db.collection('actions').doc().id

        const keywords = [...getAllCompatibleInputForString(actionId)]
        for (const id of ids) {
            keywords.push(...getAllCompatibleInputForString(id))
        }

        const actionMetadata: IAction = {
            entity: 'articles',
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

            await articlesService.deleteArticles(ids)
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
