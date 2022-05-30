// Migration from MySQL to Firestore & Google Drive

import filetype from 'magic-bytes.js'
import mysql from 'mysql'
import { MigrationOptions } from '../utils/types'
import { Blob } from 'buffer'
import { parse as parseHtml } from 'node-html-parser'
import { convertDocxToHtml } from '../utils/functions'

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
    articleRawMetadatas: any[]
    articleFiles: ArticleContent[]
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

function _getConnection() {
    if (!_validateConnectionOptions(connectionOptions)) {
        throw new Error('Invalid MySQL connection options')
    }

    return mysql.createConnection(connectionOptions)
}

function _getArticles({ skip, limit, minOldId }: MigrationOptions): Promise<GetArticlesResult> {
    const table = 'articles'

    const queryString = `SELECT * FROM ${table} WHERE id = 6${
        minOldId ? ` WHERE id > ${minOldId}` : ''
    } LIMIT ${limit} OFFSET ${skip}`

    const articleRawMetadatas: any = []
    const articleFiles: any = {}

    return new Promise((resolve, reject) => {
        _getConnection().query(queryString, async (err, result: IArticleV2[]) => {
            if (err) {
                return reject(new Error(err.message))
            }

            for (const row of result) {
                articleRawMetadatas.push({
                    title: row.title,
                    oldId: row.id
                })

                const articleFile: ArticleContent = {}

                articleFiles[row.id] = articleFile

                if (row.html && !row.docx) {
                    const buffer = Buffer.from(row.html)

                    articleFile.html = buffer
                } else if (row.docx) {
                    const buffer = Buffer.from(row.docx)

                    try {
                        const guessedFiles = filetype(buffer)

                        for (const guessedFile of guessedFiles) {
                            if (guessedFile.extension === 'docx') {
                                const str = buffer.toString()

                                if (parseHtml(str)) {
                                    console.log(3)
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
                            const str = await buffer.toString()

                            try {
                                console.log(2)
                                if (parseHtml(str)) {
                                    articleFile.html = buffer
                                }
                            } catch (e) {
                                throw e
                            }
                        }
                    } catch (e) {
                        throw e
                    }
                }

                console.log(articleFile)
            }

            resolve({ articleRawMetadatas, articleFiles })
        })
    })
}

async function _postArticle() {}

async function startMigration(options: MigrationOptions) {
    try {
        const { articleRawMetadatas, articleFiles }: GetArticlesResult = await _getArticles(options)

        return articleRawMetadatas
    } catch (e) {
        throw e
    }
}

export const migrationService = {
    startMigration
}
