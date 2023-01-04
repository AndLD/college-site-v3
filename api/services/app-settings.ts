import { IAppSettings, IAppSettingsPut } from '../utils/interfaces/app-settings/app-settings'
import { redisService } from './redis'

const _defaultSettings: IAppSettings = {
    selectedMenuId: null,
    pinnedNewsIds: [],
    actionAutoApproveEnabledForAdmins: [],
    notificationsService: true
}

async function init() {
    const settings = await appSettingsService.getAll()
    if (!settings) {
        await _reset()
    }
}

async function _reset() {
    await appSettingsService.setAll(_defaultSettings)
}

async function get(setting: keyof IAppSettings) {
    const settings = await appSettingsService.getAll()
    return settings[setting]
}

async function getAll(): Promise<IAppSettings> {
    const redisClient = await redisService.getClient()
    const settingsJson = await redisClient.get('settings')

    if (settingsJson) {
        const settings = JSON.parse(settingsJson)

        let isSettingsValid = false

        if (typeof settings === 'object') {
            isSettingsValid = true
        }

        if (isSettingsValid) {
            return settings
        }
    }

    await _reset()

    return _defaultSettings
}

async function set(newSettings: any) {
    try {
        // TODO: Refactor: replace 'any'
        const settings: any = await getAll()
        for (const key in newSettings) {
            if (key === 'actionAutoApproveEnabledForAdmins' || key === 'pinnedNewsIds') {
                if (settings[key]) {
                    if (settings[key].includes(newSettings[key])) {
                        settings[key] = settings[key].filter((email: string) => email !== newSettings[key])
                    } else {
                        settings[key].push(newSettings[key])
                    }
                } else {
                    settings[key] = [newSettings[key]]
                }
            } else {
                settings[key] = newSettings[key]
            }
        }

        await appSettingsService.setAll(settings)

        return true
    } catch (e) {
        throw 'Failed to set appSettings with error: ' + e
    }
}

async function setAll(settings: IAppSettings) {
    const redisClient = await redisService.getClient()
    await redisClient.set('settings', JSON.stringify(settings))
}

export const appSettingsService = {
    init,
    get,
    getAll,
    set,
    setAll
}
