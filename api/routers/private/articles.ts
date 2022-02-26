import { Request, Response, Router } from 'express'
import { controller } from '../../controller/controller'
import multer from 'multer'

const upload = multer()

export default Router()
    // Получение статей
    .get('/', controller)
    // Добавление статей
    .post('/', upload.array('file'), (req: Request, res: Response) => {
        console.log('content-type', req.headers['content-type'])
        console.log('json', JSON.parse(req.body.json))
        console.log('file', req.files)
        res.sendStatus(200)
    })
    // Изменение статьи по id
    .put('/:id', upload.single('file'), (req: Request, res: Response) => {
        console.log('json', JSON.parse(req.body.json))
        console.log('file', req.files)
        res.sendStatus(200)
    })
    // Удаление статей по массиву id
    .delete('/', controller)
