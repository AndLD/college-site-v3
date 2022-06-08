import admin from 'firebase-admin'
import { getLogger } from '../utils/logger'
import { ServiceAccount } from '../utils/types'

const logger = getLogger('configs/firebase-config')

var firebaseData: {
    admin: {
        auth: (app?: admin.app.App | undefined) => admin.auth.Auth
    }
}

try {
    if (process.env.CLIENT_EMAIL && process.env.PRIVATE_KEY && process.env.PROJECT_ID) {
        admin.initializeApp({
            credential: admin.credential.cert({
                clientEmail: process.env.CLIENT_EMAIL,
                privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
                projectId: process.env.PROJECT_ID
            } as ServiceAccount)
        })

        logger.info('Firebase successfully connected.')
    } else throw new Error(`Firebase configs not found in env file!`)

    firebaseData = {
        admin
    }
} catch (e) {
    logger.error('Firestore connection failure: ' + e)
    process.exit(1)
}

export const firebaseAuth = firebaseData.admin.auth
