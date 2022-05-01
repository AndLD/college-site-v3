import logger from './utils/logger'
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

const apiRouter = Router()
app.use('/api', apiRouter)

// Роутер незащищенных маршрутов
const publicRouter = Router()
apiRouter.use('/public', publicRouter)

// Меню
publicRouter.use('/menu', setReqEntity(entities.MENU), menuPublicRouter)
// Статьи
publicRouter.use('/article', setReqEntity(entities.ARTICLES), articlesPublicRouter)

// Роутер защищенных маршрутов
const privateRouter = Router()
apiRouter.use('/private', isAuthorized, privateRouter)

// Меню
privateRouter.use('/menu', hasModeratorStatus, setReqEntity(entities.MENU), menuPrivateRouter)
// Настройки (app-settings)
privateRouter.use(
    '/settings',
    hasAdminStatus,
    setReqEntity(entities.APP_SETTINGS),
    appSettingsPrivateRouter
)
// Пользователи
privateRouter.use('/user', setReqEntity(entities.USERS), usersPrivateRouter)
// Статьи
privateRouter.use('/article', setReqEntity(entities.ARTICLES), articlesPrivateRouter)

// Статистика (тестовый роут)
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
