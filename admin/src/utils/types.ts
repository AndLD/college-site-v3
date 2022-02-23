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

export type UserStatus = 'admin' | 'moderator' | 'banned' | 'unconfirmed'
