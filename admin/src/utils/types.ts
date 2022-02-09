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
    key: string
    body?: any
}
