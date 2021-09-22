import { SHOW_LOADER, HIDE_LOADER, SHOW_ALERT, HIDE_ALERT, SET_AUTH, SET_TOKEN } from './types'

const initialState = {
    loading: false,
    alerts: [],
    auth: window.localStorage.getItem('auth') === 'true' ? true : false,
    token: window.localStorage.getItem('token') || ''
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

        case SHOW_LOADER:
            return { ...state, loading: true }
        case HIDE_LOADER:
            return { ...state, loading: false }

        case SHOW_ALERT:
            return { ...state, alerts: [...state.alerts, action.payload] }
        case HIDE_ALERT:
            return { ...state, alerts: state.alerts.filter((alert: any) => alert.id !== action.payload.id) }

        default:
            return state
    }
}
