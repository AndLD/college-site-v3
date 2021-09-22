import loggerMiddleware from './middlewares/logger'
import dotenv from 'dotenv'
dotenv.config()
const express = require('express')
const cors = require('cors')

const server = express()

server.use(express.json())
server.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
server.use(loggerMiddleware)

export const app = server
export const Router = express.Router
