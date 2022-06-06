// Migration from MySQL to Firestore & Google Drive

import filetype from 'magic-bytes.js'
import { IRequestFile, IShortUser, MigrationOptions } from '../../utils/types'
import { privateArticlesControllers } from '../../controllers/private/articles'
import { isHtml } from '../../utils/is-html'
import { convertDocxToHtml } from '../../utils/convert-docx-to-html'
import { getConnection } from './connection'

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
}

type PostArticleResult = { oldId: number; status: number; resBody: any }

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

function _getArticles({
    skip,
    limit,
    minOldId,
    oldIds
}: MigrationOptions): Promise<GetArticlesResult> {
    const table = 'articles'

    const oldIdsClause = oldIds?.length ? oldIds.map((oldId) => `id = ${oldId}`).join(' OR ') : ''
    const minOldIdClause = minOldId ? `id > ${minOldId}` : ''
    const whereClause = minOldId || oldIds ? `WHERE ${minOldIdClause} ${oldIdsClause}` : ''

    const queryString = `SELECT * FROM ${table} ${whereClause} LIMIT ${limit} OFFSET ${skip}`

    const articleBodies: IMigrationArticleBody[] = []
    const articleFiles: { [id: string]: ArticleContent } = {}

    return new Promise((resolve, reject) => {
        getConnection().query(queryString, async (err, result: IArticleV2[]) => {
            if (err) {
                return reject(new Error(err.message))
            }

            for (const row of result) {
                articleBodies.push({
                    title: row.title,
                    oldId: row.id
                })

                articleFiles[row.id] = await _getArticleFile(row)
            }

            resolve({ articleBodies, articleFiles })
        })
    })
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
    const migrationResult: PostArticleResult[] = []

    try {
        // Trying to get documents portionally by 10. In optimization order
        for (let i = options.skip; i < options.skip + options.limit; i += MIGRATION_PORTION_SIZE) {
            const portionOptions = {
                limit: MIGRATION_PORTION_SIZE,
                skip: i,
                // TODO: Remove
                oldIds: options.oldIds
            }

            const portionMigrationResult = await _migrateArticlesPortion(user, portionOptions)
            migrationResult.push(...portionMigrationResult)
        }

        return migrationResult
    } catch (e) {
        throw e
    }
}

async function _migrateArticlesPortion(user: IShortUser, options: MigrationOptions) {
    const promises: Promise<PostArticleResult>[] = []
    const { articleBodies, articleFiles }: GetArticlesResult = await _getArticles(options)

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

    const migrationResult: PostArticleResult[] = portionMigrationResult

    return migrationResult
}

export const articlesMigrationService = {
    migrateArticles
}
