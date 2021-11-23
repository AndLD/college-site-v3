import { Any, EntityName, HttpMethod } from '../utils/types'
import { IMenuBlockPost, IMenuBlockPut, IMenuElement } from '../utils/interfaces/menu/menu-ti'
import { Checker, createCheckers } from 'ts-interface-checker'

// Validate request body for accordance to interface of specified entity
export const validateBody = (req: Any, res: Any, next: any) => {
    const entity: EntityName = req.entity
    const method: HttpMethod = req.method
    if (!entity) return res.sendStatus(500)

    let error: string | undefined

    switch (entity) {
        case 'menu':
            if (method == 'POST')
                var { IMenuBlockPost: IMenuBlockChecker } = createCheckers({ IMenuBlockPost }, { IMenuElement })
            else if (method == 'PUT')
                var { IMenuBlockPut: IMenuBlockChecker } = createCheckers({ IMenuBlockPut }, { IMenuElement })

            error = checkInterface(req.body, IMenuBlockChecker)
            break
        default:
            return res.sendStatus(500)
    }

    if (error)
        return res.status(400).json({
            msg: error
        })

    next()
}

function checkInterface(body: Any, checker: Checker) {
    try {
        checker.strictCheck(body)
    } catch (e) {
        return (e as string).toString()
    }
}
