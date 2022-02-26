import { Router } from 'express'
import { controller } from '../../controller/controller'

export default Router()
    // Получение статьи по id
    .get('/:id', controller)
