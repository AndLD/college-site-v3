import { Router } from 'express'
import { controller } from '../../controller/controller'
import { validateBody } from '../../middlewares/validation'

export default Router()
    // All menu blocks getting
    .get('/', controller)
    // Menu block getting by id
    .get('/:id', controller)
    // Menu block adding
    .post('/', validateBody, controller)
    // Menu block editing by id
    .put('/:id', validateBody, controller)
    // Menu blocks deleting by array of ids
    .delete('/', controller)
