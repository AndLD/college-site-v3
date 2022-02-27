import { Request, Response, Router } from 'express'
import { controller } from '../../controller/controller'
import multer from 'multer'
import { getFilesList } from '../../services/googleDrive'

const upload = multer()

export default Router()
    // Получение статей
    .get('/', controller)
    // Добавление статей
    .post('/', upload.array('files'), (req: Request, res: Response) => {
        console.log('content-type', req.headers['content-type'])
        console.log('json', JSON.parse(req.body.json))
        console.log('files', req.files)

        getFilesList().then((files) => {
            if (files.length) {
                console.log('Files:')
                for (const file of files) {
                    console.log(`${file.name} ${file.id}`)
                }
            } else {
                console.log('The folder is empty.')
            }

            res.sendStatus(200)
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
    .delete('/', controller)
