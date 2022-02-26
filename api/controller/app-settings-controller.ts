import { Request, Response } from 'express'
import { tryCatch } from '../utils/decorators'
import { getAppSettings, setAppSettings } from '../services/appSettings'
import { Any, DefaultResult, HttpMethod } from '../utils/types'

export const appSettingsController = tryCatch(async function (req: Request, res: Response) {
    // Парсинг необходимых данных из запроса
    const [reqData, parseReqError] = parseReq(req) as DefaultResult
    if (parseReqError)
        return res.status(parseReqError.code).json({
            error: parseReqError.msg
        })
    const { method, obj, email } = reqData as {
        method: HttpMethod
        obj: Any
        email: string
    }

    if (method !== 'GET' && method !== 'PUT')
        return res.status(405).json({
            error: 'You can only to GET or PUT app settings. Any other methods not allowed!'
        })

    let result
    switch (method) {
        case 'GET':
            result = getAppSettings()
            break
        case 'PUT':
            result = setAppSettings(obj)
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
