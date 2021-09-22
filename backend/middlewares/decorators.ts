import { Any } from '../utils/types'

export const setReqProp = (key: string, value: any) => {
    return function (req: Any, _: any, next: any) {
        req[key] = value
        next()
    }
}

export const setReqBodyProp = (key: string, value: any) =>
    function (req: Any, _: any, next: any) {
        req.body[key] = value
        next()
    }

export const setReqEntity = (entity: string) =>
    function (req: Any, _: any, next: any) {
        req.entity = entity
        next()
    }
