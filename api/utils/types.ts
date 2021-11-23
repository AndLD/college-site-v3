import { IMenuBlock } from './interfaces/menu/menu'

export type Any = { [key: string]: any }

export type Error = {
    msg: string
    code: number
}
export type DefaultResult = [Any | null, Error | null]
export type ArrayResult = [Any | [] | null, Error | null]

export type Controller = (req: Any, res: Any, next?: any) => any

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type LogicOperator = '<' | '<=' | '==' | '>=' | '>'
export type UpdateOperator = '+' | '-'
export type Filter = [string, LogicOperator, number | boolean | string]
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
    action: ModelAction
    obj?: Any
    triggers?: ControllerTrigger[]
    noRecursion?: boolean
}
export type Entity = IMenuBlock
export type EntityName = 'menu' | 'articles' | 'news' | 'users' | 'history'
export type ModelResult = { [key in keyof Entity | '_triggersResult']: any }

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