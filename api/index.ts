import logger from './utils/logger'
import { app } from './pre-configs'
import { hasEnoughPermissions, isAuthorized } from './middlewares/auth'
import { setReqEntity } from './middlewares/decorators'
import menuPrivateRouter from './routers/private/menu'
import menuPublicRouter from './routers/public/menu'
import usersPrivateRouter from './routers/private/users'
import { Any } from './utils/types'
import { entities } from './utils/constants'
import { Request, Response, Router } from 'express'
import appSettingsPrivateRouter from './routers/private/app-settings'

const apiRouter = Router()
app.use('/api', apiRouter)

// Роутер незащищенных маршрутов
const publicRouter = Router()
apiRouter.use('/public', publicRouter)

// Меню
publicRouter.use('/menu', setReqEntity(entities.MENU), menuPublicRouter)

// Роутер защищенных маршрутов
const privateRouter = Router()
apiRouter.use('/private', isAuthorized, privateRouter)

// Меню
privateRouter.use('/menu', hasEnoughPermissions, setReqEntity(entities.MENU), menuPrivateRouter)
// Настройки (app-settings)
privateRouter.use(
    '/settings',
    hasEnoughPermissions,
    setReqEntity(entities.APP_SETTINGS),
    appSettingsPrivateRouter
)
// Пользователи
privateRouter.use('/user', setReqEntity(entities.USERS), usersPrivateRouter)

// Статистика (тестовый роут)
privateRouter.get('/statistics', async (_: Request, res: Response) => {
    return res.json({
        incomes: 5000,
        outcomes: 2000
    })
})

const port = process.env.PORT
app.listen(port, () => {
    logger.info(`Server has been started on ${port}`)
})

module.exports = app
