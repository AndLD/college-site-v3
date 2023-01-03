import Redis from 'ioredis'
import { getLogger } from '../utils/logger'

const logger = getLogger('services/redis')

let client: Redis | null = null

async function getClient() {
    if (!client) {
        await _createClient()
    }

    return client as Redis
}

async function _createClient() {
    return new Promise((resolve, reject) => {
        client = new Redis({ host: process.env.REDIS_HOST || '127.0.0.1' })
        client.on('error', (err) => logger.error(`REDIS ERROR: ${err}`))
        client.on('connect', () => {
            logger.info('Redis successfully connected.')
            resolve(undefined)
        })
    })
}

async function closeConnection() {
    if (client) {
        await client.disconnect()
        logger.info('Redis successfully disconnected.')
    }
}

export const redisService = {
    getClient,
    closeConnection
}
