import { Any } from '../utils/types'
import firebase from '../configs/firebase-config'
import { NextFunction, Response } from 'express'
import { Request } from 'supertest'

export async function isAuthorized(req: any, res: Response, next: NextFunction) {
    if (!req.headers.authorization) return res.sendStatus(401)

    const token: string = req.headers.authorization.split(' ')[1] as string

    try {
        const decodeValue: Any = await firebase.admin.auth().verifyIdToken(token)

        if (decodeValue) {
            req.user = decodeValue
            next()
        } else return res.sendStatus(401)
    } catch (e) {
        return res.sendStatus(401)
    }
}
