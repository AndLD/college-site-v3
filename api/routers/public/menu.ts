import { Router } from 'express'
import { controller } from '../../controller/controller'
import { setReqProp, setReqQueryProp } from '../../middlewares/decorators'

export default Router()
    // Получение активного блока меню
    .get('/', setReqQueryProp('settings', 'id,==,selectedMenuId'), setReqProp('singleResult', true), controller)
