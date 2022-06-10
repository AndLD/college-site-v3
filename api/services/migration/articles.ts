// Migration from MySQL to Postgres & Google Drive

import filetype from 'magic-bytes.js'
import {
    IMigrationError,
    IRequestFile,
    IShortUser,
    MigrationOptions,
    MigrationResult,
    MigrationPostResult,
    ModelResult,
    Error
} from '../../utils/types'
import { privateArticlesControllers } from '../../controllers/private/articles'
import { isHtml } from '../../utils/is-html'
import { convertDocxToHtml } from '../../utils/convert-docx-to-html'
import { getPool } from './connection'
import { getLogger } from '../../utils/logger'
import { storeMigrationResult } from './result'
import { jobsService } from '../jobs'
import { articlesService } from '../articles'
import { model } from '../../model/model'

const logger = getLogger('services/migration/articles')

const MIGRATION_PORTION_SIZE: number = parseInt(process.env.MIGRATION_PORTION_SIZE || '20')

const table = 'articles'

interface IArticleV2 {
    id: number
    title: string
    html: string | null
    docx: Buffer | null
    viewMode: 'html' | 'docx_to_html' | 'pdf'
    fileFormat: 'html' | 'docx' | 'pdf'
}

type ArticleContent = {
    html?: Buffer
    docx?: Buffer
    pdf?: Buffer
}

type GetArticlesResult = {
    articleBodies: IMigrationArticleBody[]
    articleFiles: { [id: string]: ArticleContent }
}

interface IMigrationArticleBody {
    title: string
    oldId: number
}

async function _getArticleFile(row: IArticleV2) {
    const articleFile: ArticleContent = {}

    if (row.html && !row.docx) {
        const buffer = Buffer.from(row.html)

        articleFile.html = buffer
    } else if (row.docx) {
        const buffer = row.docx

        try {
            const guessedFiles = filetype(buffer)

            for (const guessedFile of guessedFiles) {
                if (guessedFile.extension === 'docx') {
                    const str = buffer.toString()

                    if (isHtml(str)) {
                        articleFile.html = buffer
                    } else {
                        let convertResult

                        try {
                            convertResult = await convertDocxToHtml(buffer)
                        } catch {}

                        const html = convertResult?.value

                        if (html) {
                            articleFile.docx = buffer
                        } else if (row.html) {
                            articleFile.html = Buffer.from(row.html)
                        } else {
                            throw new Error('Article content not found at MySQL')
                        }
                    }
                    break
                } else if (guessedFile.extension === 'pdf') {
                    articleFile.pdf = buffer
                    break
                }
            }

            if (guessedFiles.length === 0) {
                const str = buffer.toString()

                if (isHtml(str)) {
                    articleFile.html = buffer
                }
            }
        } catch (e) {
            throw new Error(`Error during guessing the file: ${e}}`)
        }
    }

    return articleFile
}

function _getArticleOldIds({
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

function _getArticles(oldIds: number[]): Promise<GetArticlesResult> {
    const whereClause = 'WHERE ' + oldIds.map((id) => `id = ${id}`).join(' OR ')
    const queryStr = `SELECT * FROM ${table} ${whereClause}`

    const articleBodies: IMigrationArticleBody[] = []
    const articleFiles: { [id: string]: ArticleContent } = {}

    logger.info('Performing MySQL query: ' + queryStr)

    // TODO: Refactor (replace callback-based MySQL library for promise-based)
    return new Promise(async (resolve, reject) => {
        getPool().query(queryStr, async (err, result: IArticleV2[]) => {
            if (err) {
                return reject(err)
            }

            for (let i = 0; i < result.length; i++) {
                const row = result[i]

                const oldId = row.id

                articleBodies.push({
                    title: row.title,
                    oldId
                })

                articleFiles[oldId] = await _getArticleFile(row)
            }

            resolve({ articleBodies, articleFiles })
        })
    })
}

async function _checkOldIdUsage(oldId: number): Promise<IMigrationError | undefined> {
    const dublicateOldIdArticleIds = await articlesService.checkOldIdUsage(oldId)
    if (dublicateOldIdArticleIds.length) {
        return {
            oldId,
            status: 400,
            resBody: {
                error: `"oldId" is used by articles [${dublicateOldIdArticleIds.join(', ')}]`
            }
        }
    }
}

async function _postArticle(
    user: IShortUser,
    articleBody: IMigrationArticleBody,
    articleFile: ArticleContent
): Promise<MigrationPostResult> {
    if (!(articleFile.html || articleFile.docx || articleFile.pdf)) {
        throw new Error('No article content provided')
    }

    const ext = Object.keys(articleFile)[0] as 'html' | 'docx' | 'pdf'
    const buffer = articleFile[ext] as Buffer
    const size = buffer.byteLength

    const file: IRequestFile = {
        originalname: `migrated-article.${ext}`,
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
            json: JSON.stringify(articleBody)
        },
        file,
        method: 'POST',
        originalUrl: '/api/private/article',
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

    await privateArticlesControllers.postArticle(req as any, res as any)

    return { oldId: articleBody.oldId, status: res.statusCode, resBody: res.resBody }
}

async function migrateArticles(user: IShortUser, options: MigrationOptions) {
    logger.info('Articles migration started')

    const migrationResult: MigrationResult = []

    const jobId = await jobsService.add(user.email, 'Articles migration', [{ title: 'Migration' }])

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

            const portionMigrationResult = await _migrateArticlesPortion(user, portionOptions)
            migrationResult.push(...portionMigrationResult)

            const message = `Articles processed: ${i + limit}/${validLimit}`
            logger.info(message)

            if (i >= validLimit - MIGRATION_PORTION_SIZE) {
                const successMigrationsCount = migrationResult.filter(
                    (res) => res.status === 200
                ).length
                const message = `Articles migrated successfully: ${successMigrationsCount}/${validLimit}`
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

        storeMigrationResult('articles', migrationResult)

        return migrationResult
    } catch (e) {
        jobsService.error(jobId)
        logger.error(e)
        throw e
    }
}

async function _migrateArticlesPortion(user: IShortUser, options: MigrationOptions) {
    const promises: Promise<MigrationPostResult>[] = []
    const { oldIds, errors } = await _getArticleOldIds(options)

    if (oldIds.length) {
        const { articleBodies, articleFiles }: GetArticlesResult = await _getArticles(oldIds)

        for (const articleBody of articleBodies) {
            const articleFile = articleFiles[articleBody.oldId]

            const promise = _postArticle(user, articleBody, articleFile)

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

async function getUnmigratedArticleOldIds(): Promise<number[]> {
    const totalOldIds = await _getArticleOldIdsFromMySql()
    const migratedOldIds = await _getArticleOldIdsFromPostgres()

    const unmigratedArticleOldIds: number[] = []

    for (const oldId of totalOldIds) {
        if (!migratedOldIds.includes(oldId)) {
            unmigratedArticleOldIds.push(oldId)
        }
    }

    return unmigratedArticleOldIds
}

async function _getArticleOldIdsFromPostgres(): Promise<number[]> {
    const [modelResult, modelError] = (await model({
        collection: 'articles',
        action: 'get',
        select: ['oldId']
        // TODO: Refactor (set type)
    })) as [any, Error | null]

    if (modelError) {
        throw new Error('Error getting migrated article oldIds: ' + modelError.msg)
    }

    if (!modelResult?.mainResult) {
        return []
    }

    const result = modelResult.mainResult.map((row: { oldid: number }) => row['oldid'])

    return result as number[]
}

async function _getArticleOldIdsFromMySql(): Promise<number[]> {
    const queryStr = `SELECT id FROM ${table}`

    return new Promise(async (resolve, reject) => {
        getPool().query(queryStr, async (err, rows: { id: number }[]) => {
            if (err) {
                return reject(err)
            }

            const result = rows.map((row) => row.id)

            resolve(result)
        })
    })
}

export const articlesMigrationService = {
    migrateArticles,
    getUnmigratedArticleOldIds
}
