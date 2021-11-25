import Actions from '../pages/Actions'
import Articles from '../pages/Articles'
import Dashboard from '../pages/Dashboard'
import Guide from '../pages/Guide'
import Menu from '../pages/Menu'
import News from '../pages/News'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'
import Users from '../pages/Users'

const privateRoutes = [
    {
        path: '/admin',
        component: Dashboard,
        exact: true
    },
    {
        path: '/admin/menu',
        component: Menu,
        exact: true
    },
    {
        path: '/admin/news',
        component: News,
        exact: true
    },
    {
        path: '/admin/articles',
        component: Articles,
        exact: true
    },
    {
        path: '/admin/users',
        component: Users,
        exact: true
    },
    {
        path: '/admin/actions',
        component: Actions,
        exact: true
    },
    {
        path: '/admin/profile',
        component: Profile,
        exact: true
    },
    {
        path: '/admin/settings',
        component: Settings,
        exact: true
    },
    {
        path: '/admin/guide',
        component: Guide,
        exact: true
    }
]

export default privateRoutes
