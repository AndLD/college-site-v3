import logger from './utils/logger'
import { app, Router } from './pre-configs'
import { isAuthorized } from './middlewares/auth'
import { setReqEntity } from './middlewares/decorators'
import menuPrivateRouter from './routers/private/menu'
import menuPublicRouter from './routers/public/menu'
import settingsPrivateRouter from './routers/private/settings'
import { Any } from './utils/types'
import { entities } from './utils/constants'

const apiRouter = Router()
app.use('/api', apiRouter)

// Роутер незащищенных маршрутов
// const publicRouter = Router()
// apiRouter.use('/public', publicRouter)

// Меню
// publicRouter.use('/menu', setReqEntity(entities.MENU), menuPublicRouter)

// Роутер защищенных маршрутов
const privateRouter = Router()
apiRouter.use('/private', isAuthorized, privateRouter)

// Меню
// privateRouter.use('/menu', setReqEntity(entities.MENU), menuPrivateRouter)
// Настройки
// privateRouter.use('/settings', setReqEntity(entities.SETTINGS), settingsPrivateRouter)

// Статистика (тестовый роут)
privateRouter.get('/statistics', async (_: Any, res: Any) => {
    return res.json({
        incomes: 5000,
        outcomes: 2000
    })
})
app.get('/statistics', async (_: Any, res: Any) => {
    return res.json({
        incomes: 5000,
        outcomes: 2000
    })
})

const port = process.env.PORT
const host = process.env.HOST
app.listen(port, host, (err: any) => {
    if (err) {
        logger.error(`Error while starting the server: ./{err}`)
    } else {
        logger.info(`Server has been started on http://${host}:${port}`)
    }
})

module.exports = app
