import { loggerMiddleware } from './middlewares/logger'
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

export function setupApp() {
    const app = express()

    app.use(helmet())

    app.use(express.json())

    const whitelist = process.env.WHITELIST_URLS
    const corsOptions = {
        origin: function (origin: string, callback: any) {
            if (!origin || whitelist?.indexOf(origin) !== -1) {
                callback(null, true)
            } else {
                callback(new Error('Not allowed by CORS'))
            }
        },
        credentials: true
    }

    app.use(cors(corsOptions as any))
    app.use(loggerMiddleware)

    return app
}
