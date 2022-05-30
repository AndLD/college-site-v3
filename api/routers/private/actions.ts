import { Router } from 'express'
import { controller } from '../../controllers/controller'
import { privateActionsControllers } from '../../controllers/private/actions'
import { hasAdminStatus, hasModeratorStatus } from '../../middlewares/auth'

export default Router()
    // Actions getting
    .get('/', hasModeratorStatus, controller)

    .get('/conflicts', hasModeratorStatus, privateActionsControllers.getActionConflicts)

    // Action getting by id
    .get('/:id', hasModeratorStatus, controller)

    .post('/approve', hasAdminStatus, privateActionsControllers.postApproveAction)

    .post('/decline', hasAdminStatus, privateActionsControllers.postDeclineAction)
