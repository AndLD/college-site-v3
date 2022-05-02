import { Response, Router } from 'express'
import { controller } from '../../controller/controller'
import { hasAdminStatus, hasModeratorStatus } from '../../middlewares/auth'
import { actionsService } from '../../services/actions'

export default Router()
    // Actions getting
    .get('/', hasModeratorStatus, controller)

    .post('/approve', hasAdminStatus, async (req: any, res: Response) => {
        const ids = req.query.ids?.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        actionsService.updateActions(ids, 'approved')

        res.sendStatus(200)
    })

    .post('/decline', hasAdminStatus, async (req: any, res: Response) => {
        const ids = req.query.ids?.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        actionsService.updateActions(ids, 'declined')

        res.sendStatus(200)
    })
