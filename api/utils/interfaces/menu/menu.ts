export interface IMenuElement {
    title: string
    link: string
    hidden: boolean
    children: IMenuElement[]
}

export interface IMenuBlock {
    id?: string
    menu: IMenuElement[]
    selected?: boolean
    timestamp: number
    lastUpdateTimestamp?: number
}

export interface IMenuBlockPost {
    menu: IMenuElement[]
    selected?: boolean
}

export interface IMenuBlockPut {
    menu: IMenuElement[]
    selected?: boolean
}
