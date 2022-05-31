import fs from 'fs'
import path from 'path'

const appSettingsPath = path.join(__dirname, '..', 'app-settings.json')

// TODO: Add return type
function get() {
    try {
        const settings = fs.readFileSync(appSettingsPath)
        return JSON.parse(settings.toString())
    } catch (e) {
        throw 'Failed to get appSettings with error: ' + e
    }
}

function set(newSettings: any) {
    try {
        const settings = get()
        for (const key in newSettings) {
            if (key === 'actionAutoApproveEnabledForAdmins' || key === 'pinnedNewsIds') {
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
        throw 'Failed to set appSettings with error: ' + e
    }
}

export const appSettingsService = {
    get,
    set
}
