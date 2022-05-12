import fs from 'fs'
import path from 'path'
import { getLogger } from '../utils/logger'

const logger = getLogger('services/appSettings')

const appSettingsPath = path.join(__dirname, '..', 'app-settings.json')

function get() {
    try {
        const settings = fs.readFileSync(appSettingsPath)
        return JSON.parse(settings.toString())
    } catch (e) {
        logger.error('Failed to get appSettings with error:', e)
    }
}

function set(newSettings: any) {
    try {
        const settings = get()
        for (const key in newSettings) {
            if (key === 'actionAutoApproveEnabledForAdmins') {
                if (settings[key]) {
                    if (settings[key].includes(newSettings[key])) {
                        settings[key] = settings[key].filter(
                            (email: string) => email !== newSettings[key]
                        )
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
        fs.writeFileSync(appSettingsPath, JSON.stringify(settings))

        return true
    } catch (e) {
        logger.error('Failed to set appSettings with error:', e)
    }
}

export const appSettingsService = {
    get,
    set
}
