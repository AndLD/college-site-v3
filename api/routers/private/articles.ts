import { Router } from 'express'
import { controller } from '../../controllers/controller'
import multer from 'multer'
import { privateArticlesControllers } from '../../controllers/private/articles'

const upload = multer()

export default Router()
    // Articles getting
    .get('/', controller)

    // Download articles
    .get('/download', privateArticlesControllers.getDownloadArticles)

    // Article getting by id
    .get('/:id', controller)

    // TODO: Add validation middleware
    // Article adding
    .post('/', upload.single('file'), privateArticlesControllers.postArticle)

    // Article editing by id
    .put('/:id', upload.single('file'), privateArticlesControllers.putArticle)

    // Articles deleting by array of ids
    .delete('/', privateArticlesControllers.deleteArticle)
