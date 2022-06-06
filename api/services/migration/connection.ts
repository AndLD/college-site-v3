import mysql from 'mysql'
import { IConnectionOptions } from '../../utils/types'

const connectionOptions: IConnectionOptions = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT?.length && parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}

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

export function getConnection() {
    if (!_validateConnectionOptions(connectionOptions)) {
        throw new Error('Invalid MySQL connection options')
    }

    return mysql.createConnection(connectionOptions)
}
