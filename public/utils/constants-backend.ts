const API_URL =
    process.env.API_URL ||
    `http://${
        process.env.NODE_ENV === 'production'
            ? process.env.API_DOCKER_CONTAINER_NAME || 'localhost'
            : 'localhost'
    }:8080`

export const publicRoute = `${API_URL}/api/public`

export const publicRoutes = {
    MENU: `${publicRoute}/menu`,
    ARTICLE: `${publicRoute}/article`,
    NEWS: `${publicRoute}/news`
}
