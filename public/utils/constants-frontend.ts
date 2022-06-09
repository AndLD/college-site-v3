// TODO: Refactor (guess we use what sould be placed at ".env.development")
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

const NGINX_API_URL =
    process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_NGINX_API_URL : API_URL

export const nginxPublicRoute = `${NGINX_API_URL}/api/public`

export const nginxPublicRoutes = {
    NEWS: `${nginxPublicRoute}/news`
}
