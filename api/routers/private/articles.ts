import { Request, Response, Router } from 'express'
import { controller } from '../../controller/controller'
import multer from 'multer'
import { googleDriveService } from '../../services/googleDrive'
import {
    ArticleData,
    IArticle,
    IArticlePut,
    IArticleUpdate
} from '../../utils/interfaces/articles/articles'
import { AllowedFileExtension, AllowedFileType, FileData, IAction } from '../../utils/types'
import JSZip from 'jszip'
import fs from 'fs'
import { bufferFolderPath, bufferService } from '../../services/buffer'
import { v4 as uuidv4 } from 'uuid'
import { getLogger } from '../../utils/logger'
import { articlesService } from '../../services/articles'
import { actionsService } from '../../services/actions'
import { allowedFileTypes } from '../../utils/constants'
import { firebase } from '../../configs/firebase-config'

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
        const ids = req.query.ids && req.query.ids.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        const options:
            | {
                  [key: string]: [
                      AllowedFileExtension,
                      AllowedFileExtension?,
                      AllowedFileExtension?,
                      AllowedFileExtension?
                  ]
              }
            | undefined =
            req.headers['download-options'] && JSON.parse(req.headers['download-options'])

        const filenames = await googleDriveService.downloadFiles(ids, 'articles', options)

        if (!filenames.length) {
            return res.sendStatus(500)
        }

        res.set('Access-Control-Expose-Headers', 'Content-Disposition')

        if (filenames.length === 1) {
            res.download(filenames[0].path)
        } else {
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
    })

    // TODO: Add validation middleware
    // Article adding
    .post('/', upload.single('file'), async (req: any, res: Response) => {
        const user = {
            email: req.user.email,
            status: req.user._doc.status
        }
        const timestamp = Date.now()

        const body: IArticlePost = JSON.parse(req.body.json)

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

        const actionMetadata: IAction = {
            entity: 'articles',
            action: 'add',
            status: user.status === 'admin' ? 'approved' : 'pending',
            payload: articleMetadata,
            payloadIds: [docId],
            user: user.email,
            timestamp
        }

        // TODO: Remove it after debug
        actionMetadata.status = 'pending'

        try {
            const actionId = await actionsService.addAction(actionMetadata, file)

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
        const docId = req.params.id

        const body: IArticlePut = JSON.parse(req.body.json)

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

        const actionMetadata: IAction = {
            entity: 'articles',
            action: 'update',
            status: user.status === 'admin' ? 'approved' : 'pending',
            payload: articleMetadataUpdate,
            payloadIds: [docId],
            user: user.email,
            timestamp: Date.now()
        }

        // TODO: Remove it after debug
        actionMetadata.status = 'pending'

        try {
            const actionId = await actionsService.addAction(actionMetadata, file)

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

        const ids = req.query.ids && req.query.ids.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        const actionMetadata: IAction = {
            entity: 'articles',
            action: 'delete',
            status: user.status === 'admin' ? 'approved' : 'pending',
            payload: {},
            payloadIds: ids,
            user: user.email,
            timestamp: Date.now()
        }

        // TODO: Remove it after debug
        actionMetadata.status = 'pending'

        try {
            const actionId = await actionsService.addAction(actionMetadata)

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

    // Article getting by id
    .get('/:id', controller)
