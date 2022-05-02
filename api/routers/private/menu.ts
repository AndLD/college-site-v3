import { Router } from 'express'
import { controller } from '../../controller/controller'
import { hasAdminStatus, hasModeratorStatus } from '../../middlewares/auth'
import { validateBody } from '../../middlewares/validation'

export default Router()
    // All menu blocks getting
    .get('/', hasModeratorStatus, controller)
    // Menu block getting by id
    .get('/:id', hasModeratorStatus, controller)
    // Menu block adding
    .post('/', hasAdminStatus, validateBody, controller)
    // Menu block editing by id
    .put('/:id', hasAdminStatus, validateBody, controller)
    // Menu blocks deleting by array of ids
    .delete('/', hasAdminStatus, controller)
