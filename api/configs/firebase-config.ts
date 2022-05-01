import admin from 'firebase-admin'
import logger from '../utils/logger'
import { ServiceAccount } from '../utils/types'

let exp: any = {}

try {
    if (process.env.CLIENT_EMAIL && process.env.PRIVATE_KEY && process.env.PROJECT_ID) {
        admin.initializeApp({
            credential: admin.credential.cert({
                clientEmail: process.env.CLIENT_EMAIL,
                privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
                projectId: process.env.PROJECT_ID
            } as ServiceAccount)
        })

        exp = {
            admin,
            db: admin.firestore(),
            documentId: admin.firestore.FieldPath.documentId()
        }

        logger.info('Firestore successfully connected.')
    } else throw 'Firebase configs not found in ".env"!'
} catch (e) {
    logger.error(e)
}

export default exp
