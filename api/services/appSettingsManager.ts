import fs from 'fs'
import path from 'path'

const appSettingsPath = path.join(__dirname, '..', 'app-settings.json')

export function getAppSettings() {
    try {
        const settings = fs.readFileSync(appSettingsPath)
        return JSON.parse(settings.toString())
    } catch (e) {
        console.log(e)
    }
}

export function setAppSettings(newSettings: any) {
    try {
        const settings = module.exports.getAppSettings()
        for (const key in newSettings) {
            settings[key] = newSettings[key]
        }
        fs.writeFileSync(appSettingsPath, JSON.stringify(settings))
    } catch (e) {
        console.log(e)
        return false
    }

    return true
}
