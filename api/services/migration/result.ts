import fs from 'fs'
import moment from 'moment'
import path from 'path'
import { entities } from '../../utils/constants'
import { MigrationResult } from '../../utils/types'

const resultsFolderPath = path.join(__dirname, '..', '..', 'results')
const migrationResultsFolderPath = path.join(resultsFolderPath, 'migration')
const entityMigrationResultsFolderPath = {
    [entities.ARTICLES]: path.join(migrationResultsFolderPath, entities.ARTICLES),
    [entities.NEWS]: path.join(migrationResultsFolderPath, entities.NEWS)
}

function _establishFolderPath(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true })
    }
}

export function storeMigrationResult(
    entity: 'articles' | 'news',
    migrationResult: MigrationResult
) {
    _establishFolderPath(entityMigrationResultsFolderPath[entity])

    const json = JSON.stringify(migrationResult)

    const p = path.join(
        entityMigrationResultsFolderPath[entity],
        moment(Date.now()).format('DD.MM.YYYY_HH-mm-ss') + '.json'
    )

    fs.writeFileSync(p, json)
}
