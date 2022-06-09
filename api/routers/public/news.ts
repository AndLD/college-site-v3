import { Router } from 'express'
import { controller } from '../../controllers/controller'
import { publicNewsControllers } from '../../controllers/public/news'

export default Router()
    // News getting
    .get('/', controller)

    // Download news
    .get('/download', publicNewsControllers.getDownloadNews)

    // Get pinned news ids
    .get('/pinned', publicNewsControllers.getPinnedNewsIds)

    // News getting by id
    .get('/:id', controller)
