import { Response } from 'express'
import { actionsService } from '../../services/actions'
import { tryCatch } from '../../utils/decorators'

async function getActionConflicts(req: any, res: Response) {
    const actionId = req.query.action_id
    const articleId = req.query.article_id
    const newsId = req.query.news_id

    if (
        (!actionId && !articleId && !newsId) ||
        (articleId && newsId) ||
        (actionId && articleId) ||
        (actionId && newsId)
    ) {
        return res.status(400).json({
            error: 'One query param should be specified: ["action_id", "article_id", "news_id"]'
        })
    }

    const conflicts = await actionsService.getConflicts({ actionId, articleId, newsId })

    res.json({
        result: conflicts
    })
}

async function postApproveAction(req: any, res: Response) {
    const ids = req.query.ids && req.query.ids.split(',')

    if (!ids)
        return res.status(400).json({
            error: '"ids" query param is missed!'
        })

    const updatedActionIds = await actionsService.updateActions(ids, 'approved', req.user.email)

    res.json({
        result: updatedActionIds
    })
}

async function postDeclineAction(req: any, res: Response) {
    const ids = req.query.ids && req.query.ids.split(',')

    if (!ids)
        return res.status(400).json({
            error: '"ids" query param is missed!'
        })

    const updatedActionIds = await actionsService.updateActions(ids, 'declined', req.user.email)

    res.json({
        result: updatedActionIds
    })
}

export const privateActionsControllers = {
    getActionConflicts: tryCatch(getActionConflicts),
    postApproveAction: tryCatch(postApproveAction),
    postDeclineAction: tryCatch(postDeclineAction)
}
