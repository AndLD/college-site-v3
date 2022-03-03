import { Request, Response, Router } from 'express'
import { controller } from '../../controller/controller'
import multer from 'multer'
import { deleteFiles, uploadFile } from '../../services/googleDrive'
import { model } from '../../model/model'
import { IArticle } from '../../utils/interfaces/articles/articles'
import { Error, ModelResult } from '../../utils/types'
import { getAllCompatibleInputForString } from '../../utils/functions'

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

export default Router()
    // Получение статей
    .get('/', controller)
    // Добавление статьи
    .post('/', upload.array('file'), async (req: any, res: Response) => {
        const email = req.user.email
        const entity = req.entity

        const body: IArticlePost = JSON.parse(req.body.json)

        const files = (req.files as any[]).map((file) => {
            const ext = file.originalname.split('.')[1] as 'html' | 'docx' | 'pdf' | 'json'

            if (!ext) throw 'No file extension!'

            return {
                ext,
                mimetype: allowedFileTypes[ext],
                body: file.buffer,
                size: file.size
            }
        })

        const timestamp = Date.now()

        const file = files[0]
        const data: any = {}
        data[file.ext] = true

        const obj: IArticle = {
            ...body,
            timestamp,
            publicTimestamp: body.publicTimestamp || timestamp,
            data,
            keywords: getAllCompatibleInputForString(`${body.title}.${body.description}`),
            user: email
        }

        const [modelResult, modelError] = (await model({
            collection: entity,
            action: 'add',
            obj
        })) as [ModelResult | null, Error | null]

        if (modelError)
            return res.status(modelError.code || 500).json({
                error: modelError.msg
            })

        if (!modelResult?.mainResult?.id)
            return res.status(500).json({
                error: 'Article info was not stored to Firestore!'
            })

        // console.log(file)
        console.log(req.files[0])

        const result: { id: string } = await uploadFile(modelResult.mainResult.id, file)
        if (!result?.id) {
            // Если файл в Google Drive не записался, удаляем запись из Firestore
            const [_, deleteModelError] = await model({
                action: 'delete',
                docId: modelResult.mainResult.id,
                collection: req.entity
            })

            if (deleteModelError)
                return res.status(500).json({
                    error: 'Article was not stored to Google Drive! But article info is stored to Firestore!'
                })

            return res.status(500).json({
                error: 'Article was not stored to Google Drive!'
            })
        }

        return res.json({
            result: modelResult?.mainResult
        })
    })
    // Изменение статьи по id
    .put('/:id', upload.single('files'), (req: Request, res: Response) => {
        // console.log('content-type', req.headers['content-type'])
        // console.log('json', JSON.parse(req.body.json))
        // console.log('files', req.files)
        res.sendStatus(200)
    })
    // Удаление статей по массиву id
    .delete('/', async (req: any, res: Response) => {
        const ids = req.query.ids?.split(',')
        const entity = req.entity

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        await deleteFiles(ids)

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
