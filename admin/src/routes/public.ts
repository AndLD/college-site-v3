import AuthPage from '../pages/AuthPage'
import MainPage from '../pages/MainPage'

const publicRoutes = [
    {
        path: '/',
        component: MainPage,
        exact: true
    },
    {
        path: '/auth',
        component: AuthPage,
        exact: true
    }
]

export default publicRoutes
