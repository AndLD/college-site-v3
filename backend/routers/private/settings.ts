import { Router } from '../../pre-configs'
// import { validate } from 'simple-express-validation'
// import { putSettings } from '../validation/settings'
import { controller } from '../../controller/controller'

export default Router()
    // Получение настроек пользователя
    .get('/', controller)
    // Изменение настроек пользователя
    .put('/', controller)
