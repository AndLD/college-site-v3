import firebase from '../configs/firebase-config'
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

export const model = async ({
    email,
    collection,
    where,
    docId,
    docIds,
    pagination,
    select,
    action,
    obj,
    triggers /*, noRecursion*/
}: ModelArgs) => {
    validateModelArgs({ where, docId, action })
    let mainResult, triggersResult, error

    // Выполнение триггеров
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
        const queryRef = prepareQueryRef({ collection, where, docId, pagination, select, action })

        // Making request
        const firebaseRes = await queryRef[action](obj)

        ;[mainResult, error] = await processFirebaseRes(
            firebaseRes,
            collection,
            docId,
            action,
            mainResult
        )

        if (error) return [null, error] as DefaultResult
    }

    let result: ModelResult =
        action == 'add' || action == 'update' ? { ...mainResult } : { mainResult }

    if (triggersResult && Object.keys(triggersResult as Any).length)
        result._triggersResult = triggersResult

    if (pagination)
        result._meta = {
            ...result._meta,
            pagination: { ...pagination, total: await getCollectionLength(collection) }
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

// ! Валидировать все аргументы функции
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
        throw `validateModelArgs: Missing docId during "${action}" action`
}

const prepareQueryRef = ({
    collection,
    where,
    docId,
    pagination,
    select,
    action
}: {
    collection: string
    where?: Filter[]
    docId?: string
    pagination?: Pagination
    select?: string[]
    action: ModelAction
}) => {
    let queryRef: any = db.collection(collection)

    // PUT & DELETE
    if (action == 'update' || action == 'delete') queryRef = queryRef.doc(docId)
    else if (docId) queryRef = queryRef.where(documentId, '==', docId)

    // GET
    if (where && action == 'get')
        for (const whereArgs of where) {
            console.log(whereArgs)
            queryRef = queryRef.where(...whereArgs)
        }

    if (action == 'get' && pagination)
        queryRef = queryRef /*.orderBy('timestamp')*/
            .offset((pagination.page - 1) * pagination.results)
            .limit(pagination.results)

    if (action == 'get' && select) queryRef = queryRef.select(...select)

    return queryRef
}

//TODO REFACTOR
//! For multiple deletion only
const makeBatchedDeletes = ({
    collection,
    docIds,
    action
}: {
    collection: string
    docIds: string[]
    action: ModelAction
}) => {
    if (action === 'delete') {
        const batch = db.batch()

        for (const id of docIds) {
            batch[action](db.collection(collection).doc(id))
        }

        return [batch.commit(), null]
    }
    return [
        null,
        {
            msg: 'Incorrect action: "delete" is only available for makeBatchedDeletes function',
            code: 500
        }
    ]
}

// Count documents of a collection
const getCollectionLength = async (collection: string) => {
    const list = await db.collection(collection).listDocuments()
    return (list as any)?.length
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
            result = firebaseRes.path.split('/')
            const id = result[result.length - 1]
            ;[result, error] = await module.exports.model({ collection, docId: id, action: 'get' })
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

// TODO Удалить
// Является ли пользователь владельцем документа
const isUserOwner = (doc: Any, email: string) => doc.user == email

// TODO Изменить
// "Есть ли у пользователя доступ": функция принимает первым аргументом документ / id документа, а вторым - email пользователя. Функция определяет есть ли у пользователя с email полномочия взаимодействовать с документом
const isUserHasAccess = async (data: string | Any, email: string, entity?: string) => {
    if (typeof data == 'string')
        data = await module.exports.model({ collection: entity, docId: data, action: 'get' })
    if (typeof data == 'object') {
        if (isUserOwner(data, email)) return [true, null]
        else {
            const [result, error] = await module.exports.model({
                collection: 'users',
                where: [['email', '==', data.user]],
                action: 'get'
            })
            if (error) return [null, error]
            return [result[0].friends.includes(email), null]
        }
    } else throw 'isUserHasAccess: Incorrect "doc"'
}
