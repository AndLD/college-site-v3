export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080'
export const privateRoute = `${API_URL}/api/private`
export const publicRoute = `${API_URL}/api/public`

export const privateRoutes = {
    MENU: `${privateRoute}/menu`,
    APP_SETTINGS: `${privateRoute}/settings`,
    USER: `${privateRoute}/user`,
    AUTHORIZED_USER: `${privateRoute}/user/authorized`,
    ARTICLE: `${privateRoute}/article`,
    NEWS: `${privateRoute}/news`,
    ACTION: `${privateRoute}/action`
}

export const publicRoutes = {
    MENU: `${publicRoute}/menu`,
    ARTICLE: `${publicRoute}/article`,
    NEWS: `${publicRoute}/news`
}
