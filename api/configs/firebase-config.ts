import admin from 'firebase-admin'
import { ServiceAccount } from '../utils/types'

if (process.env.CLIENT_EMAIL && process.env.PRIVATE_KEY && process.env.PROJECT_ID)
    admin.initializeApp({
        credential: admin.credential.cert({
            clientEmail: process.env.CLIENT_EMAIL,
            privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
            projectId: process.env.PROJECT_ID
        } as ServiceAccount)
    })
else throw 'Firebase configs not found in ".env"!'

export default {
    admin,
    db: admin.firestore(),
    documentId: admin.firestore.FieldPath.documentId()
}
