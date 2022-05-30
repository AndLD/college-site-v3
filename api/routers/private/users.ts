import { NextFunction, Response, Router } from 'express'
import { controller } from '../../controllers/controller'
import { hasAdminStatus, hasModeratorStatus } from '../../middlewares/auth'
import { setReqParamsProp } from '../../middlewares/decorators'
import { validateBody } from '../../middlewares/validation'

export default Router()
    // Users getting
    .get('/', hasAdminStatus, controller)
    // Authorized user getting
    .get('/authorized', hasModeratorStatus, (req: any, res: Response) => {
        const user = req.user._doc

        return res.json({ result: user })
    })
    // Authorized user editing
    .put(
        '/authorized',
        hasModeratorStatus,
        validateBody,
        (req: any, res: Response, next: NextFunction) =>
            setReqParamsProp('id', req.user._doc.id)(req, res, next),
        controller
    )
    // User editing
    .put('/:id', hasAdminStatus, validateBody, controller)
