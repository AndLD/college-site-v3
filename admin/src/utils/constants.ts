const HOST = 'http://localhost:8080'
const privateRoute = `${HOST}/api/private`
const publicRoute = `${HOST}/api/public`

export const privateRoutes = {
    MENU: `${privateRoute}/menu`,
    APP_SETTINGS: `${privateRoute}/settings`
}

export const publicRoutes = {
    MENU: `${publicRoute}/menu`
}
