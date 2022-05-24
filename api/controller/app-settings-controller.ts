import { Request, Response } from 'express'
import { tryCatch } from '../utils/decorators'
import { appSettingsService } from '../services/app-settings'
import { Any, DefaultResult, HttpMethod } from '../utils/types'

export const appSettingsController = tryCatch(async function (req: Request, res: Response) {
    // Парсинг необходимых данных из запроса
    const [reqData, parseReqError] = parseReq(req) as DefaultResult
    if (parseReqError)
        return res.status(parseReqError.code).json({
            error: parseReqError.msg
        })
    const { method, obj } = reqData as {
        method: HttpMethod
        obj: Any
    }

    if (method !== 'GET' && method !== 'PUT')
        return res.status(405).json({
            error: 'You can only to GET or PUT app settings. Any other methods not allowed!'
        })

    let result
    switch (method) {
        case 'GET':
            result = appSettingsService.get()
            break
        case 'PUT':
            result = appSettingsService.set(obj)
    }

    return res.json({
        result
    })
})

function parseReq(req: any) {
    const {
        method,
        body: obj,
        user: { email }
    }: {
        method: HttpMethod
        body: Any
        user: {
            email: string
        }
    } = req

    return [{ method, obj, email }, null]
}
