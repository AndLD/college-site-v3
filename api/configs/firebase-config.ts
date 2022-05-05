import admin from 'firebase-admin'
import { getLogger } from '../utils/logger'
import { ServiceAccount } from '../utils/types'

const logger = getLogger('configs/firebase-config')

try {
    if (process.env.CLIENT_EMAIL && process.env.PRIVATE_KEY && process.env.PROJECT_ID) {
        admin.initializeApp({
            credential: admin.credential.cert({
                clientEmail: process.env.CLIENT_EMAIL,
                privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
                projectId: process.env.PROJECT_ID
            } as ServiceAccount)
        })

        logger.info('Firestore successfully connected.')
    } else throw 'Firebase configs not found in ".env"!'

    var firebaseData: {
        admin: any
        db: FirebaseFirestore.Firestore
        documentId: FirebaseFirestore.FieldPath
    } = {
        admin,
        db: admin.firestore(),
        documentId: admin.firestore.FieldPath.documentId()
    }
} catch (e) {
    logger.error('Firestore connection failure: ', e)
    process.exit(1)
}

export const firebase = firebaseData
