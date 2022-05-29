const HOST = 'http://127.0.0.1:8080'
export const privateRoute = `${HOST}/api/private`
export const publicRoute = `${HOST}/api/public`

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
