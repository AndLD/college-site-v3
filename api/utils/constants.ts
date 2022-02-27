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
    ARTICLES: 'articles',
    MENU: 'menu',
    USERS: 'users',
    // SLIDERIMG: 'sliderImgs',
    APP_SETTINGS: 'app-settings',
    ACTIONS: 'actions'
}

export const googleDrive = {
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
    articlesFolderId: process.env.GOOGLE_DRIVE_ARTICLES_FOLDER_ID,
    newsFolderId: process.env.GOOGLE_DRIVE_NEWS_FOLDER_ID,
    testFolderId: process.env.GOOGLE_DRIVE_TEST_FOLDER_ID
}
