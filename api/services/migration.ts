// Migration from MySQL to Firestore & Google Drive

import filetype from 'magic-bytes.js'
import mysql from 'mysql'
import { IRequestFile, MigrationOptions, UserStatus } from '../utils/types'
import { privateArticlesControllers } from '../controllers/private/articles'
import { isHtml } from '../utils/is-html'

interface connectionOptions {
    host: string | undefined
    port: number | undefined
    user: string | undefined
    password: string | undefined
    database: string | undefined
}

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
    inlineMainImage: true
}

type User = {
    email: string
    status: UserStatus
}

type PostArticleResult = { oldId: number; status: number; resBody: any }

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

function _getConnection() {
    if (!_validateConnectionOptions(connectionOptions)) {
        throw new Error('Invalid MySQL connection options')
    }

    return mysql.createConnection(connectionOptions)
}

function _getArticles({
    skip,
    limit,
    minOldId,
    oldIds
}: MigrationOptions): Promise<GetArticlesResult> {
    const table = 'articles'

    const oldIdsClause = oldIds?.length ? oldIds.map((oldId) => `id == ${oldId}`).join(' OR ') : ''
    const minOldIdClause = minOldId ? `id > ${minOldId}` : ''
    const whereClause = minOldId || oldIds ? `WHERE ${minOldIdClause} ${oldIdsClause}` : ''

    const queryString = `SELECT * FROM ${table} ${whereClause} LIMIT ${limit} OFFSET ${skip}`

    const articleBodies: IMigrationArticleBody[] = []
    const articleFiles: { [id: string]: ArticleContent } = {}

    return new Promise((resolve, reject) => {
        _getConnection().query(queryString, async (err, result: IArticleV2[]) => {
            if (err) {
                return reject(new Error(err.message))
            }

            for (const row of result) {
                articleBodies.push({
                    title: row.title,
                    oldId: row.id,
                    inlineMainImage: true
                })

                const articleFile: ArticleContent = {}

                articleFiles[row.id] = articleFile

                if (row.html && !row.docx) {
                    const buffer = Buffer.from(row.html)
                    console.log(111)

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
                                    articleFile.docx = buffer
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
                        throw e
                    }
                }
            }

            process.exit(1)

            resolve({ articleBodies, articleFiles })
        })
    })
}

async function _postArticle(
    user: User,
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

async function migrateArticles(user: User, options: MigrationOptions) {
    const migrationResult: PostArticleResult[] = []

    try {
        const { articleBodies, articleFiles }: GetArticlesResult = await _getArticles(options)

        for (const articleBody of articleBodies) {
            const articleFile = articleFiles[articleBody.oldId]

            const postArticleResult = await _postArticle(user, articleBody, articleFile)

            migrationResult.push(postArticleResult)
        }
    } catch (e) {
        throw e
    }

    return migrationResult
}

export const migrationService = {
    migrateArticles
}
