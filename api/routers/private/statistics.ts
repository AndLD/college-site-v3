import { Request, Response, Router } from 'express'
import { hasModeratorStatus } from '../../middlewares/auth'
import { getCollectionLength } from '../../model/model'
import { bufferService } from '../../services/buffer'
import { googleDriveService } from '../../services/google-drive'
import { entities, startTimestamp } from '../../utils/constants'

export default Router()
    // Get statistics
    .get('/', hasModeratorStatus, async (req: Request, res: Response) => {
        // total articles
        // total news
        // total menu blocks
        // total users
        // total actions (articles: add / update / delete; news: add / update / delete)
        // Up time / start time
        // Total buffer folder taken space

        // Google Drive ROOT folder taken space
        // the most active users (top users with the largest amount of actions)
        // total errors count (and separately articles / news / menu / users / actions / app-settings)
        // Top 5 most requested articles

        const result = {
            startTimestamp,
            articlesTotal: await getCollectionLength(entities.ARTICLES),
            newsTotal: await getCollectionLength(entities.NEWS),
            menuTotal: await getCollectionLength(entities.MENU),
            usersTotal: await getCollectionLength(entities.USERS),
            actionsTotal: await getCollectionLength(entities.ACTIONS),
            bufferServiceSizeTotal: bufferService.getTotalSize()
        }

        return res.json(result)
    })
