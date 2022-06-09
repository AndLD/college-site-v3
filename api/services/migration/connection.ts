import mysql, { Pool } from 'mysql'
import { getLogger } from '../../utils/logger'
import { IConnectionOptions } from '../../utils/types'

const logger = getLogger('services/migration/connection')

const connectionOptions: IConnectionOptions = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT?.length && parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: 100
}

let pool: Pool | null = null

function _validateConnectionOptions(connectionOptions: IConnectionOptions) {
    const isAllOptionsFound =
        connectionOptions.host &&
        connectionOptions.port &&
        connectionOptions.user &&
        connectionOptions.password &&
        connectionOptions.database

    if (!isAllOptionsFound) {
        return false
    }

    return true
}

export function getPool(): Pool {
    if (!pool) {
        if (!_validateConnectionOptions(connectionOptions)) {
            throw new Error('Invalid MySQL connection options')
        }

        pool = mysql.createPool(connectionOptions)

        pool.on('connect', () => {
            logger.info('MySQL successfully connected.')
        })

        pool.on('error', (err) => {
            logger.error('MySQL pool error: ' + err)
        })
    }

    return pool
}
