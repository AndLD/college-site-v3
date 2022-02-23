import { NextFunction, Response, Router } from 'express'
import { controller } from '../../controller/controller'
import { hasAdminStatus, hasModeratorStatus } from '../../middlewares/auth'
import { setReqParamsProp } from '../../middlewares/decorators'
import { validateBody } from '../../middlewares/validation'

export default Router()
    // Получение пользователей
    .get('/', hasAdminStatus, controller)
    // Получение авторизованного пользователя
    .get('/authorized', (req: any, res: Response) => {
        const user = req.user._doc

        return res.json({ result: user })
    })
    // Изменение авторизованного пользователя
    .put(
        '/authorized',
        hasModeratorStatus,
        validateBody,
        (req: any, res: Response, next: NextFunction) =>
            setReqParamsProp('id', req.user._doc.id)(req, res, next),
        controller
    )
    // Изменение пользователя
    .put('/:id', hasAdminStatus, validateBody, controller)
