import dotenv from 'dotenv'
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` })
import { getLogger } from './utils/logger'
import { setupServer } from './setup/server'
import { ping } from './model/model'
import { ENV } from './utils/constants'
import { appSettingsService } from './services/app-settings'

const logger = getLogger('index')

process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('Unhandled rejection at ', promise, `reason: ${reason}`)
})

appSettingsService.init()
const server = setupServer()

const port = process.env.PORT || 8080

ping()

server.listen(port, () => {
    logger.info(`Server has been started on ${port}, env=${ENV}`)
})
