import { Response, Router } from 'express'
import { controller } from '../../controller/controller'
import { hasEnoughPermissions } from '../../middlewares/auth'

export default Router()
    // Получение пользователей
    .get('/', hasEnoughPermissions, controller)
    // Получение авторизованного пользователя
    .get('/authorized', (req: any, res: Response) => {
        const user = req.user._doc

        return res.json({ result: user })
    })
// Изменение пользователя
// .put('/', hasEnoughPermissions, controller)
