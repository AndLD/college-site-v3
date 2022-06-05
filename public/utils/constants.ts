const HOST = `http://${
    process.env.NODE_ENV === 'production'
        ? process.env.API_DOCKER_CONTAINER_NAME || 'localhost'
        : 'localhost'
}:8080`

export const publicRoute = `${HOST}/api/public`

export const publicRoutes = {
    MENU: `${publicRoute}/menu`,
    ARTICLE: `${publicRoute}/article`,
    NEWS: `${publicRoute}/news`
}
