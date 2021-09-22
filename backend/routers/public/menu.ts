import { Router } from '../../pre-configs'
import { controller } from '../../controller/controller'

export default Router()
    // Получение меню json
    .get('/', controller)
    // Получение элемента меню по id
    .get('/:id', controller)
