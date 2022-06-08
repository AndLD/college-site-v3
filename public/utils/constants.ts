const HOST =
    process.env.API_URL ||
    `http://${
        process.env.ENVIRONMENT === 'prod'
            ? process.env.API_DOCKER_CONTAINER_NAME || 'localhost'
            : 'localhost'
    }:8080`

export const publicRoute = `${HOST}/api/public`

export const publicRoutes = {
    MENU: `${publicRoute}/menu`,
    ARTICLE: `${publicRoute}/article`,
    NEWS: `${publicRoute}/news`
}
