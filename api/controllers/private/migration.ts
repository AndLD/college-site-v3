import { Request, Response } from 'express'
import { getLogger } from '../../utils/logger'
import { MigrationOptions } from '../../utils/types'
import { migrationService } from '../../services/migration'
import { tryCatch } from '../../utils/decorators'

const logger = getLogger('controller/private/migration')

function _parseReq(req: Request) {
    let { skip, limit, minOldId } = req.query as {
        skip?: string | number
        limit?: string | number
        minOldId?: string | number
    }

    if (!skip && !limit) {
        throw new Error('Bad value')
    }

    if (skip) {
        skip = parseInt(skip as string)

        if (isNaN(skip)) {
            throw new Error('Bad value')
        }
    }

    limit = parseInt(limit as string)
    if (isNaN(limit)) {
        throw new Error('Bad value')
    }

    if (minOldId) {
        minOldId = parseInt(minOldId as string)

        if (isNaN(minOldId)) {
            throw new Error('Bad value')
        }
    }

    return { skip, limit, minOldId } as MigrationOptions
}

async function postMigration(req: Request, res: Response) {
    try {
        var migrationOptions = _parseReq(req)
    } catch (e) {
        logger.error(e)
        return res.sendStatus(400)
    }

    const result = await migrationService.startMigration(migrationOptions)

    res.json({
        result
    })
}

export const privateMigrationControllers = {
    postMigration: tryCatch(postMigration)
}
