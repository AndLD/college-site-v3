import {
    createClient,
    RedisClientOptions,
    RedisClientType,
    RedisFunctions,
    RedisModules,
    RedisScripts
} from 'redis'
import { getLogger } from '../../utils/logger'

const logger = getLogger('services/app-settings/redis-manager')

interface IAppSettings {
    selectedMenuId: string | null
    actionAutoApproveEnabledForAdmins: string[]
    pinnedNewsIds: string[]
}

interface IAppSettingsSet {
    selectedMenuId?: string | null
    actionAutoApproveEnabledForAdmins?: string
    pinnedNewsIds?: string
}

const connectionOptions: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts> = {
    url: 'redis://127.0.0.1'
}

let client: RedisClientType<any, any, any> | null = null

async function init() {
    await _getClient()

    // const defaultSettings: { [key: string]: string[] | string } = {
    //     pinnedNewsIds: [],
    //     actionAutoApproveEnabledForAdmins: []
    // }

    // const keysToInit: { [key: string]: string[] | string } = {}

    // for (const key in defaultSettings) {
    //     if (!(await client.exists(key))) {
    //         keysToInit[key] = defaultSettings[key]
    //     }
    // }

    // if (Object.keys(keysToInit).length) {
    //     await _setRedisKeys(keysToInit)
    // }
}

async function _getClient() {
    if (!client) {
        client = await createClient(connectionOptions)
        client.on('error', (err) => {
            logger.error('Redis error: ' + err)
        })

        client.on('connection', () => {
            logger.info('Redis successfully connected.')
        })

        await client.connect()
    }

    return client
}

// TODO: Add return type
async function get() {
    try {
        const client = await _getClient()

        const settings = {
            selectedMenuId: await client.get('selectedMenuId'),
            pinnedNewsIds: (await client.lRange('pinnedNewsIds', 0, -1)) || [],
            actionAutoApproveEnabledForAdmins:
                (await client.lRange('actionAutoApproveEnabledForAdmins', 0, -1)) || []
        }
        return settings
    } catch (e) {
        throw 'Failed to get appSettings with error: ' + e
    }
}

async function set(newSettings: IAppSettingsSet) {
    try {
        const oldSettings = await get()
        const settings: IAppSettings = { ...(oldSettings as IAppSettings) }

        for (const key in newSettings) {
            if (key === 'actionAutoApproveEnabledForAdmins' || key === 'pinnedNewsIds') {
                if (newSettings[key]) {
                    if (settings[key].includes(newSettings[key] as string)) {
                        settings[key] = settings[key].filter(
                            (email: string) => email !== newSettings[key]
                        )
                    } else if (newSettings[key]) {
                        settings[key]?.push(newSettings[key] as string)
                    }
                }
            } else if (key === 'selectedMenuId' && newSettings[key]) {
                settings[key] = newSettings[key] as string
            }
        }

        await _setRedisKeys(oldSettings, settings)

        return true
    } catch (e) {
        throw 'Failed to set appSettings with error: ' + e
    }
}

async function _setRedisKeys(settings: any, oldSettings?: any) {
    const client = await _getClient()

    for (const key in settings) {
        if (key === 'actionAutoApproveEnabledForAdmins' || key === 'pinnedNewsIds') {
            if (oldSettings && oldSettings[key]?.includes(settings[key])) {
                client.lRem(key, 0, settings[key])
            } else {
                console.log(key, settings[key])
                client.lPush(key, settings[key][0] as string)
            }
        } else if (settings[key] === null) {
            client.del(key)
        } else {
            client.set(key, settings[key])
        }
    }
}

export const appSettingsRedisManager = {
    init,
    get,
    set
}
