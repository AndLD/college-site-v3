import { Router } from '../../pre-configs'
import { controller } from '../../controller/controller'
import { setReqQueryProp } from '../../middlewares/decorators'

export default Router()
    // Получение активного блока меню
    .get('/', setReqQueryProp('filters', 'selected,==,true'), controller)
