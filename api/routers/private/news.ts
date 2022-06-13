import { Router } from 'express'
import { controller } from '../../controllers/controller'
import multer from 'multer'
import { privateNewsControllers } from '../../controllers/private/news'

const upload = multer()

export default Router()
    // News getting
    .get('/', controller)

    // Download news
    .get('/download', privateNewsControllers.getDownloadNews)

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
        privateNewsControllers.postNews
    )

    // News editing by id
    .put(
        '/:id',
        upload.fields([
            { name: 'file', maxCount: 1 },
            { name: 'image', maxCount: 1 }
        ]),
        privateNewsControllers.putNews
    )

    // News deleting by array of ids
    .delete('/', privateNewsControllers.deleteNews)
