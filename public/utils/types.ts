export interface IMenuBlock {
    id?: string
    description?: string
    menu: IMenuElement[]
    timestamp: number
    lastUpdateTimestamp?: number
    user?: string
}

export interface IMenuElement {
    title: string
    link: string
    hidden?: boolean
    children: IMenuElement[]
}

export type Slide = { src: string; left: number }

export interface IArticle {
    id?: string
    oldId?: number
    title: string
    data: ArticleData
    description?: string
    tags?: string[]
    // keywords?: string[]
    publicTimestamp: number
    timestamp: number
    lastUpdateTimestamp?: number
}

export interface INews {
    id: string
    oldId?: number
    title: string
    data: NewsData
    description?: string
    tags?: string[]
    // keywords?: string[]
    publicTimestamp: number
    timestamp: number
    lastUpdateTimestamp?: number
    inlineMainImage?: boolean

    pinned?: boolean
}

export type ArticleData = {
    html?: boolean
    docx?: boolean
    pdf?: boolean
    json?: boolean
}

export type NewsData = {
    html?: boolean
    docx?: boolean
    png?: boolean
}

export type ArticlesAllowedFileExtension = 'docx' | 'html' | 'pdf' | 'json'

export type NewsAllowedFileExtension = 'docx' | 'html' | 'png'

export type Options = {
    [key: string]: (ArticlesAllowedFileExtension | NewsAllowedFileExtension)[]
}

export interface INewsCombined {
    metadata: INews
    image: string | null
}

export type IndexPageProps = {
    menu: IMenuElement[]
    newsMetadatas: INews[]
}
