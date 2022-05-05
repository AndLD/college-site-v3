import { Any } from '../utils/types'
import { firebase } from '../configs/firebase-config'
import { NextFunction, Response } from 'express'
import { model } from '../model/model'
import { IUser } from '../utils/interfaces/users/users'
import { getAllCompatibleInputForString } from '../utils/functions'

export async function isAuthorized(req: any, res: Response, next: NextFunction) {
    if (!req.headers.authorization) return res.sendStatus(401)

    const token: string = req.headers.authorization.split(' ')[1] as string

    try {
        const decodeValue: Any = await firebase.admin.auth().verifyIdToken(token)
        if (!decodeValue) return res.sendStatus(401)

        req.user = decodeValue

        const [result, findUserError] = await model({
            collection: 'users',
            where: [['email', '==', req.user.email]],
            action: 'get'
        })
        if (findUserError) {
            return res.status(findUserError.code).json({
                error: findUserError.msg
            })
        }

        if (!result?.mainResult?.length) {
            const newUser: IUser = {
                email: req.user.email,
                name: req.user.name,
                status: 'unconfirmed',
                keywords: getAllCompatibleInputForString(req.user.name),
                timestamp: Date.now()
            }

            const [result, createUserError] = await model({
                collection: 'users',
                action: 'add',
                obj: newUser
            })
            if (createUserError) {
                return res.status(createUserError.code).json({
                    error: createUserError.msg
                })
            }

            req.user._doc = result?.mainResult
        } else {
            req.user._doc = result.mainResult[0]
        }

        next()
    } catch (e) {
        // TODO: Отражать на фронте сообщение о том, что сессия истекла
        // e.errorInfo.code == 'auth/id-token-expired'
        return res.sendStatus(401)
    }
}

export function hasModeratorStatus(req: any, res: Response, next: NextFunction) {
    const status = req.user?._doc?.status

    if (!status) {
        return res.sendStatus(500)
    }

    if (status === 'admin' || status == 'moderator') {
        return next()
    }

    return res.status(403).json({ user: req.user._doc })
}

export function hasAdminStatus(req: any, res: Response, next: NextFunction) {
    const status = req.user?._doc?.status

    if (!status) {
        return res.sendStatus(500)
    }

    if (status === 'admin') {
        return next()
    }

    return res.sendStatus(403)
}
