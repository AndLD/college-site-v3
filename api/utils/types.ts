import { NextFunction, Request, Response } from 'express'
import { IMenuBlock } from './interfaces/menu/menu'

export type Any = { [key: string]: any }

export type Error = {
    msg: string
    code: number
}
export type DefaultResult = [Any | null, Error | null]
export type ArrayResult = [Any | [] | null, Error | null]

export type Controller = (req: Request, res: Response, next?: NextFunction) => any

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type LogicOperator = '<' | '<=' | '==' | '>=' | '>'
export type UpdateOperator = '+' | '-'
// TODO: Убрать 'in', 'array-contains' из типа Filter ?
export type Filter =
    | [string, LogicOperator, number | boolean | string]
    | [string, 'array-contains', string]
    | [string, 'in', string[]]
export type SubstringInStringFilter = [string, 'array-contains', string]
export type UpdateSchema = [string, UpdateOperator, string | number][]

export type ControllerTriggerArgs = {
    email: string
    docId: string
    obj: Any
}
export type ControllerTrigger = (params: ControllerTriggerArgs) => DefaultResult

export type ControllerCallbackCaller = (modelResult: ModelResult) => DefaultResult
export type ControllerCallbackAction = 'update' | 'delete'
export type ControllerCallbackArgs = {
    email: string
    entity: string
    docId: string
    action: ControllerCallbackAction
    updateSchema?: UpdateSchema
}
export type ControllerCallback = (params: ControllerCallbackArgs) => DefaultResult
export type ControllerCallbacksResults = Any[]
export type CallControllerCallbacksResults = [ControllerCallbacksResults | null, Error | null]

export type ModelAction = 'get' | 'add' | 'update' | 'delete'
export type ModelArgs = {
    email?: string
    collection: string
    where?: Filter[]
    docId?: string
    docIds?: string[]
    pagination?: Pagination
    select?: string[]
    order?: [string, string]
    action: ModelAction
    obj?: Any
    triggers?: ControllerTrigger[]
    noRecursion?: boolean
}
export type Entity = IMenuBlock
export type EntityName = 'menu' | 'articles' | 'news' | 'users' | 'actions' | 'app-settings'
export type ModelResult = {
    mainResult: { [key in keyof Entity]: any } | null
    _triggersResult?: any
    _meta?: {
        pagination?: { [key in keyof Pagination | 'total']: any }
    }
}

export type ServiceAccount = {
    clientEmail: string
    privateKey: string
    projectId: string
}

export type ElementChild = {
    tag?: string
    attributes?: Any
    textContent?: string
    children: any[]
}

export type State = {
    state: any
    setState: SetStateFunction
    subscribers: Subscriber[]
}
export type SetStateFunction = (newState: any) => void
export type Subscriber = (newState?: any) => void

export type Pagination = {
    results: number
    page: number
}

export type AppSettings = {
    selectedMenuId?: string
    pinnedNewsIds?: string[]
}

export type UserStatus = 'admin' | 'moderator' | 'banned' | 'unconfirmed'
