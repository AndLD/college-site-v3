import { Request, Response } from 'express'
import { model } from '../model/model'
import { getAppSettings } from '../services/appSettingsManager'
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
    CallControllerCallbacksResults,
    Pagination,
    SubstringInStringFilter
} from '../utils/types'

export const controller = tryCatch(async function (req: Request, res: Response) {
    // Парсинг необходимых данных из запроса
    const [reqData, parseReqError] = parseReq(req) as DefaultResult
    if (parseReqError)
        return res.status(parseReqError.code).json({
            error: parseReqError.msg
        })

    const {
        method,
        id,
        singleResult,
        ids,
        pagination,
        select,
        order,
        obj,
        entity,
        email,
        where,
        controllerTriggers,
        controllerCallbacks
    } = reqData as {
        method: HttpMethod
        id: string
        singleResult: boolean
        ids: string[]
        pagination?: Pagination
        select?: string[]
        order?: [string, string]
        obj: Any
        entity: string
        email: string
        where: Filter[]
        controllerTriggers: undefined | ControllerTrigger[]
        controllerCallbacks: undefined | ControllerCallbackCaller[]
    }

    // const whereUserIsOwner: Filter = ['user', '==', email]
    // const findByUserEmail: boolean = (method == 'GET' || method == 'PUT' || method == 'DELETE') && !id

    // if (findByUserEmail) where.push(whereUserIsOwner)
    if (method == 'GET' && !id && singleResult)
        return res.json({
            result: null
        })

    let [modelResult, modelError] = (await controllerMethods[method]({
        id,
        ids,
        pagination,
        select,
        order,
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

    if (modelResult?._triggersResult) delete modelResult._triggersResult

    let meta
    if (modelResult?._meta) {
        meta = modelResult._meta
        delete modelResult._meta
    }

    return res.json({
        result: modelResult?.mainResult,
        meta,
        additionalResults: callbacksResults?.length && callbacksResults
    })
} as Controller)

const controllerMethods = {
    GET: async ({
        email,
        id,
        pagination,
        select,
        order,
        entity,
        where,
        controllerTriggers
    }: {
        email: string
        id?: string
        pagination?: Pagination
        select?: string[]
        order?: [string, string]
        entity: string
        where?: Filter[]
        controllerTriggers?: ControllerTrigger[]
    }) =>
        await model({
            email,
            collection: entity,
            where,
            docId: id,
            pagination,
            select,
            order,
            action: 'get',
            triggers: controllerTriggers
        }),

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
        ids,
        entity,
        controllerTriggers
    }: {
        email: string
        id: string
        ids: string[]
        entity: string
        controllerTriggers?: ControllerTrigger[]
    }) => {
        const [result, error] = await model({
            email,
            collection: entity,
            docId: id,
            docIds: ids,
            action: 'delete',
            triggers: controllerTriggers
        })
        return error ? [null, error] : [result, null]
    }
}

const parseReq = (req: any) => {
    // Метод запроса
    const method: HttpMethod = req.method

    // Получение id из настроек в файле json
    const settingsQuery: [string, string, string] | undefined = req.query.settings?.split(',')
    let idFromSettings: string | number | undefined
    if (settingsQuery && settingsQuery[0] === 'id' && settingsQuery[1] === '==') {
        const settings = getAppSettings()
        idFromSettings = settings[settingsQuery[2]]
    }

    // id объекта в БД для манипуляций
    const id: string | undefined = req.params.id || idFromSettings

    const singleResult: boolean = req.singleResult

    let ids: string[] | undefined
    if (method === 'DELETE') {
        ids = req.query.ids.split(',')
    }

    // Пагинация
    let pagination
    if (method === 'GET' && !id) {
        const results = parseInt(req.query.results) || 10
        const page = parseInt(req.query.page)
        if (page)
            pagination = {
                results,
                page
            }
    }

    // Поля для получения
    let select
    if (method === 'GET' && req.query.select) {
        select = req.query.select.split(',')
    }
    // Сортировка
    let order
    if (method === 'GET' && req.query.order) {
        order = req.query.order.split(',')
    }
    // Тело запроса
    const obj: Any = req.body
    // Получение "сущности", которая является названием коллекции в БД (entity)
    const entity: string = req.entity
    // Получение почты авторизованного пользователя
    const email: string = req.user?.email
    // Получение фильтров
    const [filters, error] = parseFilters({ queryParams: req.query }) as DefaultResult
    if (error) return [null, error]

    // where - блок условий для поиска по базе
    const where = filters

    const controllerTriggers = req.controllerTriggers
    const controllerCallbacks = req.controllerCallbacks

    return [
        {
            method,
            id,
            singleResult,
            ids,
            pagination,
            select,
            order,
            obj,
            entity,
            email,
            where,
            controllerTriggers,
            controllerCallbacks
        },
        null
    ]
}

// Функция парсит фильтры из query-параметров запроса
function parseFilters({
    queryParams
}: // method,
// id
{
    queryParams: { filters: string | undefined }
    // method: HttpMethod
    // id: string | undefined
}): DefaultResult {
    // if ((method == 'DELETE' && id) || (method == 'GET' && !id && queryParams.filters)) return [[], null]

    if (!queryParams.filters) return [[], null]

    try {
        const filters: Filter[] | SubstringInStringFilter[] = decodeURI(
            queryParams.filters as string
        )
            .split(':')
            .map((filter: string) => {
                const [key, operator, value]: [string, LogicOperator | 'contains', string] =
                    filter.split(',') as [string, LogicOperator | 'contains', string]

                let convertedValue: number | boolean | string = value

                const floatValue = parseFloat(value)

                if (isNaN(floatValue)) {
                    if (value == 'true') convertedValue = true
                    else if (value == 'false') convertedValue = false
                } else convertedValue = floatValue

                if (operator === 'contains' && typeof convertedValue !== 'string') {
                    throw '"contains" operator is possible to use with strings only'
                }

                return operator === 'contains'
                    ? [key, 'array-contains', convertedValue as string]
                    : [key, operator, convertedValue]
            })

        return [filters, null]
    } catch (e) {
        return [null, errors.BAD_FILTERS]
    }
}

/* Обработка "влекущих действий" (controllerCallbacks) - действий, которые должны произойти после основного запроса
    Например, при проведении операции должна быть добавлена операция, а потом изменено состояния баланса учавствующих в ней кошельков */
const callCallbacks = async (
    callbacks: ControllerCallbackCaller[] | undefined,
    modelResult: ModelResult
) => {
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
