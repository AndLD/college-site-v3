import { Any, Controller } from './types'
import logger from './logger'

// Оборачивает контроллер проверкой try catch
export const tryCatch = (controller: Controller) =>
    async function (req: any, res: any, next: any) {
        try {
            await controller(req, res)
        } catch (err) {
            logger.error(`Error [${req.method}, ${req.originalUrl}]:\n`, err)
            res.sendStatus(500)
        }
    } as Controller

// Удаляем из объекта все свойства, значения которых undefined
export const deleteUndefinedKeys = (obj: Any) => {
    const newObj: Any = {}

    for (const key in obj) {
        if (obj[key] !== undefined) newObj[key] = obj[key]
    }

    return newObj
}

// Удаляем из объекта свойства, которые соответствуют указанным в массиве
export const deleteMatchedKeys = (obj: Any, matchers: string[]) => {
    const newObj: Any = {}

    for (const key in obj) {
        if (!matchers.find((elem) => elem == key)) newObj[key] = obj[key]
    }

    return newObj
}
