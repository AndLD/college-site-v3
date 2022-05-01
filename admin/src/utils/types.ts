export type Action = 'Add' | 'Update'

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

export interface IMenuElementOfTree extends IMenuElement {
    children: IMenuElementOfTree[]
    key: string
    title: any
}

export interface IMenuBlockUpdate {
    type: 'Add' | 'Update' | 'Delete'
    key?: string
    body?: any
}

export interface IUser {
    id?: string
    name: string
    email: string
    status: 'admin' | 'moderator' | 'banned' | 'unconfirmed'
    description?: string
    tags?: string[]
    timestamp: number
    lastUpdateTimestamp?: number
}

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

export type ArticleData = {
    html?: boolean
    docx?: boolean
    pdf?: boolean
    json?: boolean
}

export interface IArticlePost {
    oldId?: number
    title: string
    description?: string
    tags?: string[]
    publicTimestamp?: number
}

export interface IArticlePut {
    oldId?: number
    title?: string
    description?: string
    tags?: string[]
    publicTimestamp?: number
}

export type UserStatus = 'admin' | 'moderator' | 'banned' | 'unconfirmed'

export interface ITokenData {
    name: string
    picture: string
    user_id: string
    email: string
    auth_time: number
}

export type AllowedFileExtension = 'docx' | 'html' | 'pdf' | 'json'
