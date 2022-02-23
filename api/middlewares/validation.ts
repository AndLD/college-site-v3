import { Any, EntityName, HttpMethod, UserStatus } from '../utils/types'
import { IMenuBlockPost, IMenuBlockPut, IMenuElement } from '../utils/interfaces/menu/menu-ti'
import { IAppSettingsPut } from '../utils/interfaces/app-settings/app-settings-ti'
import { IUserPutByAdmin, IUserPutByModerator } from '../utils/interfaces/users/users-ti'
import { Checker, createCheckers } from 'ts-interface-checker'
import { NextFunction, Request, Response } from 'express'
import { entities } from '../utils/constants'

// Validate request body for accordance to interface of specified entity
export const validateBody = (req: any, res: Response, next: NextFunction) => {
    const entity: EntityName = (req as Any).entity
    const method: HttpMethod = req.method as HttpMethod
    const status: UserStatus = req.user?._doc?.status
    if (!entity || !status) return res.sendStatus(500)

    let errorCode: number = 400
    let error: string | undefined
    switch (entity) {
        case entities.MENU:
            if (method === 'POST')
                var { IMenuBlockPost: IMenuBlockChecker } = createCheckers(
                    { IMenuBlockPost },
                    { IMenuElement }
                )
            else if (method === 'PUT')
                var { IMenuBlockPut: IMenuBlockChecker } = createCheckers(
                    { IMenuBlockPut },
                    { IMenuElement }
                )

            error = checkInterface(req.body, IMenuBlockChecker)
            break
        case entities.APP_SETTINGS:
            if (method === 'PUT')
                var { IAppSettingsPut: IAppSettingsChecker } = createCheckers({ IAppSettingsPut })

            error = checkInterface(req.body, IAppSettingsChecker)
            break
        case entities.USERS:
            if (method === 'PUT' && status === 'admin')
                var { IUserPutByAdmin: IUserChecker } = createCheckers({ IUserPutByAdmin })
            else if (method === 'PUT' && status === 'moderator')
                var { IUserPutByModerator: IUserChecker } = createCheckers({ IUserPutByModerator })

            error = checkInterface(req.body, IUserChecker)

            if (error && status !== 'admin') {
                errorCode = 403
            }
            break
        default:
            return res.sendStatus(500)
    }

    if (error)
        return res.status(errorCode).json({
            msg: errorCode === 403 ? 'Moderator is not allowed to update his status' : error
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
