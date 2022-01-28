const HOST = 'http://localhost:8080'
const privateRoute = `${HOST}/api/private`

export const privateRoutes = {
    MENU: `${privateRoute}/menu`,
    APP_SETTINGS: `${privateRoute}/settings`
}
