import { Response, Router } from 'express'
import { controller } from '../../controllers/controller'
import multer from 'multer'
import { googleDriveService } from '../../services/google-drive'
import { Options } from '../../utils/types'
import JSZip from 'jszip'
import fs from 'fs'
import { bufferFolderPath, bufferService } from '../../services/buffer'
import { v4 as uuidv4 } from 'uuid'
import { getLogger } from '../../utils/logger'
import { articlesService } from '../../services/articles'
import { bufferUtils } from '../../utils/buffer'
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
