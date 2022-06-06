// Migration from MySQL to Firestore & Google Drive

import filetype from 'magic-bytes.js'
import {
    IRequestFile,
    IShortUser,
    MigrationOptions,
    MigrationResult,
    PostArticleResult
} from '../../utils/types'
import { privateArticlesControllers } from '../../controllers/private/articles'
import { isHtml } from '../../utils/is-html'
import { convertDocxToHtml } from '../../utils/convert-docx-to-html'
import { getPool } from './connection'
import { getLogger } from '../../utils/logger'
import { storeMigrationResult } from './result'
import { jobsService } from '../jobs'
import { articlesService } from '../articles'

const logger = getLogger('services/migration/articles')

const MIGRATION_PORTION_SIZE: number = parseInt(process.env.MIGRATION_PORTION_SIZE || '2')

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
    errors: IMigrationError[]
}

interface IMigrationArticleBody {
    title: string
    oldId: number
}

interface IMigrationError {
    oldId: number
    status: number
    resBody: {
        error: string
    }
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

                    // TODO: Fix this
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

function _getArticles({ limit, minOldId, oldIds }: MigrationOptions): Promise<GetArticlesResult> {
    const table = 'articles'

    const oldIdsClause = oldIds?.length ? oldIds.map((oldId) => `id = ${oldId}`).join(' OR ') : ''
    const minOldIdClause = minOldId ? `id >= ${minOldId}` : ''
    const whereClause = minOldId || oldIds ? ` WHERE ${minOldIdClause} ${oldIdsClause}` : ''

    const queryStr = `SELECT * FROM ${table}${whereClause} LIMIT ${limit}`

    const articleBodies: IMigrationArticleBody[] = []
    const articleFiles: { [id: string]: ArticleContent } = {}
    const errors: IMigrationError[] = []

    logger.info('Performing MySQL query: ' + queryStr)

    // TODO: Refactor (replace callback-based MySQL library for promise-based)
    return new Promise(async (resolve, reject) => {
        getPool().query(queryStr, async (err, result: IArticleV2[]) => {
            if (err) {
                return reject(new Error(err.message))
            }

            for (let i = 0; i < result.length; i++) {
                const row = result[i]

                const oldId = row.id

                const error = await _checkOldIdUsage(oldId)
                if (error) {
                    errors.push(error)
                    continue
                }

                articleBodies.push({
                    title: row.title,
                    oldId
                })

                articleFiles[row.id] = await _getArticleFile(row)
            }

            resolve({ articleBodies, articleFiles, errors })
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
): Promise<PostArticleResult> {
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
    const migrationResult: MigrationResult = []

    logger.info('Articles migration started')

    const jobId = await jobsService.add(user.email, 'Articles migration', [{ title: 'Migration' }])

    let lastOldIdProcessed: number | undefined

    try {
        // Trying to get documents portionally. In optimization order
        for (let i = 0; i < options.limit; i += MIGRATION_PORTION_SIZE) {
            const left = options.limit - i
            const limit = left < MIGRATION_PORTION_SIZE ? left : MIGRATION_PORTION_SIZE

            const portionOptions = {
                limit,
                minOldId: lastOldIdProcessed || options.minOldId,
                // TODO: Investigate the behavior
                oldIds: options.oldIds
            }

            const portionMigrationResult = await _migrateArticlesPortion(user, portionOptions)
            migrationResult.push(...portionMigrationResult)

            const message = `Articles migrated: ${migrationResult.length}/${options.limit}`
            logger.info(message)
            jobsService.updateStepDescription(jobId, message)
            const progressPercent = (i * 100) / options.limit
            jobsService.updatePercent(jobId, progressPercent)

            lastOldIdProcessed = portionMigrationResult[portionMigrationResult.length - 1].oldId
        }

        storeMigrationResult(migrationResult)

        const successMigrationsCount = migrationResult.filter((res) => res.status === 200).length
        const newStepDescription = `Migrated ${successMigrationsCount}/${options.limit}`

        jobsService.updateStepDescription(jobId, newStepDescription)
        jobsService.success(jobId)

        return migrationResult
    } catch (e) {
        jobsService.error(jobId)
        throw e
    }
}

async function _migrateArticlesPortion(user: IShortUser, options: MigrationOptions) {
    const promises: Promise<PostArticleResult>[] = []
    const { articleBodies, articleFiles, errors }: GetArticlesResult = await _getArticles(options)

    for (const articleBody of articleBodies) {
        const articleFile = articleFiles[articleBody.oldId]

        const promise = _postArticle(user, articleBody, articleFile)

        promises.push(promise)
    }

    // TODO: Ensure we use a correct way to handle errors in Promise.allSettled
    // TODO: Refactor (hard to read)
    const portionMigrationResult = (
        (await Promise.allSettled(promises)).filter(
            (result: PromiseSettledResult<PostArticleResult>) => result.status === 'fulfilled'
        ) as PromiseFulfilledResult<PostArticleResult>[]
    ).map(({ value }) => value)

    portionMigrationResult.push(...errors)

    return portionMigrationResult
}

export const articlesMigrationService = {
    migrateArticles
}
