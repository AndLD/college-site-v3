import { Router } from 'express'
import { controller } from '../../controllers/controller'
import { setReqProp, setReqQueryProp } from '../../middlewares/decorators'

export default Router()
    // TODO: Implement mainResult filtering and return only 'menu' field from result
    // Selected menu block getting
    .get(
        '/',
        setReqQueryProp('settings', 'id,==,selectedMenuId'),
        setReqProp('singleResult', true),
        controller
    )
