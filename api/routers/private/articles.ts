import { Request, Response, Router } from 'express'
import { controller } from '../../controller/controller'
import multer from 'multer'
import { googleDriveService } from '../../services/googleDrive'
import { model } from '../../model/model'
import { IArticle } from '../../utils/interfaces/articles/articles'
import { AllowedFileExtension, Error, ModelResult } from '../../utils/types'
import { getAllCompatibleInputForString, convertDocxToHtml } from '../../utils/functions'
import JSZip from 'jszip'
import fs from 'fs'
import { bufferFolderPath, bufferService } from '../../services/buffer'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../utils/logger'
import { articlesService } from '../../services/articles'

const upload = multer()

interface IArticlePost {
    oldId?: number
    title: string
    description?: string
    tags?: string[]
    publicTimestamp?: number
}

const allowedFileTypes = {
    html: 'text/html',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf',
    json: 'application/json'
}

interface IRequestFile {
    originalname: string
    buffer: Buffer
    size: number
}

function processFile(file: IRequestFile) {
    const nameSplittedByDot = file.originalname.split('.')
    const ext = nameSplittedByDot[nameSplittedByDot.length - 1]

    if (!ext) throw 'No file extension!'

    if (!Object.keys(allowedFileTypes).includes(ext)) throw 'Bad file extension!'

    return {
        ext,
        mimetype: allowedFileTypes[ext as AllowedFileExtension],
        body: file.buffer,
        size: file.size
    }
}

export default Router()
    // Articles getting
    .get('/', controller)

    // Download articles
    .get('/download', async (req: any, res: Response) => {
        const ids = req.query.ids?.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        const options: {
            [key: string]: [
                AllowedFileExtension,
                AllowedFileExtension?,
                AllowedFileExtension?,
                AllowedFileExtension?
            ]
        } = JSON.parse(req.headers['download-options'])

        const filenames = await googleDriveService.downloadFiles(ids, options)

        if (!filenames.length) {
            res.sendStatus(500)
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

    // Article adding
    .post('/', upload.single('file'), async (req: any, res: Response) => {
        const email = req.user.email

        const body: IArticlePost = JSON.parse(req.body.json)
        const file = processFile(req.file)
        const timestamp = Date.now()

        const data: any = {}
        data[file.ext] = true
        if (file.mimetype === allowedFileTypes.docx) data.html = true

        const articleMetadata: IArticle = {
            ...body,
            timestamp,
            publicTimestamp: body.publicTimestamp || timestamp,
            data,
            keywords: getAllCompatibleInputForString(`${body.title}.${body.description}`),
            user: email
        }

        try {
            var modelResult: ModelResult = await articlesService.addMetadataToDB(articleMetadata)
            var docId: string = modelResult.mainResult?.id

            await articlesService.addFileToGoogleDrive(docId, file)
        } catch (e: any) {
            logger.error(e)
            return res.status(500).json({
                error: e
            })
        }

        // If we try to add DOCX then we should also convert this to HTML and add to Google Drive
        if (file.mimetype === allowedFileTypes.docx) {
            try {
                var html = (await convertDocxToHtml(file.body))?.value
                if (!html) throw 'Result of convertion DOCX to HTML is empty'
            } catch (e) {
                // If DOCX was not converted to HTML we should delete DOCX from Google Drive and it's document from database
                const baseErrorMsg = `Article file [${docId}.html] was not stored to Google Drive!`

                await googleDriveService.deleteFiles([docId])

                await articlesService.deleteMetadataFromDB(
                    docId,
                    `${baseErrorMsg} Unable to remove article metadata from database!`
                )

                logger.error(baseErrorMsg)
                return res.status(500).json({
                    error: baseErrorMsg
                })
            }

            const htmlBuffer = Buffer.from(html)
            const htmlFile = {
                body: htmlBuffer,
                size: htmlBuffer.length,
                ext: 'html',
                mimetype: allowedFileTypes.html
            }

            try {
                // Upload html file to Google Drive
                await articlesService.addFileToGoogleDrive(docId, htmlFile)
            } catch (e) {
                logger.error(e)
                return res.status(500).json({
                    error: e
                })
            }
        }

        return res.json({
            result: modelResult?.mainResult
        })
    })

    // Article editing by id
    .put('/:id', upload.single('files'), (req: Request, res: Response) => {
        res.sendStatus(200)
    })

    // Articles deleting by array of ids
    .delete('/', async (req: any, res: Response) => {
        const ids = req.query.ids?.split(',')
        const entity = req.entity

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        await googleDriveService.deleteFiles(ids)

        const [modelResult, modelError] = await model({
            collection: entity,
            docIds: ids,
            action: 'delete'
        })

        if (modelError)
            return res.status(modelError.code || 500).json({
                error: modelError.msg
            })

        return res.json({
            result: modelResult?.mainResult
        })
    })
