import { model } from '../model/model'
import { errors } from '../utils/constants'
import { tryCatch } from '../utils/decorators'
import {
    Any,
    Controller,
    ControllerTrigger,
    HttpMethod,
    DefaultResult,
    LogicOperator,
    Filter,
    ModelResult,
    ControllerCallbackCaller,
    Error,
    CallControllerCallbacksResults
} from '../utils/types'

export const controller = tryCatch(async function (req: Any, res: Any) {
    // Парсинг необходимых данных из запроса
    const [reqData, parseReqError] = parseReq(req) as DefaultResult
    if (parseReqError)
        return res.status(parseReqError.code).json({
            error: parseReqError.msg
        })

    const { method, id, obj, entity, email, where, controllerTriggers, controllerCallbacks } = reqData as {
        method: HttpMethod
        id: string
        obj: Any
        entity: string
        email: string
        where: Filter[]
        controllerTriggers: undefined | ControllerTrigger[]
        controllerCallbacks: undefined | ControllerCallbackCaller[]
    }

    const whereUserIsOwner: Filter = ['user', '==', email]
    const findByUserEmail: boolean = (method == 'GET' || method == 'PUT' || method == 'DELETE') && !id

    if (findByUserEmail) where.push(whereUserIsOwner)

    let [modelResult, modelError] = (await controllerMethods[method]({
        id,
        obj,
        entity,
        email,
        where,
        controllerTriggers
    })) as [ModelResult | null, Error | null]
    if (modelError)
        return res.status(modelError.code || 500).json({
            error: modelError.msg
        })

    const [callbacksResults, callbackError]: CallControllerCallbacksResults = await callCallbacks(
        controllerCallbacks,
        modelResult as ModelResult
    )
    if (callbackError)
        return res.status(callbackError.code || 500).json({
            error: callbackError.msg
        })

    if (modelResult && modelResult._triggersResult) delete modelResult._triggersResult

    return res.json({
        result: modelResult,
        additionalResults: callbacksResults && callbacksResults.length ? callbacksResults : undefined
    })
} as Controller)

const controllerMethods = {
    GET: async ({
        email,
        id,
        entity,
        where,
        controllerTriggers
    }: {
        email: string
        id?: string
        entity: string
        where?: Filter[]
        controllerTriggers?: ControllerTrigger[]
    }) => await model({ email, collection: entity, where, docId: id, action: 'get', triggers: controllerTriggers }),

    POST: async ({
        obj,
        entity,
        email,
        controllerTriggers
    }: {
        obj: Any
        entity: string
        email: string
        controllerTriggers?: ControllerTrigger[]
    }) =>
        await model({
            collection: entity,
            action: 'add',
            obj: { ...obj, timestamp: Date.now(), user: email },
            triggers: controllerTriggers
        }),

    PUT: async ({
        email,
        id,
        obj,
        entity,
        findByUserEmail,
        controllerTriggers
    }: {
        email: string
        id?: string
        obj: Any
        entity: string
        findByUserEmail?: boolean
        controllerTriggers?: ControllerTrigger[]
    }) =>
        await model({
            email,
            collection: entity,
            docId: findByUserEmail ? obj[0].id : id,
            action: 'update',
            obj: {
                ...obj,
                lastUpdateTimestamp: Date.now()
            },
            triggers: controllerTriggers
        }),

    DELETE: async ({
        email,
        id,
        entity,
        controllerTriggers
    }: {
        email: string
        id: string
        entity: string
        controllerTriggers?: ControllerTrigger[]
    }) => {
        const [result, error] = await model({
            email,
            collection: entity,
            docId: id,
            action: 'delete',
            triggers: controllerTriggers
        })
        return error ? [null, error] : [result, null]
    }
}

const parseReq = (req: Any) => {
    // Метод запроса
    const method: HttpMethod = req.method
    // id объекта в БД для манипуляций
    const id: string | undefined = req.params.id
    // Тело запроса
    const obj: Any = req.body
    // Получение "сущности", которая является названием коллекции в БД (entity)
    const entity: string = req.entity
    // Получение почты авторизованного пользователя
    const email: string = req.user.email
    // Получение фильтров
    const [filters, error] = parseFilters({ queryParams: req.query, method, id }) as DefaultResult
    if (error) return [null, error]

    // where - блок условий для поиска по базе
    const where = filters
    const controllerTriggers = req.controllerTriggers
    const controllerCallbacks = req.controllerCallbacks

    return [{ method, id, obj, entity, email, where, controllerTriggers, controllerCallbacks }, null]
}

// Функция парсит фильтры из query-параметров запроса
function parseFilters({
    queryParams,
    method,
    id
}: {
    queryParams: { filters: string | undefined }
    method: HttpMethod
    id: string | undefined
}): DefaultResult {
    if ((method == 'DELETE' && id) || (method == 'GET' && !id && queryParams.filters)) return [[], null]

    try {
        const filters: Filter[] = decodeURI(queryParams.filters as string)
            .split(':')
            .map((filter: string) => {
                const [key, operator, value]: [string, LogicOperator, string] = filter.split(',') as [
                    string,
                    LogicOperator,
                    string
                ]

                return [key, operator, parseFloat(value)]
            })

        return [filters, null]
    } catch (e) {
        return [null, errors.BAD_FILTERS]
    }
}

/* Обработка "влекущих действий" (controllerCallbacks) - действий, которые должны произойти после основного запроса
    Например, при проведении операции должна быть добавлена операция, а потом изменено состояния баланса учавствующих в ней кошельков */
const callCallbacks = async (callbacks: ControllerCallbackCaller[] | undefined, modelResult: ModelResult) => {
    if (!callbacks) return [null, null] as CallControllerCallbacksResults

    const results: Any[] = []

    for (const callback of callbacks)
        if (typeof callback == 'function') {
            const [result, error] = await callback(modelResult)
            if (error) return [null, error] as CallControllerCallbacksResults

            if (result) results.push(result)
        }

    return [results, null] as CallControllerCallbacksResults
}
