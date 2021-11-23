import { Error } from './types'

export const errors: {
    [key: string]: Error
} = {
    BAD_HTTP_METHOD: { msg: 'Unexpected http request method', code: 405 },
    BAD_FILTERS: { msg: 'Invalid filters in query params', code: 400 },
    USER_HAS_NO_RIGHTS: {
        msg: 'User does not have enough permissions to use the document',
        code: 403
    },
    DOC_NOT_FOUND: { msg: 'The document does not exist', code: 404 }
}

export const entities: {
    [key: string]: string
} = {
    NEWS: 'news',
    ARTICLE: 'articles',
    MENU: 'menu',
    USERS: 'users',
    SLIDERIMG: 'sliderImgs',
    HISTORY: 'history'
}
