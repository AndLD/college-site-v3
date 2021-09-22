import { Any, DefaultResult } from '../utils/types'

// Validate for changes existence
export const comparePutReqBodyWithDoc: (body: Any, doc: Any) => DefaultResult = (body: Any, doc: Any) => {
    for (const key in body)
        if (body[key] == doc[key]) return [null, { msg: `'${key}' value has not changed`, code: 400 }]
    return [null, null]
}
