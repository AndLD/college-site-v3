import { Any, EntityName, HttpMethod, UserStatus } from '../utils/types'
import { IMenuBlockPost, IMenuBlockPut, IMenuElement } from '../utils/interfaces/menu/menu-ti'
import { IAppSettingsPut } from '../utils/interfaces/app-settings/app-settings-ti'
import { IUserPutByAdmin, IUserPutByModerator } from '../utils/interfaces/users/users-ti'
import { Checker, createCheckers, ICheckerSuite } from 'ts-interface-checker'
import { NextFunction, Response } from 'express'
import { DEFAULT_ADMIN, entities } from '../utils/constants'

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
            let IMenuBlockChecker: Checker | undefined
            if (method === 'POST')
                IMenuBlockChecker = createCheckers({ IMenuBlockPost }, { IMenuElement }).IMenuBlockPost
            else if (method === 'PUT')
                IMenuBlockChecker = createCheckers({ IMenuBlockPut }, { IMenuElement }).IMenuBlockPost

            if (IMenuBlockChecker) {
                error = _checkInterface(req.body, IMenuBlockChecker)
            }
            break
        case entities.APP_SETTINGS:
            let IAppSettingsChecker: Checker | undefined

            if (method === 'PUT') IAppSettingsChecker = createCheckers({ IAppSettingsPut }).IAppSettingsBlockPut

            if (IAppSettingsChecker) {
                error = _checkInterface(req.body, IAppSettingsChecker)
            }
            break
        case entities.USERS:
            let IUserChecker: Checker | undefined

            if (method === 'PUT' && status === 'admin')
                IUserChecker = createCheckers({ IUserPutByAdmin }).IUserPutByAdmin
            else if (method === 'PUT' && status === 'moderator')
                IUserChecker = createCheckers({ IUserPutByModerator }).IUserPutByModerator

            if (IUserChecker) {
                error = _checkInterface(req.body, IUserChecker)
            }

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

function _checkInterface(body: Any, checker: Checker) {
    try {
        checker.strictCheck(body)
    } catch (e) {
        return (e as string).toString()
    }
}
