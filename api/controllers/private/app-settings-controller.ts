import { Request, Response } from 'express'
import { tryCatch } from '../../utils/decorators'
import { appSettingsService } from '../../services/app-settings/index'
import { Any, HttpMethod } from '../../utils/types'

type RequestData = {
    method: HttpMethod
    body: Any
}

function _parseReq(req: any) {
    const { method, body: obj }: RequestData = req

    return { method, obj }
}

export const appSettingsController = tryCatch(async function (req: Request, res: Response) {
    // Парсинг необходимых данных из запроса
    const reqData = _parseReq(req)

    const { method, obj } = reqData

    if (method !== 'GET' && method !== 'PUT')
        return res.status(405).json({
            error: 'You can only to GET or PUT app settings. Any other methods not allowed!'
        })

    let result
    switch (method) {
        case 'GET':
            result = await appSettingsService[await appSettingsService.appSettingsMode].get()
            break
        case 'PUT':
            result = await appSettingsService[await appSettingsService.appSettingsMode].set(obj)
    }

    return res.json({
        result
    })
})
