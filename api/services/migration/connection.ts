import mysql from 'mysql'

interface connectionOptions {
    host: string | undefined
    port: number | undefined
    user: string | undefined
    password: string | undefined
    database: string | undefined
}

const connectionOptions: connectionOptions = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT?.length && parseInt(process.env.MYSQL_PORT),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}

function _validateConnectionOptions(connectionOptions: connectionOptions) {
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
