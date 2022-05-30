import { Request, Response } from 'express'
import { getCollectionLength } from '../../model/model'
import { bufferService } from '../../services/buffer'
import { entities, startTimestamp } from '../../utils/constants'
import { tryCatch } from '../../utils/decorators'

async function getStatistics(_: Request, res: Response) {
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
}

export const privateStatisticsControllers = {
    getStatistics: tryCatch(getStatistics)
}
