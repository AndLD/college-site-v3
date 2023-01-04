// TODO: Remove controller triggers & controller callbacks support

import { Request, Response } from 'express'
import { model } from '../model/model'
import { appSettingsService } from '../services/app-settings'
import { articlesService } from '../services/articles'
import { newsService } from '../services/news'
import { errors } from '../utils/constants'
import { tryCatch } from '../utils/decorators'
import { IAppSettingsPut } from '../utils/interfaces/app-settings/app-settings'
import {
    Any,
    Controller,
    HttpMethod,
    DefaultResult,
    LogicOperator,
    Filter,
    ModelResult,
    Error,
    Pagination,
    ArrayContainsFilter
} from '../utils/types'

export const controller = tryCatch(async function (req: Request, res: Response) {
    // Parse data from request
    const [reqData, parseReqError] = (await parseReq(req)) as DefaultResult
    if (parseReqError)
        return res.status(parseReqError.code).json({
            error: parseReqError.msg
        })

    const { method, id, singleResult, ids, pagination, select, order, obj, entity, email, where } = reqData as {
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
    }

    let replacedId: string | undefined

    // TODO: Replace oldIds in 'ids' the same way as 'id'
    if (method == 'GET' && id) {
        if (entity === 'articles') {
            ;[replacedId] = (await articlesService.replaceOldIds([id])) as string[]
        } else if (entity === 'news') {
            ;[replacedId] = (await newsService.replaceOldIds([id])) as string[]
        }
    }

    if (method == 'GET' && !id && singleResult) {
        return res.json({
            result: null
        })
    }

    let [modelResult, modelError] = (await controllerMethods[method]({
        id: replacedId || id,
        ids,
        pagination,
        select,
        order,
        obj,
        entity,
        email,
        where
    })) as [ModelResult | null, Error | null]
    if (modelError) {
        return res.status(modelError.code || 500).json({
            error: modelError.msg
        })
    }

    let meta
    if (modelResult?._meta) {
        meta = modelResult._meta
        delete modelResult._meta
    }

    return res.json({
        result: modelResult?.mainResult,
        meta
    })
} as Controller)

const controllerMethods = {
    GET: async ({
        email,
        id,
        ids,
        pagination,
        select,
        order,
        entity,
        where
    }: {
        email: string
        id?: string
        ids?: string[]
        pagination?: Pagination
        select?: string[]
        order?: [string, string]
        entity: string
        where?: Filter[]
    }) =>
        await model({
            email,
            collection: entity,
            where,
            docId: id,
            docIds: ids,
            pagination,
            select,
            order,
            action: 'get'
        }),

    POST: async ({ obj, entity, email }: { obj: Any; entity: string; email: string }) =>
        await model({
            collection: entity,
            action: 'add',
            obj: { ...obj, timestamp: Date.now(), user: email }
        }),

    PUT: async ({
        email,
        id,
        obj,
        entity,
        findByUserEmail
    }: {
        email: string
        id?: string
        obj: Any
        entity: string
        findByUserEmail?: boolean
    }) =>
        await model({
            email,
            collection: entity,
            docId: findByUserEmail ? obj[0].id : id,
            action: 'update',
            obj: {
                ...obj,
                lastUpdateTimestamp: Date.now()
            }
        }),

    DELETE: async ({ email, id, ids, entity }: { email: string; id: string; ids: string[]; entity: string }) => {
        const [result, error] = await model({
            email,
            collection: entity,
            docId: id,
            docIds: ids,
            action: 'delete'
        })
        return error ? [null, error] : [result, null]
    }
}

async function parseReq(req: any) {
    // Метод запроса
    const method: HttpMethod = req.method

    // Получение id из настроек
    const settingsQuery: [string, string, string] | undefined = req.query.settings?.split(',')
    let idFromSettings: string | number | undefined
    if (settingsQuery && settingsQuery[0] === 'id' && settingsQuery[1] === '==' && settingsQuery[2]) {
        // TODO: Refactor: replace 'any'
        const settings: any = await appSettingsService.getAll()
        idFromSettings = settings[settingsQuery[2]]
    }

    // id объекта в БД для манипуляций
    const id: string | undefined = req.params.id || idFromSettings

    const singleResult: boolean = req.singleResult

    let ids: string[] | undefined
    if (method === 'DELETE' || method === 'GET') {
        ids = req.query.ids?.split(',')
    }

    // Пагинация
    let pagination
    if (method === 'GET' && !id && !ids) {
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
            where
        },
        null
    ]
}

// Функция парсит фильтры из query-параметров запроса
function parseFilters({ queryParams }: { queryParams: { filters: string | undefined } }): DefaultResult {
    if (!queryParams.filters) return [[], null]

    try {
        const filters: Filter[] | ArrayContainsFilter[] = decodeURI(queryParams.filters)
            .split(':')
            .map((filter: string) => {
                const [key, operator, value] = filter.split(',') as [string, LogicOperator | 'contains' | 'in', string]

                let convertedValue: number | boolean | string = value

                if (!['contains', 'in'].includes(operator)) {
                    const floatValue = parseFloat(value as string)

                    if (floatValue) {
                        convertedValue = floatValue
                    } else if (value === 'true') convertedValue = true
                    else if (value === 'false') convertedValue = false
                }

                if (operator === 'contains') {
                    return [key, 'array-contains', convertedValue as string]
                } else if (operator === 'in') {
                    return [key, 'in', (convertedValue as string).split('.')]
                } else return [key, operator, convertedValue]
            })

        return [filters, null]
    } catch (e) {
        return [null, errors.BAD_FILTERS]
    }
}
