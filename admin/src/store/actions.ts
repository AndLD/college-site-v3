import {
    SET_AUTH,
    SET_TOKEN,
    SHOW_LOADER,
    HIDE_LOADER,
    SET_MENU_COLLAPSED,
    SET_ACTION_MODAL_VISIBILITY,
    SET_ACTION,
    SET_TABLE_SELECTED_ROWS
} from './types'

export const setAuth = (newAuth: boolean) => ({
    type: SET_AUTH,
    payload: newAuth
})

export const setToken = (newToken: string) => ({
    type: SET_TOKEN,
    payload: newToken
})

export const setMenuCollapsed = (collapsed: boolean) => ({
    type: SET_MENU_COLLAPSED,
    payload: collapsed
})

export const showLoader = () => ({
    type: SHOW_LOADER
})

export const hideLoader = () => ({
    type: HIDE_LOADER
})

export const setActionModalVisibility = (visible: boolean) => ({
    type: SET_ACTION_MODAL_VISIBILITY,
    payload: visible
})

export const setAction = (action: string) => ({
    type: SET_ACTION,
    payload: action
})

export const setTableSelectedRows = (tableSelectedRows: any[]) => ({
    type: SET_TABLE_SELECTED_ROWS,
    payload: tableSelectedRows
})
