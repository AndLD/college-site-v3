import { Router } from '../../pre-configs'
import { controller } from '../../controller/controller'

export default Router()
    // Получение пользователя
    .get('/', controller)
    // Изменение пользователя
    .put('/', controller)
