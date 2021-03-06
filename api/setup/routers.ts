import { Express } from 'express'
import { hasAdminStatus, hasModeratorStatus, isAuthorized } from '../middlewares/auth'
import { setReqEntity } from '../middlewares/decorators'
import menuPrivateRouter from '../routers/private/menu'
import menuPublicRouter from '../routers/public/menu'
import usersPrivateRouter from '../routers/private/users'
import { entities } from '../utils/constants'
import { Router } from 'express'
import appSettingsPrivateRouter from '../routers/private/app-settings'
import articlesPublicRouter from '../routers/public/articles'
import articlesPrivateRouter from '../routers/private/articles'
import newsPublicRouter from '../routers/public/news'
import newsPrivateRouter from '../routers/private/news'
import actionsPrivateRouter from '../routers/private/actions'
import statisticsPrivateRouter from '../routers/private/statistics'
import migrationPrivateRouter from '../routers/private/migration'

export function setupRouters(app: Express) {
    const apiRouter = Router()
    app.use('/api', apiRouter)

    // Unauthorized router
    const publicRouter = Router()
    apiRouter.use('/public', publicRouter)

    // Menu
    publicRouter.use('/menu', setReqEntity(entities.MENU), menuPublicRouter)
    // Articles
    publicRouter.use('/article', setReqEntity(entities.ARTICLES), articlesPublicRouter)
    // News
    publicRouter.use('/news', setReqEntity(entities.NEWS), newsPublicRouter)

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
    // News
    privateRouter.use('/news', hasModeratorStatus, setReqEntity(entities.NEWS), newsPrivateRouter)
    // Actions
    privateRouter.use('/action', setReqEntity(entities.ACTIONS), actionsPrivateRouter)

    // Statistics
    privateRouter.use('/statistics', hasModeratorStatus, statisticsPrivateRouter)

    // Migration
    privateRouter.use('/migration', hasAdminStatus, migrationPrivateRouter)
}
