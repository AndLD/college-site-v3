import { Router } from '../../pre-configs'
import { controller } from '../../controller/controller'
import { validateBody } from '../../middlewares/validation'

export default Router()
    // Получение всех блоков меню
    .get('/', controller)
    // Получение блока меню по id
    .get('/:id', controller)
    // Добавление блока меню
    .post('/', validateBody, controller)
    // Изменение блока меню по id
    .put('/:id', validateBody, controller)
    // Удаление блока меню по id
    .delete('/:id', controller)
    // // Удаление блоков меню по массиву id
    // .delete('/', controller)