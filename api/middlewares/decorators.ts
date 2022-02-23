import { NextFunction, Response } from 'express'
import { Any } from '../utils/types'

export const setReqProp = (key: string, value: any) =>
    function (req: Any, _: Response, next: NextFunction) {
        req[key] = value
        next()
    }

export const setReqQueryProp = (key: string, value: any) =>
    function (req: Any, _: Response, next: NextFunction) {
        req.query[key] = value
        next()
    }

export const setReqParamsProp = (key: string, value: any) =>
    function (req: Any, _: Response, next: NextFunction) {
        req.params[key] = value
        next()
    }

export const setReqBodyProp = (key: string, value: any) =>
    function (req: Any, _: Response, next: NextFunction) {
        req.body[key] = value
        next()
    }

export const setReqEntity = (entity: string) =>
    function (req: Any, _: Response, next: NextFunction) {
        req.entity = entity
        next()
    }
