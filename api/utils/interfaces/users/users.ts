import { UserStatus } from '../../types'

export interface IUser {
    id?: string
    email: string
    name: string
    status: 'admin' | 'moderator' | 'banned' | 'unconfirmed'
    description?: string
    tags?: string[]
    timestamp: number
    lastUpdateTimestamp?: number
}

export interface IUserPutByAdmin {
    status?: 'admin' | 'moderator' | 'banned' | 'unconfirmed'
    description?: string
    tags?: string[]
}

export interface IUserPutByModerator {
    description?: string
    tags?: string[]
}
