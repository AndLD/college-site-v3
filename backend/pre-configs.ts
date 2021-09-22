import loggerMiddleware from './middlewares/logger'
import dotenv from 'dotenv'
dotenv.config()
const express = require('express')
const cors = require('cors')

export const app = express()

app.use(express.json())
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }))
app.use(loggerMiddleware)

export const Router = express.Router
