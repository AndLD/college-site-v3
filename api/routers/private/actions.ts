import { Response, Router } from 'express'
import { controller } from '../../controller/controller'
import { hasAdminStatus, hasModeratorStatus } from '../../middlewares/auth'
import { actionsService } from '../../services/actions'
import { IAction } from '../../utils/types'

export default Router()
    // Actions getting
    .get('/', hasModeratorStatus, controller)

    .get('/conflicts', hasModeratorStatus, async (req: any, res: Response) => {
        const actionId = req.query.action_id
        const articleId = req.query.article_id

        if (!actionId && !articleId) {
            return res.status(400).json({
                error: 'One query param should be specified: ["action_id", "article_id"]'
            })
        }

        const conflicts = await actionsService.getConflicts(actionId ? { actionId } : { articleId })

        res.json({
            result: conflicts
        })
    })

    .post('/approve', hasAdminStatus, async (req: any, res: Response) => {
        const ids = req.query.ids && req.query.ids.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        await actionsService.updateActions(ids, 'approved')

        res.sendStatus(200)
    })

    .post('/decline', hasAdminStatus, async (req: any, res: Response) => {
        const ids = req.query.ids && req.query.ids.split(',')

        if (!ids)
            return res.status(400).json({
                error: '"ids" query param is missed!'
            })

        await actionsService.updateActions(ids, 'declined')

        res.sendStatus(200)
    })
