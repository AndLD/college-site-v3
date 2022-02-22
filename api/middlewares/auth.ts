import { Any } from '../utils/types'
import firebase from '../configs/firebase-config'
import { NextFunction, Response } from 'express'
import { model } from '../model/model'
import { IUser } from '../utils/interfaces/users/users'

export async function isAuthorized(req: any, res: Response, next: NextFunction) {
    if (!req.headers.authorization) return res.sendStatus(401)

    const token: string = req.headers.authorization.split(' ')[1] as string

    try {
        const decodeValue: Any = await firebase.admin.auth().verifyIdToken(token)

        if (decodeValue) {
            req.user = decodeValue

            console.log(1)
            // TODO: Посылать здесь запрос на получение пользователя по email. Если такого пользователя нет, то необходимо добавить его в базу со статусом 'unconfirmed'
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

            if (!result?.mainResult) {
                const newUser: IUser = {
                    email: req.user.email,
                    name: req.user.name,
                    status: 'unconfirmed',
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

                console.log(result)
            }

            next()
        } else return res.sendStatus(401)
    } catch (e) {
        console.log(e)
        return res.sendStatus(401)
    }
}
