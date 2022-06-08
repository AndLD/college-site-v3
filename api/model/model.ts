import { Pool, QueryResult } from 'pg'
import { generate as generateDocumentId } from 'rand-token'
import escape from 'pg-escape'
import { getLogger } from '../utils/logger'
import {
    Any,
    DefaultResult,
    Entity,
    Filter,
    IConnectionOptions,
    ModelAction,
    ModelArgs,
    ModelResult,
    Pagination,
    WhereOperator
} from '../utils/types'

const logger = getLogger('model/postgres')

interface IRow {
    id: string
    metadata: any
}

const port: string | undefined = process.env.POSTGRES_PORT
const connectionOptions: IConnectionOptions = {
    host: process.env.POSTGRES_HOST,
    port: port?.length && parseInt(port),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
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

async function _getPool() {
    if (!_validateConnectionOptions(connectionOptions)) {
        throw new Error('Invalid Postgres connection options')
    }

    if (!pool) {
        pool = new Pool(connectionOptions)

        pool.on('error', (err) => {
            logger.error('Postgres pool error:' + err)
        })

        await pool.connect()
    }

    return pool
}

async function _query(queryStr: string): Promise<QueryResult<any>> {
    const pool = await _getPool()
    const result = await pool.query(queryStr)

    return result
}

export async function model(params: ModelArgs) {
    const {
        collection,
        where,
        whereOperator,
        docId,
        docIds,
        pagination,
        select,
        order,
        action,
        obj
    } = params

    _validateModelArgs({ where, docId, action })

    let mainResult, error
    let total = 0

    if (action === 'delete' && docIds) {
        ;[mainResult, error] = await _makeBatchedDeletes({ collection, docIds, action })

        if (error) {
            return [null, error] as DefaultResult
        }
    } else {
        const { queryStr, metaQueryStr } = _prepareQuery({
            collection,
            where,
            whereOperator,
            docId,
            docIds,
            pagination,
            select,
            order,
            action,
            obj
        })

        logger.info('Performing Postgres query:', queryStr)

        // TODO: Handle error
        const postgresRes = await _query(queryStr)

        ;[mainResult, error] = await _processPostgresRes({ postgresRes, docId, action })

        if (error) {
            return [null, error] as DefaultResult
        }

        if (metaQueryStr) {
            try {
                logger.info('Performing Postgres query (metaQueryStr):', metaQueryStr)
                total = parseInt((await _query(metaQueryStr)).rows[0].count)
            } catch (e) {
                throw new Error('Error getting total docs count!')
            }
        }
    }

    const result: ModelResult = { mainResult }

    if (pagination) {
        result._meta = {
            pagination: { ...pagination, total: total || (await getCollectionLength(collection)) }
        }
    }
    return [result, null] as DefaultResult
}

// TODO: Validate all "model" function parameters
function _validateModelArgs({
    where,
    docId,
    action
}: {
    where?: Filter[]
    docId?: string
    action: ModelAction
}) {
    if (['add', 'update', 'delete'].includes(action) && where)
        throw 'validateModelArgs: Incorrect mix: action & where'
    if (action == 'update' && !docId)
        throw `validateModelArgs: Missing docId or docIds during "${action}" action`
}

async function _makeBatchedDeletes({
    collection,
    docIds,
    action
}: {
    collection: string
    docIds: string[]
    action: ModelAction
}) {
    if (action != 'delete') {
        return [
            null,
            {
                msg: 'Incorrect action: "delete" is only available for makeBatchedDeletes function',
                code: 500
            }
        ]
    }

    if (!docIds?.length) {
        return [
            null,
            {
                msg: 'Incorrect docIds: docIds should be specified for makeBatchedDeletes function',
                code: 500
            }
        ]
    }

    try {
        await _query(
            `DELETE FROM ${collection} WHERE id IN (${docIds
                .map((docId) => `'${docId}'`)
                .join(',')})`
        )

        return [null, null]
    } catch (e) {
        logger.error('Error trying to perform makeBatchedDeletes query: ' + e)
        return [null, e]
    }
}

function _prepareQuery({
    collection,
    where,
    whereOperator,
    docId,
    docIds,
    pagination,
    select,
    order,
    action,
    obj
}: {
    collection: string
    where?: Filter[]
    whereOperator?: WhereOperator
    docId?: string
    docIds?: string[]
    pagination?: Pagination
    select?: string[]
    order?: [string, string]
    action: ModelAction
    obj?: Any
}): {
    queryStr: string
    metaQueryStr?: string
} {
    // TODO: Handle error
    const sanitizedWhereClauses = _getSanitizedWhereClauses({
        action,
        where,
        whereOperator,
        docId,
        docIds
    })

    let offset: number | undefined
    let limit: number | undefined
    let orderBy: string | undefined

    let metaQueryStr: string | undefined

    if (action === 'get' && pagination) {
        offset = (pagination.page - 1) * pagination.results
        limit = pagination.results

        if (order && (order[1] === 'desc' || order[1] === 'asc')) {
            orderBy = [`metadata->'${order[0]}'`, order[1].toUpperCase()].join(' ')
        } else {
            orderBy = `metadata->'timestamp'`
        }

        const wherePiece = sanitizedWhereClauses ? ` WHERE ${sanitizedWhereClauses}` : ''

        metaQueryStr = `SELECT COUNT(*) FROM ${collection}${wherePiece}`
    }

    let preparedSelect: string | undefined

    if (action === 'get' && select) {
        // TODO: Refactor (make easier)
        preparedSelect = select
            .map((field) => {
                if (field === 'id') {
                    return field
                } else {
                    return `metadata->'${field}' AS ${field}`
                }
            })
            .join(', ')
    }

    const queryStr = _prepareQueryStr({
        collection,
        action,
        docId,
        preparedSelect,
        sanitizedWhereClauses,
        offset,
        limit,
        orderBy,
        obj
    })

    return { queryStr, metaQueryStr }
}

function _getSanitizedWhereClauses({
    action,
    where,
    whereOperator,
    docId,
    docIds
}: {
    action: ModelAction
    where?: Filter[]
    whereOperator?: WhereOperator
    docId?: string
    docIds?: string[]
}) {
    const whereClauses: Filter[] = []
    let sanitizedWhereClauses: string | undefined

    if ((action === 'update' || action === 'delete' || action === 'get') && docId) {
        whereClauses.push(['id', '==', docId])
    } else if (action === 'get' && docIds) {
        whereClauses.push(['id', 'in', docIds])
    }
    if (action === 'get' && where) {
        whereClauses.push(...where)
    }
    if (whereClauses.length) {
        sanitizedWhereClauses = _prepareWhereClauses(whereClauses, whereOperator)
    }

    return sanitizedWhereClauses
}

function _prepareQueryStr({
    collection,
    action,
    docId,
    preparedSelect,
    sanitizedWhereClauses,
    offset,
    limit,
    orderBy,
    obj
}: {
    collection: string
    action: ModelAction
    docId?: string
    preparedSelect?: string
    sanitizedWhereClauses?: string
    offset?: number
    limit?: number
    orderBy?: string
    obj?: Any
}) {
    let queryStr: string = ''

    const wherePiece = sanitizedWhereClauses ? ` WHERE ${sanitizedWhereClauses}` : ''

    if (action === 'get') {
        const selectPiece = preparedSelect || '*'

        const orderByPiece = orderBy ? ` ORDER BY ${orderBy}` : ''
        const limitOffsetPiece = offset && limit ? ` LIMIT ${limit} OFFSET ${offset}` : ''

        queryStr = `SELECT ${selectPiece} FROM ${collection}${wherePiece}${orderByPiece}${limitOffsetPiece}`
    } else if (action === 'add') {
        if (!docId) {
            docId = getDocumentId()
        }

        // TODO: Handle error
        queryStr = escape(
            `INSERT INTO ${collection}(id, metadata) VALUES ('${docId}', %L) RETURNING *`,
            [JSON.stringify(obj)]
        )
    } else if (action === 'update') {
        if (!(obj && Object.keys(obj).length)) {
            throw new Error('"obj" is empty. Unable to perform update query')
        }

        const setPiece = `SET ${Object.keys(obj).map((field) => {
            const value = JSON.stringify(obj[field])
            return `metadata['${field}'] = '${value}'`
        })}`

        queryStr = `UPDATE ${collection} ${setPiece}${wherePiece} RETURNING *`
    } else if (action === 'delete') {
        queryStr = `DELETE FROM ${collection} WHERE id = '${docId}'`
    }

    return queryStr
}

function _prepareWhereClauses(whereClauses: Filter[], whereOperator?: WhereOperator): string {
    const sanitized: string[] = []

    for (const whereClause of whereClauses) {
        sanitized.push(_prepareWhereClause(whereClause))
    }

    const operator = whereOperator || 'AND'

    return sanitized.join(` ${operator} `)
}

function _prepareWhereClause(whereClause: Filter): string {
    let [field, operator, value]: any = whereClause

    let isFieldArray: boolean | undefined
    let isTimestamp: boolean | undefined

    if (field != 'id') {
        isFieldArray = ['payloadIds', 'keywords', 'tags'].includes(field)
        isTimestamp = field.toLowerCase && field.toLowerCase().includes('timestamp')

        if (isFieldArray) {
            field = `metadata::jsonb->>'${field}'`
        } else if (isTimestamp) {
            field = `(metadata::jsonb->>'${field}'::text)::bigint`
        } else {
            field = `metadata::jsonb->>'${field}'::text`
        }
    }

    if (typeof operator === 'number') {
        throw new Error(`Numeric filter operator not supported`)
    }

    switch (operator) {
        case '==':
            operator = '='
            break
        case 'in':
            operator = 'IN'
            break
        case 'array-contains':
            operator = 'LIKE'
            break
        case 'array-contains-any':
            throw new Error(`Filter operator "${operator}" not supported`)
    }

    if (Array.isArray(value)) {
        value = value.map((v) => `'${v}'`).join(', ')
        return `${field} ${operator} (${value})`
    } else {
        // TODO: Support integer arrays
        if (isFieldArray) {
            value = `'%"${value}"%'::text`
        } else if (isTimestamp) {
            value = `${value}::bigint`
        } else {
            value = `'${value}'::text`
        }
        return `${field} ${operator} ${value}`
    }
}

// TODO: Handle errors
async function _processPostgresRes({
    postgresRes,
    docId,
    action
}: {
    postgresRes: Any
    docId: string | undefined
    action: ModelAction
}) {
    let result = null

    switch (action) {
        case 'get':
            if (docId) {
                const row = postgresRes.rows[0]
                if (row) {
                    result = _factoryRowToEntity(row)
                }
            } else {
                const rows = postgresRes.rows
                result = rows.map(_factoryRowToEntity)
            }
            break
        case 'add':
            result = _factoryRowToEntity(postgresRes.rows[0])
            break
        case 'update':
            result = _factoryRowToEntity(postgresRes.rows[0])
            break
    }

    return [Array.isArray(result) ? (result.length > 0 ? result : null) : result, null]
}

// TODO: Move to utils
function _factoryRowToEntity(row: IRow): Entity {
    if (row.metadata) {
        return { id: row.id, ...row.metadata }
    } else {
        if ((row as any).lastupdatetimestamp) {
            ;(row as any).lastUpdateTimestamp = (row as any).lastupdatetimestamp
            delete (row as any).lastupdatetimestamp
        }

        return row as any
    }
}

export async function getCollectionLength(collection: string) {
    return (await _query(`SELECT COUNT(*) FROM ${collection}`)).rows[0].count
}

export function getDocumentId() {
    return generateDocumentId(20)
}

export async function ping() {
    try {
        await _getPool()

        logger.info('Postgres successfully connected.')
    } catch (e) {
        logger.error('Unable to ping Postgres:', e)
    }
}
