import {
    SET_AUTH,
    SET_TOKEN,
    FETCH_POSTS,
    CREATE_POST,
    SHOW_LOADER,
    HIDE_LOADER,
    SHOW_ALERT,
    HIDE_ALERT
} from './types'

export function setAuth(newAuth: any) {
    return {
        type: SET_AUTH,
        payload: newAuth
    }
}

export function setToken(newToken: any) {
    return {
        type: SET_TOKEN,
        payload: newToken
    }
}

export function createPost(post: any) {
    return {
        type: CREATE_POST,
        payload: post
    }
}

export function fetchPosts() {
    return async (dispatch: any) => {
        try {
            dispatch(showLoader())
            const res = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=4')
            const json = await res.json()
            setTimeout(() => {
                dispatch({ type: FETCH_POSTS, payload: json })
                dispatch(hideLoader())
            }, 2000)
        } catch (e) {
            const showAlertAction = showAlert({
                type: 'ERROR',
                message: 'Something went wrong...'
            })
            dispatch(showAlertAction)
            dispatch(hideLoader())

            setTimeout(() => {
                dispatch(hideAlert(showAlertAction.payload.id))
            }, 4000)
        }
    }
}

export function showLoader() {
    return {
        type: SHOW_LOADER
    }
}

export function hideLoader() {
    return {
        type: HIDE_LOADER
    }
}

export function showAlert({ message, type = 'WARNING' }: { message: string; type: string }) {
    let classNames = 'alert'

    switch (type) {
        case 'WARNING':
            classNames = 'alert alert-warning'
            break
        case 'ERROR':
            classNames = 'alert alert-danger'
            break
        case 'PRIMARY':
            classNames = 'alert alert-primary'
            break
        case 'SUCCESS':
            classNames = 'alert alert-success'
            break
        default:
            classNames = 'alert alert-light'
    }

    return {
        type: SHOW_ALERT,
        payload: {
            id: Date.now(),
            message,
            classNames
        }
    }
}

export function hideAlert(id: string | number) {
    return {
        type: HIDE_ALERT,
        payload: id
    }
}
