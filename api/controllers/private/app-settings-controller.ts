import { Response } from 'express'
import { notificationsService } from '../../services/notifications'
import { appSettingsService } from '../../services/app-settings'
import { tryCatch } from '../../utils/decorators'

async function getSettings(_: any, res: Response) {
    const settings = await appSettingsService.getAll()

    return res.json({
        result: settings
    })
}

async function putSettings(req: any, res: Response) {
    const body = req.body

    const ok = await appSettingsService.set(body)

    if (body.notificationsService === true) {
        await notificationsService.init()
    } else if (body.notificationsService === false) {
        await notificationsService.stop()
    }

    return res.json({
        result: ok
    })
}

export const appSettingsPrivateControllers = {
    getSettings: tryCatch(getSettings),
    putSettings: tryCatch(putSettings)
}
