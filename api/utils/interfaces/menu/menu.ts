export interface IMenuElement {
    title: string
    link?: string
    hidden?: boolean
    children: IMenuElement[]
}

export interface IMenuBlock {
    id?: string
    description?: string
    menu: IMenuElement[]
    timestamp: number
    lastUpdateTimestamp?: number
}

export interface IMenuBlockPost {
    description?: string
    menu: IMenuElement[]
}

export interface IMenuBlockPut {
    description?: string
    menu?: IMenuElement[]
}
