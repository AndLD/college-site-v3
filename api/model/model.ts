import { firebase } from '../configs/firebase-config'
import {
    Any,
    ControllerTrigger,
    ControllerTriggerArgs,
    DefaultResult,
    Filter,
    ModelAction,
    ModelArgs,
    ModelResult,
    Pagination
} from '../utils/types'

const { db, documentId } = firebase

if (!db || !documentId) {
    throw '"db" or "documentId" variables are undefined'
}

// TODO: Refactor & Optimization: Separate "model" function into small functions. Use TRANSACTIONS, BATCH and BULK requests
export const model = async ({
    email,
    collection,
    where,
    docId,
    docIds,
    pagination,
    select,
    order,
    action,
    obj,
    triggers /*, noRecursion*/
}: ModelArgs) => {
    validateModelArgs({ where, docId, action })
    let mainResult, triggersResult, error
    let total = 0

    // Perform triggers
    if (triggers) {
        ;[triggersResult, error] = await callTriggers(triggers, {
            email,
            docId,
            obj
        } as ControllerTriggerArgs)
        if (error) return [null, error] as DefaultResult
    }

    // // Если GET, не указан ID, рекурсия позволена
    // if (!docId && action == 'get' && !noRecursion) {
    //     ;[result, error] = await module.exports.model({ collection, where, action, noRecursion: true })
    //     if (error) return [null, error] as DefaultResult
    // }

    // // Если GET || PUT || DELETE, указан email, указан ID
    // // При получении, изменении, удалении объекта по id необходимо проверить, есть у юзера доступ к данному объекту
    // if (/*email && */ docId && (action == 'get' || action == 'update' || action == 'delete')) {
    //     ;[result, error] = await module.exports.model({ collection, docId, action: 'get' })
    //     if (error) return [null, error] as DefaultResult
    //     if (result) {
    //         // Проверка, есть ли у юзера доступ к объекту
    //         // if (!(await isUserHasAccess(result, email))) return [null, errors.USER_HAS_NO_RIGHTS] as DefaultResult
    //     } else return [null, errors.DOC_NOT_FOUND] as DefaultResult
    // }

    if (action === 'delete' && docIds) {
        ;[mainResult, error] = await makeBatchedDeletes({ collection, docIds, action })

        if (error) return [null, error] as DefaultResult
    } else {
        const { queryRef, metaQuertRef } = prepareQueryRef({
            collection,
            where,
            docId,
            docIds,
            pagination,
            select,
            order,
            action
        })

        // Making request
        const firebaseRes = await queryRef[docId && action == 'add' ? 'set' : action](obj)

        ;[mainResult, error] = await processFirebaseRes(
            firebaseRes,
            collection,
            docId,
            action,
            mainResult
        )

        if (error) return [null, error] as DefaultResult

        if (metaQuertRef) {
            try {
                const metaResult = await metaQuertRef.get()

                metaResult.forEach(() => total++)
            } catch (e) {
                throw 'Error getting total docs count!'
            }
        }
    }

    let result: ModelResult =
        action == 'add' || action == 'update' ? { ...mainResult } : { mainResult }

    if (triggersResult && Object.keys(triggersResult as Any).length)
        result._triggersResult = triggersResult

    if (pagination)
        result._meta = {
            ...result._meta,
            // TODO: в pagination.total нужно задавать количество не всех документов коллекции, а тех, которые соответствуют фильтрам и сортировке
            pagination: { ...pagination, total: total || (await getCollectionLength(collection)) }
        }
    return [result, null] as DefaultResult
}

const callTriggers = async (triggers: ControllerTrigger[], args: ControllerTriggerArgs) => {
    const results = {}

    for (const trigger of triggers) {
        const [result, error] = await trigger(args)
        if (error) return [null, error]
        Object.assign(results, result)
    }

    return [results, null]
}

// TODO: Validate all "model" function parameters
const validateModelArgs = ({
    where,
    docId,
    action
}: {
    where?: Filter[]
    docId?: string
    action: ModelAction
}) => {
    if (['add', 'update', 'delete'].includes(action) && where)
        throw 'validateModelArgs: Incorrect mix: action & where'
    if (action == 'update' && !docId)
        throw `validateModelArgs: Missing docId or docIds during "${action}" action`
}

const prepareQueryRef = ({
    collection,
    where,
    docId,
    docIds,
    pagination,
    select,
    order,
    action
}: {
    collection: string
    where?: Filter[]
    docId?: string
    docIds?: string[]
    pagination?: Pagination
    select?: string[]
    order?: [string, string]
    action: ModelAction
}) => {
    let queryRef: any = db.collection(collection)
    let metaQuertRef: any

    // PUT & DELETE
    if (action == 'update' || action == 'delete' || (action == 'add' && docId)) {
        queryRef = queryRef.doc(docId)
    } else if (action == 'get' && docId) {
        queryRef = queryRef.where(documentId, '==', docId)
    } else if (action == 'get' && docIds) {
        queryRef = queryRef.where(documentId, 'in', docIds)
    }

    // GET
    if (where && action == 'get') {
        for (const whereArgs of where) {
            queryRef = queryRef.where(...whereArgs)
        }
    }

    if (action == 'get' && pagination) {
        // TODO: Уязвимость: первым элементом массива order может быть любая строка, необходимо валидировать на соответствие полям получаемой сущности
        if (order && (order[1] === 'desc' || order[1] === 'asc')) {
            queryRef = queryRef.orderBy(...order)
        } else {
            // TODO: При использовании оператора фильтра 'like' необходимо выполнять сортировку только по ключу, к которому относится 'like'
            queryRef = queryRef.orderBy('timestamp')
        }
        metaQuertRef = queryRef.select()

        queryRef = queryRef
            .offset((pagination.page - 1) * pagination.results)
            .limit(pagination.results)
    }

    if (action == 'get' && select) queryRef = queryRef.select(...select)

    return {
        queryRef,
        metaQuertRef
    }
}

// TODO: Refactor
// For multiple deletion only
const makeBatchedDeletes = ({
    collection,
    docIds,
    action
}: {
    collection: string
    docIds: string[]
    action: ModelAction
}) => {
    if (action !== 'delete') {
        return [
            null,
            {
                msg: 'Incorrect action: "delete" is only available for makeBatchedDeletes function',
                code: 500
            }
        ]
    }

    const batch = db.batch()

    for (const id of docIds) {
        batch[action](db.collection(collection).doc(id))
    }

    // TODO: Add "await" before batch.commit()
    return [batch.commit(), null]
}

// Count documents of a collection
export const getCollectionLength = async (collection: string) => {
    return (await db.collection(collection).listDocuments())?.length
}

// Processing firebase response for different types of actions
const processFirebaseRes = async (
    firebaseRes: Any,
    collection: string,
    docId: string | undefined,
    action: ModelAction,
    result: any
) => {
    let error

    if (!result) result = []

    switch (action) {
        case 'get':
            firebaseRes.forEach((doc: Any) => {
                if (docId)
                    result = {
                        id: doc.id,
                        ...doc.data()
                    }
                else
                    result.push({
                        id: doc.id,
                        ...doc.data()
                    })
            })
            break
        case 'add':
            if (!docId) {
                result = firebaseRes.path.split('/')
                var id = result[result.length - 1]
            }
            ;[result, error] = await module.exports.model({
                collection,
                docId: docId || id,
                action: 'get'
            })
            if (error) return [null, error]
            break
        case 'update':
            ;[result, error] = await module.exports.model({ collection, docId, action: 'get' })
            if (error) return [null, error]
            break
        case 'delete':
            break
    }

    return [Array.isArray(result) ? (result.length > 0 ? result : null) : result, null]
}

// TODO: Remove
// Is user document owner
// const isUserOwner = (doc: Any, email: string) => doc.user == email

// TODO Remove
// "Есть ли у пользователя доступ": функция принимает первым аргументом документ / id документа, а вторым - email пользователя. Функция определяет есть ли у пользователя с email полномочия взаимодействовать с документом
// const isUserHasAccess = async (data: string | Any, email: string, entity?: string) => {
//     if (typeof data == 'string')
//         data = await module.exports.model({ collection: entity, docId: data, action: 'get' })
//     if (typeof data == 'object') {
//         if (isUserOwner(data, email)) return [true, null]
//         else {
//             const [result, error] = await module.exports.model({
//                 collection: 'users',
//                 where: [['email', '==', data.user]],
//                 action: 'get'
//             })
//             if (error) return [null, error]
//             return [result[0].friends.includes(email), null]
//         }
//     } else throw 'isUserHasAccess: Incorrect "doc"'
// }
