import fs from 'fs'
import moment from 'moment'
import path from 'path'
import { MigrationResult } from '../../utils/types'

const resultsFolderPath = path.join(__dirname, '..', '..', 'results')
const migrationResultsFolderPath = path.join(resultsFolderPath, 'migration')

function _establishFolderPath(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true })
    }
}

export function storeMigrationResult(migrationResult: MigrationResult) {
    _establishFolderPath(migrationResultsFolderPath)

    const json = JSON.stringify(migrationResult)

    const p = path.join(
        migrationResultsFolderPath,
        moment(Date.now()).format('DD.MM.YYYY_HH-mm-ss') + '.json'
    )

    fs.writeFileSync(p, json)
}
