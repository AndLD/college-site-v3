export interface IArticle {
    id?: string
    oldId?: number
    title: string
    data: ArticleData
    description?: string
    tags?: string[]
    keywords: string[]
    publicTimestamp: number
    timestamp: number
    lastUpdateTimestamp?: number
    user: string
}

export type ArticleData = {
    html?: boolean
    docx?: boolean
    pdf?: boolean
    json?: boolean
}

export interface IArticlePost {
    oldId?: number
    title: string
    data: ArticleData
    description?: string
    tags?: string[]
    publicTimestamp: number
}

export interface IArticlePut {
    oldId?: number
    title: string
    data: ArticleData
    description?: string
    tags?: string[]
    publicTimestamp: number
}
