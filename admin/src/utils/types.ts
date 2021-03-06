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

export type UserStatus = 'admin' | 'moderator' | 'banned' | 'unconfirmed'

export interface ITokenData {
    name: string
    picture: string
    user_id: string
    email: string
    auth_time: number
}

export type ArticlesAllowedFileExtension = 'docx' | 'html' | 'pdf' | 'json'

export type NewsAllowedFileExtension = 'docx' | 'html' | 'png'

export interface IAction {
    id: string
    entity: 'articles' | 'news'
    action: 'add' | 'update' | 'delete'
    payload: {
        [key: string]: any
    }
    payloadIds: string[]
    status: 'pending' | 'approved' | 'declined'
    user: string
    keywords?: string[]
    timestamp: number
    lastUpdateTimestamp?: number
}

export interface IPreviewFile {
    name: string
    ext: string
    htmlString?: string
    objectUrl?: string
    base64?: string
}

export interface IColumn {
    title: string
    dataIndex: string
    render?: (value: any) => any
    width?: number
    align?: 'center'
}

export interface IJob {
    id: string
    title: string
    steps: JobStep[]
    timestamp: number
    duration: number
    currentStep: number
    status: JobStatus
    user: string
    percent?: number
}

export type JobStatus = 'success' | 'normal' | 'exception' | 'active'

export type JobStep = {
    title: string
    description?: string
    duration?: number
}
