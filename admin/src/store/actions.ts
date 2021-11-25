import { SET_AUTH, SET_TOKEN, SHOW_LOADER, HIDE_LOADER, SET_MENU_COLLAPSED } from './types'

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

export function setMenuCollapsed(collapsed: any) {
    return {
        type: SET_MENU_COLLAPSED,
        payload: collapsed
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
