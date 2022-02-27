import loggerMiddleware from './middlewares/logger'
import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'

const server = express()

server.use(express.json())

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

server.use(cors(corsOptions as any))
server.use(loggerMiddleware)

export const app = server
