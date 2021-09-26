import { Router } from '../../pre-configs'
import { validate } from 'simple-express-validation'
import { postMenu } from '../../validation/menu'
import { controller } from '../../controller/controller'

export default Router()
    // Добавление элемента меню
    .post('/', validate(postMenu.bodySchema), controller)
    // TODO Удалить
    // Изменение элемента меню по id
    .put('/:id', controller)
    // TODO Удалить
    // Удаление меню по id
    .delete('/:id', controller)
