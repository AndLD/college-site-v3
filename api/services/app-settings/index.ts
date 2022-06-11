import { getLogger } from '../../utils/logger'
import { appSettingsJsonManager } from './json-manager'
import { appSettingsRedisManager } from './redis-manager'

const logger = getLogger('services/app-settings')

let appSettingsMode: Promise<'redis' | 'json'> = _init()

async function _init() {
    try {
        await appSettingsRedisManager.init()

        logger.info('App-settings service initialized with appSettingsRedisManager')

        return 'redis'
    } catch (err) {
        logger.error('Redis init error: ' + err)

        logger.info('Initing app-settings with json manager...')

        appSettingsJsonManager.init()

        logger.info('App-settings service initialized with appSettingsJsonManager')

        return 'json'
    }
}

export const appSettingsService = {
    appSettingsMode,
    redis: appSettingsRedisManager,
    json: appSettingsJsonManager
}
