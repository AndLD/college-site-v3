import { Any } from '../utils/types'
import firebase from '../configs/firebase-config'

export async function isAuthorized(req: Any, res: Any, next: () => {}) {
    if (!req.headers.authorization) return res.sendStatus(401)

    const token: string = req.headers.authorization.split(' ')[1] as string
    console.log(token)
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
