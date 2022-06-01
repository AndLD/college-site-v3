import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { firebase } from '../configs/firebase-config'
import { model } from '../model/model'
import { notificationService } from '../services/notification'
import { getAllCompatibleInputForString } from '../utils/keywords'
import { IUser } from '../utils/interfaces/users/users'
import { Any } from '../utils/types'

interface MySocket extends Socket {
    user: any
}

// TODO: Refactor
export function isAuthorized(socket: MySocket, next: (err?: ExtendedError | undefined) => void) {
    if (!socket.handshake.headers.authorization) {
        next(new Error('No authorization header found'))
        return
    }

    const token: string = socket.handshake.headers.authorization?.split(' ')[1] as string

    try {
        firebase.admin
            .auth()
            .verifyIdToken(token)
            .then((decodeValue: Any) => {
                if (!decodeValue) {
                    next(new Error('No decoded value from token'))
                    return
                }

                socket.user = decodeValue

                model({
                    collection: 'users',
                    where: [['email', '==', socket.user.email]],
                    action: 'get'
                }).then(([result, findUserError]) => {
                    if (findUserError) {
                        next(new Error(findUserError.msg))
                        return
                    }

                    if (!result?.mainResult?.length) {
                        const newUser: IUser = {
                            email: socket.user.email,
                            name: socket.user.name,
                            status: 'unconfirmed',
                            keywords: [
                                ...getAllCompatibleInputForString(socket.user.name),
                                ...getAllCompatibleInputForString(socket.user.email)
                            ],
                            timestamp: Date.now()
                        }

                        model({
                            collection: 'users',
                            action: 'add',
                            obj: newUser
                        }).then(([result, createUserError]) => {
                            if (createUserError) {
                                next(new Error(createUserError.msg))
                                return
                            }

                            notificationService.sendNewUserNofication(
                                socket.user.name,
                                socket.user.email
                            )

                            socket.user._doc = result?.mainResult

                            next()
                        })
                    } else {
                        socket.user._doc = result.mainResult[0]

                        next()
                    }
                })
            })
    } catch (e) {
        next(new Error(e as string))
    }
}
