import firebase from '../configs/firebase-config'
import {
    Any,
    ControllerTrigger,
    ControllerTriggerArgs,
    DefaultResult,
    Filter,
    ModelAction,
    ModelArgs
} from '../utils/types'
import { errors } from '../utils/constants'

const { db, documentId } = firebase

export const model = async ({ email, collection, where, docId, action, obj, triggers, noRecursion }: ModelArgs) => {
    validateModelArgs({ where, docId, action })

    let result, triggersResult, error

    // Выполнение триггеров
    if (triggers) {
        ;[triggersResult, error] = await callTriggers(triggers, { email, docId, obj } as ControllerTriggerArgs)
        if (error) return [null, error] as DefaultResult
    }

    if (!docId && action == 'get' && !noRecursion) {
        ;[result, error] = await module.exports.model({ collection, where, action, noRecursion: true })
        if (error) return [null, error] as DefaultResult
    }

    // При получении, изменении, удалении объекта по id необходимо проверить, есть у юзера доступ к данному объекту
    if (email && docId && (action == 'get' || action == 'update' || action == 'delete')) {
        ;[result, error] = await module.exports.model({ collection, docId, action: 'get' })
        if (error) return [null, error] as DefaultResult
        if (result) {
            // Проверка, есть ли у юзера доступ к объекту
            if (!(await isUserHasAccess(result, email))) return [null, errors.USER_HAS_NO_RIGHTS] as DefaultResult
        } else return [null, errors.DOC_NOT_FOUND] as DefaultResult
    }

    const queryRef = prepareQueryRef({ collection, where, docId, action })

    // Making request
    const firebaseRes = await queryRef[action](obj)

    ;[result, error] = await proccessFirebaseRes(firebaseRes, collection, docId, action, result)

    if (error) return [null, error] as DefaultResult

    if (triggersResult && Object.keys(triggersResult as Any).length)
        return [{ ...result, _triggersResult: triggersResult }, null]
    else return [result, null] as DefaultResult
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
const validateModelArgs = ({ where, docId, action }: { where?: Filter[]; docId?: string; action: ModelAction }) => {
    if (!['get', 'add', 'update', 'delete'].includes(action)) throw 'validateModelArgs: Incorrect action'
    if (['add', 'update', 'delete'].includes(action) && where) throw 'validateModelArgs: Incorrect mix: action & where'
    if ((action == 'update' || action == 'delete') && !docId)
        throw `validateModelArgs: Missing docId during "${action}" action`
}

const prepareQueryRef = ({
    collection,
    where,
    docId,
    action
}: {
    collection: string
    where?: Filter[]
    docId?: string
    action: ModelAction
}) => {
    let queryRef: any = db.collection(collection)

    // PUT & DELETE
    if (action == 'update' || action == 'delete') queryRef = queryRef.doc(docId)
    else if (docId) queryRef = queryRef.where(documentId, '==', docId)

    // GET
    if (where && action == 'get') for (const whereArgs of where) queryRef = queryRef.where(...whereArgs)

    return queryRef
}

// Processing firebase response for different types of actions
const proccessFirebaseRes = async (
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

// Является ли пользователь владельцем документа
const isUserOwner = (doc: Any, email: string) => doc.user == email

// "Есть ли у пользователя доступ": функция принимает первым аргументом документ / id документа, а вторым - email пользователя. Функция определяет есть ли у пользователя с email полномочия взаимодействовать с документом
const isUserHasAccess = async (data: string | Any, email: string, entity?: string) => {
    if (typeof data == 'string') data = await module.exports.model({ collection: entity, docId: data, action: 'get' })
    if (typeof data == 'object') {
        if (isUserOwner(data, email)) return [true, null]
        else {
            const [result, error] = await module.exports.model({
                collection: 'settings',
                where: [['user', '==', data.user]],
                action: 'get'
            })
            if (error) return [null, error]
            return [result[0].friends.includes(email), null]
        }
    } else throw 'isUserHasAccess: Incorrect "doc"'
}
