import {
    SHOW_LOADER,
    HIDE_LOADER,
    SET_AUTH,
    SET_TOKEN,
    SET_MENU_COLLAPSED,
    SET_ACTION_MODAL_VISIBILITY,
    SET_ACTION,
    SET_TABLE_SELECTED_ROWS,
    SET_ACTION_SUCCESS_CALLBACK,
    SET_USER,
    SET_SOCKET
} from './types'

const initialState = {
    loading: false,
    auth: window.localStorage.getItem('auth') === 'true' ? true : false,
    token: window.localStorage.getItem('token') || '',
    menu: {
        collapsed: window.localStorage.getItem('adminMenuCollapsed') === 'true' ? true : false
    },
    actionModalVisibility: false,
    action: 'Add',
    env: {
        publicUrl:
            process.env.NODE_ENV === 'production'
                ? process.env.REACT_APP_PROD_PUBLIC_URL
                : process.env.REACT_APP_DEV_PUBLIC_URL
    }
}

export const appReducer = (
    state = initialState,
    action: {
        type: string
        payload: any
    }
) => {
    switch (action.type) {
        case SET_AUTH:
            window.localStorage.setItem('auth', action.payload)
            return { ...state, auth: action.payload }
        case SET_TOKEN:
            window.localStorage.setItem('token', action.payload)
            return { ...state, token: action.payload }

        case SET_MENU_COLLAPSED:
            window.localStorage.setItem('adminMenuCollapsed', action.payload)
            return { ...state, menu: { ...state.menu, collapsed: action.payload } }

        case SHOW_LOADER:
            return { ...state, loading: true }
        case HIDE_LOADER:
            return { ...state, loading: false }

        case SET_ACTION_MODAL_VISIBILITY:
            return { ...state, actionModalVisibility: action.payload }
        case SET_ACTION:
            return { ...state, action: action.payload }
        case SET_TABLE_SELECTED_ROWS:
            return { ...state, tableSelectedRows: action.payload }
        case SET_ACTION_SUCCESS_CALLBACK:
            return { ...state, actionSuccessCallback: action.payload }

        case SET_USER:
            return { ...state, user: action.payload }

        case SET_SOCKET:
            return { ...state, socket: action.payload }

        default:
            return state
    }
}
