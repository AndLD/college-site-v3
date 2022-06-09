export interface INews {
    id?: string
    oldId?: number
    title: string
    data: NewsData
    description?: string
    tags?: string[]
    keywords?: string[]
    publicTimestamp?: number
    timestamp?: number
    lastUpdateTimestamp?: number
    user: string
    inlineMainImage?: boolean
}

export type NewsData = {
    html?: boolean
    docx?: boolean
    png?: boolean
}

export interface INewsPost {
    oldId?: number
    title: string
    description?: string
    tags?: string[]
    publicTimestamp?: number
    inlineMainImage?: boolean
}

export interface INewsPut {
    oldId?: number
    title?: string
    description?: string
    tags?: string[]
    publicTimestamp?: number
    inlineMainImage?: boolean
}

export interface INewsUpdate {
    oldId?: number
    title?: string
    description?: string
    tags?: string[]
    publicTimestamp?: number
    lastUpdateTimestamp?: number
    data?: NewsData
    keywords?: string[]
    inlineMainImage?: boolean
}
