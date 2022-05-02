import { getLogger } from './utils/logger'
import { app } from './pre-configs'
import { hasAdminStatus, hasModeratorStatus, isAuthorized } from './middlewares/auth'
import { setReqEntity } from './middlewares/decorators'
import menuPrivateRouter from './routers/private/menu'
import menuPublicRouter from './routers/public/menu'
import usersPrivateRouter from './routers/private/users'
import { entities } from './utils/constants'
import { Request, Response, Router } from 'express'
import appSettingsPrivateRouter from './routers/private/app-settings'
import articlesPublicRouter from './routers/public/articles'
import articlesPrivateRouter from './routers/private/articles'
import actionsPrivateRouter from './routers/private/actions'

const logger = getLogger('index')

const apiRouter = Router()
app.use('/api', apiRouter)

// Unauthorized router
const publicRouter = Router()
apiRouter.use('/public', publicRouter)

// Menu
publicRouter.use('/menu', setReqEntity(entities.MENU), menuPublicRouter)
// Articles
publicRouter.use('/article', setReqEntity(entities.ARTICLES), articlesPublicRouter)

// Authorized router
const privateRouter = Router()
apiRouter.use('/private', isAuthorized, privateRouter)

// Menu
privateRouter.use('/menu', setReqEntity(entities.MENU), menuPrivateRouter)
// Settings (app-settings)
privateRouter.use(
    '/settings',
    hasAdminStatus,
    setReqEntity(entities.APP_SETTINGS),
    appSettingsPrivateRouter
)
// Users
privateRouter.use('/user', setReqEntity(entities.USERS), usersPrivateRouter)
// Articles
privateRouter.use(
    '/article',
    hasModeratorStatus,
    setReqEntity(entities.ARTICLES),
    articlesPrivateRouter
)
// Actions
privateRouter.use('/action', setReqEntity(entities.ACTIONS), actionsPrivateRouter)

// Statistics (test route)
privateRouter.get('/statistics', hasModeratorStatus, async (_: Request, res: Response) => {
    return res.json({
        incomes: 5000,
        outcomes: 2000
    })
})

const port = process.env.PORT
app.listen(port, () => {
    logger.info(`Server has been started on ${port}`)
})

export default app
