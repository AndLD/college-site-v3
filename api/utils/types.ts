// TODO: Refactor

import { NextFunction, Request, Response } from 'express'
import { IArticle } from './interfaces/articles/articles'
import { IMenuBlock } from './interfaces/menu/menu'
import { IUser } from './interfaces/users/users'

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
// TODO: Remove 'in', 'array-contains' from 'Filter' type ?
export type Filter =
    | [string, LogicOperator, number | boolean | string]
    | [string, 'array-contains', string]
    | [string, 'array-contains-any', string[]]
    | [string, 'in', string[]]
    | [string, '!=', string]
    | [FirebaseFirestore.FieldPath, '==', string]
// TODO: Remove:
// | [string, 'like', string]

export type ArrayContainsFilter = [string, 'array-contains', string]
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
export type Entity = IMenuBlock & IArticle & IUser
export type EntityName = 'menu' | 'articles' | 'news' | 'users' | 'actions' | 'app-settings'
export type ModelResult = {
    mainResult: { [key: string]: any } | null
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

export type MyFile = { mimetype: string; buffer: Buffer; size: number }

export type ArticlesAllowedFileExtension = 'docx' | 'html' | 'pdf' | 'json'

export type NewsAllowedFileExtension = 'docx' | 'html' | 'png'

export interface IAction {
    id?: string
    entity: 'menu' | 'articles' | 'news'
    action: 'add' | 'update' | 'delete'
    payload: {
        [key: string]: any
    }
    payloadIds: string[]
    status: ActionStatus
    user: string
    lastUpdateUser?: string
    keywords?: string[]
    timestamp: number
    lastUpdateTimestamp?: number
}

export type ActionStatus = 'pending' | 'approved' | 'declined'

export type ArticlesAllowedFileType =
    | 'text/html'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'application/pdf'
    | 'application/json'

export type NewsAllowedFileType =
    | 'text/html'
    | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    | 'image/png'

export type ArticleFileData = {
    ext: string
    mimetype: ArticlesAllowedFileType
    body: Buffer
    size: number
}

export type NewsFileData = {
    ext: string
    mimetype: NewsAllowedFileType
    body: Buffer
    size: number
}

export type Options = {
    [key: string]: (ArticlesAllowedFileExtension | NewsAllowedFileExtension)[]
}

export interface IJob {
    id?: string
    title: string
    steps: JobStep[]
    timestamp: number
    duration?: number
    currentStep: number
    status: JobStatus
    user: string
}

export type JobStatus = 'success' | 'normal' | 'exception' | 'active'

export type JobStep = {
    title: string
    description?: string
    duration?: number
}

export type JobUpdateBody = { currentStep?: number; status?: JobStatus }

export type MigrationOptions = {
    skip: number
    limit: number
    minOldId?: number
}
