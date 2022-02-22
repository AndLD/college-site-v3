const HOST = 'http://localhost:8080'
export const privateRoute = `${HOST}/api/private`
export const publicRoute = `${HOST}/api/public`

export const privateRoutes = {
    MENU: `${privateRoute}/menu`,
    APP_SETTINGS: `${privateRoute}/settings`,
    USER: `${privateRoute}/user`,
    AUTHORIZED_USER: `${privateRoute}/user/authorized`
}

export const publicRoutes = {
    MENU: `${publicRoute}/menu`
}
