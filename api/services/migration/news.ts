// Migration from MySQL to Postgres & Google Drive

import filetype from 'magic-bytes.js'
import {
    IMigrationError,
    IRequestFile,
    IShortUser,
    MigrationOptions,
    MigrationResult,
    MigrationPostResult
} from '../../utils/types'
import { isHtml } from '../../utils/is-html'
import { convertDocxToHtml } from '../../utils/convert-docx-to-html'
import { getPool } from './connection'
import { getLogger } from '../../utils/logger'
import { storeMigrationResult } from './result'
import { jobsService } from '../jobs'
import { newsService } from '../news'
import { privateNewsControllers } from '../../controllers/private/news'

const logger = getLogger('services/migration/news')

const MIGRATION_PORTION_SIZE: number = parseInt(process.env.MIGRATION_PORTION_SIZE || '20')

const table = 'news'

interface INewsV2 {
    id: number
    title: string
    tags: string
    html: string | null
    docx: Buffer | null
    addDate: Date // 'YYYY-MM-DD'
}

type NewsContent = {
    html?: Buffer
    docx?: Buffer
}

type GetNewsResult = {
    newsBodies: IMigrationNewsBody[]
    newsFiles: { [id: string]: NewsContent }
}

interface IMigrationNewsBody {
    title: string
    oldId: number
    publicTimestamp: number
    inlineMainImage: boolean
    tags?: string[]
}

async function _getNewsFile(row: INewsV2) {
    const newsFile: NewsContent = {}

    if (row.html && !row.docx) {
        const buffer = Buffer.from(row.html)

        newsFile.html = buffer
    } else if (row.docx) {
        const buffer = row.docx

        try {
            const guessedFiles = filetype(buffer)

            for (const guessedFile of guessedFiles) {
                if (guessedFile.extension === 'docx') {
                    const str = buffer.toString()

                    if (isHtml(str)) {
                        newsFile.html = buffer
                    } else {
                        let convertResult

                        try {
                            convertResult = await convertDocxToHtml(buffer)
                        } catch {}

                        const html = convertResult?.value

                        if (html) {
                            newsFile.docx = buffer
                        } else if (row.html) {
                            newsFile.html = Buffer.from(row.html)
                        } else {
                            throw new Error('News content not found at MySQL')
                        }
                    }
                    break
                }
            }

            if (guessedFiles.length === 0) {
                const str = buffer.toString()

                if (isHtml(str)) {
                    newsFile.html = buffer
                }
            }
        } catch (e) {
            throw new Error(`Error during guessing the file: ${e}}`)
        }
    }

    return newsFile
}

function _getNewsOldIds({
    limit,
    minOldId,
    oldIds
}: MigrationOptions): Promise<{ oldIds: number[]; errors: IMigrationError[] }> {
    const oldIdsClause = oldIds?.length ? oldIds.map((oldId) => `id = ${oldId}`).join(' OR ') : ''
    const minOldIdClause = minOldId ? `id >= ${minOldId}` : ''
    const whereClause = minOldId || oldIds ? ` WHERE ${minOldIdClause} ${oldIdsClause}` : ''

    const queryStr = `SELECT id FROM ${table}${whereClause} LIMIT ${limit}`

    const errors: IMigrationError[] = []
    const validOldIds: number[] = []

    logger.info('Performing MySQL query: ' + queryStr)

    return new Promise(async (resolve, reject) => {
        getPool().query(queryStr, async (err, result: { id: number }[]) => {
            if (err) {
                return reject(err)
            }

            for (let i = 0; i < result.length; i++) {
                const row = result[i]

                const oldId = row.id

                const error = await _checkOldIdUsage(oldId)
                if (error) {
                    errors.push(error)
                } else {
                    validOldIds.push(oldId)
                }
            }

            resolve({ oldIds: validOldIds, errors })
        })
    })
}

function _getNews(oldIds: number[]): Promise<GetNewsResult> {
    const whereClause = 'WHERE ' + oldIds.map((id) => `id = ${id}`).join(' OR ')
    const queryStr = `SELECT * FROM ${table} ${whereClause}`

    const newsBodies: IMigrationNewsBody[] = []
    const newsFiles: { [id: string]: NewsContent } = {}

    logger.info('Performing MySQL query: ' + queryStr)

    // TODO: Refactor (replace callback-based MySQL library for promise-based)
    return new Promise(async (resolve, reject) => {
        getPool().query(queryStr, async (err, result: INewsV2[]) => {
            if (err) {
                return reject(err)
            }

            for (let i = 0; i < result.length; i++) {
                const row = result[i]

                const oldId = row.id
                const publicTimestamp = row.addDate.getTime()
                const tags = row.tags ? row.tags.split(',') : []

                newsBodies.push({
                    title: row.title,
                    tags,
                    oldId,
                    publicTimestamp,
                    inlineMainImage: true
                })

                newsFiles[oldId] = await _getNewsFile(row)
            }

            resolve({ newsBodies: newsBodies, newsFiles: newsFiles })
        })
    })
}

async function _checkOldIdUsage(oldId: number): Promise<IMigrationError | undefined> {
    const dublicateOldIdNewsIds = await newsService.checkOldIdUsage(oldId)
    if (dublicateOldIdNewsIds.length) {
        return {
            oldId,
            status: 400,
            resBody: {
                error: `"oldId" is used by news [${dublicateOldIdNewsIds.join(', ')}]`
            }
        }
    }
}

async function _postNews(
    user: IShortUser,
    newsBody: IMigrationNewsBody,
    newsFile: NewsContent
): Promise<MigrationPostResult> {
    if (!(newsFile.html || newsFile.docx)) {
        throw new Error('No news content provided')
    }

    const ext = Object.keys(newsFile)[0] as 'html' | 'docx'
    const buffer = newsFile[ext] as Buffer
    const size = buffer.byteLength

    const file: IRequestFile = {
        originalname: `migrated-news.${ext}`,
        buffer,
        size
    }

    // TODO: Add type
    const req = {
        user: {
            email: user.email,
            _doc: {
                status: user.status
            }
        },
        body: {
            json: JSON.stringify(newsBody)
        },
        files: { file: [file] },
        method: 'POST',
        originalUrl: '/api/private/news',
        isSimulation: true
    }

    // TODO: Add type
    const res: any = {
        statusCode: 200,
        // TODO: Refactor dublication
        status: (status: number) => {
            res.statusCode = status
            return res
        },
        sendStatus: (status: number) => {
            res.statusCode = status
            return res
        },
        json: (resBody: any) => {
            res.resBody = resBody
        }
    }

    await privateNewsControllers.postNews(req as any, res as any)

    return { oldId: newsBody.oldId, status: res.statusCode, resBody: res.resBody }
}

async function migrateNews(user: IShortUser, options: MigrationOptions) {
    logger.info('News migration started')

    const migrationResult: MigrationResult = []

    const jobId = await jobsService.add(user.email, 'News migration', [{ title: 'Migration' }])

    let lastOldIdProcessed: number | undefined

    try {
        const whereClause = `WHERE id > ${options.minOldId}`
        const availableLimit = await _getAvailableLimit(whereClause)

        // TODO: Change variable name :)
        const validLimit = availableLimit < options.limit ? availableLimit : options.limit

        // Trying to get documents portionally. In optimization order
        for (let i = 0; i < validLimit; i += MIGRATION_PORTION_SIZE) {
            const left = validLimit - i
            const limit = left < MIGRATION_PORTION_SIZE ? left : MIGRATION_PORTION_SIZE

            const portionOptions = {
                limit,
                minOldId: lastOldIdProcessed ? lastOldIdProcessed + 1 : options.minOldId,
                // TODO: Investigate the behavior
                oldIds: options.oldIds
            }

            const portionMigrationResult = await _migrateNewsPortion(user, portionOptions)
            migrationResult.push(...portionMigrationResult)

            const message = `News processed: ${i + limit}/${validLimit}`
            logger.info(message)

            if (i >= validLimit - MIGRATION_PORTION_SIZE) {
                const successMigrationsCount = migrationResult.filter(
                    (res) => res.status === 200
                ).length
                const message = `News migrated successfully: ${successMigrationsCount}/${validLimit}`
                logger.info(message)
                const newStepDescription = message

                jobsService.updateStepDescription(jobId, newStepDescription)
                jobsService.success(jobId)
            } else {
                const progressPercent = ((i + MIGRATION_PORTION_SIZE) * 100) / validLimit
                jobsService.updatePercent(jobId, progressPercent)

                jobsService.updateStepDescription(jobId, message)

                lastOldIdProcessed = Math.max(...portionMigrationResult.map(({ oldId }) => oldId))
            }
        }

        storeMigrationResult('news', migrationResult)

        return migrationResult
    } catch (e) {
        jobsService.error(jobId)
        logger.error(e)
        throw e
    }
}

async function _migrateNewsPortion(user: IShortUser, options: MigrationOptions) {
    const promises: Promise<MigrationPostResult>[] = []
    const { oldIds, errors } = await _getNewsOldIds(options)

    if (oldIds.length) {
        const { newsBodies, newsFiles }: GetNewsResult = await _getNews(oldIds)

        for (const newsBody of newsBodies) {
            const newsFile = newsFiles[newsBody.oldId]

            const promise = _postNews(user, newsBody, newsFile)

            promises.push(promise)
        }
    }

    // TODO: Ensure we use a correct way to handle errors in Promise.allSettled
    // TODO: Refactor (hard to read)
    const portionMigrationResult = (
        (await Promise.allSettled(promises)).filter(
            (result: PromiseSettledResult<MigrationPostResult>) => result.status === 'fulfilled'
        ) as PromiseFulfilledResult<MigrationPostResult>[]
    ).map(({ value }) => value)

    portionMigrationResult.push(...errors)

    return portionMigrationResult
}

async function _getAvailableLimit(whereClause: string): Promise<number> {
    const queryStr = `SELECT COUNT(*) FROM ${table} ${whereClause}`

    return new Promise(async (resolve, reject) => {
        getPool().query(queryStr, async (err, result: [{ 'COUNT(*)': number }]) => {
            if (err) {
                return reject(err)
            }

            const count = result[0]['COUNT(*)']

            resolve(count)
        })
    })
}

export const newsMigrationService = {
    migrateNews
}
