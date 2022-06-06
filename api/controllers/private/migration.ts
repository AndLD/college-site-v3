import { Request, Response } from 'express'
import { getLogger } from '../../utils/logger'
import { MigrationOptions } from '../../utils/types'
import { articlesMigrationService } from '../../services/migration/articles'
import { tryCatch } from '../../utils/decorators'
import { appSettingsService } from '../../services/app-settings'
import { entities } from '../../utils/constants'

const logger = getLogger('controller/private/migration')

function _parseMigrationOptions(req: Request): MigrationOptions {
    let { limit, minOldId, oldIds } = req.query as {
        limit?: string | number
        minOldId?: string | number
        oldIds?: string | number[]
    }

    if (!limit || !minOldId) {
        throw new Error('Bad value')
    }

    limit = parseInt(limit as string)
    if (isNaN(limit)) {
        throw new Error('Bad value')
    }

    // minOldId and oldIds params are mutually exclusive
    if (minOldId && oldIds) {
        throw new Error('"minOldId" and "oldIds" params are mutually exclusive')
    }

    if (minOldId) {
        minOldId = parseInt(minOldId as string)

        if (isNaN(minOldId)) {
            throw new Error('Bad value')
        }
    } else if (oldIds) {
        const strings = (oldIds as string).split(',')

        oldIds = strings.map((string) => parseInt(string))

        for (const oldId of oldIds) {
            if (isNaN(oldId)) {
                throw new Error('Bad value')
            }
        }
    }

    return { limit, minOldId, oldIds } as MigrationOptions
}

async function postMigration(req: any, res: Response) {
    const user = {
        email: req.user.email,
        status: req.user._doc.status
    }

    const entity: string = req.params.entity

    if (entity !== entities.ARTICLES && entity !== entities.NEWS) {
        return res.status(400).json({
            error: 'Bad entity'
        })
    }

    const isAutoApproveEnabled = appSettingsService
        .get()
        .actionAutoApproveEnabledForAdmins.includes(user.email)

    if (!isAutoApproveEnabled) {
        return res.status(403).json({
            error: 'Action Auto Approve required'
        })
    }

    try {
        var migrationOptions = _parseMigrationOptions(req)
    } catch (e) {
        logger.error(e)
        return res.sendStatus(400)
    }

    const result = await articlesMigrationService.migrateArticles(user, migrationOptions)

    res.json({
        result
    })
}

export const privateMigrationControllers = {
    postMigration: tryCatch(postMigration)
}
