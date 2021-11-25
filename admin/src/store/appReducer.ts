import { SHOW_LOADER, HIDE_LOADER, SET_AUTH, SET_TOKEN, SET_MENU_COLLAPSED } from './types'

const initialState = {
    loading: false,
    auth: window.localStorage.getItem('auth') === 'true' ? true : false,
    token: window.localStorage.getItem('token') || '',
    menu: {
        collapsed: window.localStorage.getItem('adminMenuCollapsed') === 'true' ? true : false
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

        default:
            return state
    }
}
