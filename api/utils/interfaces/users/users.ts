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
