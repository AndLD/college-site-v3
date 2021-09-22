import { Any, ControllerCallbackArgs, DefaultResult, ModelArgs, UpdateSchema } from '../utils/types'

import { model } from '../model/model'

// Изменение или удаление определенного объекта в БД
export const controllerCallback = async ({ email, entity, docId, action, updateSchema }: ControllerCallbackArgs) => {
    let obj: Any | null | undefined

    if (action == 'update' && updateSchema) {
        const [result, error]: DefaultResult = await processUpdateSchema({ email, entity, docId, updateSchema })
        if (error) return [null, error]

        obj = result
    }

    const [result, error] = await model({ collection: entity, docId, action, obj } as ModelArgs)
    if (error) return [null, error]

    return [result, null]
}

const processUpdateSchema = async ({
    email,
    entity,
    docId,
    updateSchema
}: {
    email: string
    entity: string
    docId: string
    updateSchema: UpdateSchema
}) => {
    const obj: Any = {}

    const [currentDoc, error] = await model({ email, collection: entity, docId, action: 'get' })
    if (error) return [null, error] as DefaultResult

    if (currentDoc)
        for (const instruction of updateSchema) {
            if (Array.isArray(instruction) && instruction.length == 3) {
                const [field, operator, value] = instruction

                if (typeof value == 'string' && !parseFloat(value as string))
                    throw '"value" in "updateSchema" must be number'

                obj[field] = eval(`currentDoc[field] ${operator} ${parseFloat(value as string)}`)
            }
        }

    return [obj, null] as DefaultResult
}
