import dotenv from 'dotenv'
dotenv.config()
import { getLogger } from './utils/logger'
import { setupServer } from './setup/server'
import { ping } from './model/model'

const logger = getLogger('index')

const server = setupServer()

const port = process.env.PORT || 8080

ping()

server.listen(port, () => {
    logger.info(`Server has been started on ${port}`)
})
