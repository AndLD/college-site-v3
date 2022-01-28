import { Any, EntityName, HttpMethod } from '../utils/types'
import { IMenuBlockPost, IMenuBlockPut, IMenuElement } from '../utils/interfaces/menu/menu-ti'
import { IAppSettingsPut } from '../utils/interfaces/app-settings/app-settings-ti'
import { Checker, createCheckers } from 'ts-interface-checker'
import { NextFunction, Request, Response } from 'express'
import { entities } from '../utils/constants'

// Validate request body for accordance to interface of specified entity
export const validateBody = (req: Request, res: Response, next: NextFunction) => {
    const entity: EntityName = (req as Any).entity
    const method: HttpMethod = req.method as HttpMethod
    if (!entity) return res.sendStatus(500)

    let error: string | undefined
    switch (entity) {
        case entities.MENU:
            if (method === 'POST')
                var { IMenuBlockPost: IMenuBlockChecker } = createCheckers({ IMenuBlockPost }, { IMenuElement })
            else if (method === 'PUT')
                var { IMenuBlockPut: IMenuBlockChecker } = createCheckers({ IMenuBlockPut }, { IMenuElement })

            error = checkInterface(req.body, IMenuBlockChecker)
            break
        case entities.APP_SETTINGS:
            if (method === 'PUT') var { IAppSettingsPut: IAppSettingsChecker } = createCheckers({ IAppSettingsPut })

            error = checkInterface(req.body, IAppSettingsChecker)
            break
        default:
            return res.sendStatus(500)
    }

    if (error)
        return res.status(400).json({
            msg: error
        })

    next()
}

function checkInterface(body: Any, checker: Checker) {
    try {
        checker.strictCheck(body)
    } catch (e) {
        return (e as string).toString()
    }
}
