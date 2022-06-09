import Actions from '../pages/Actions'
import Articles from '../pages/Articles'
import Dashboard from '../pages/Dashboard'
import Guide from '../pages/Guide'
import Menu from '../pages/Menu'
import News from '../pages/News'
import Preview from '../pages/Preview'
import Profile from '../pages/Profile'
import Settings from '../pages/Settings'
import Users from '../pages/Users'

const privateRoutes = [
    {
        path: '/admin',
        component: Dashboard
    },
    {
        path: '/admin/menu',
        component: Menu
    },
    {
        path: '/admin/news',
        component: News
    },
    {
        path: '/admin/articles',
        component: Articles
    },
    {
        path: '/admin/users',
        component: Users
    },
    {
        path: '/admin/actions',
        component: Actions
    },
    {
        path: '/admin/profile',
        component: Profile
    },
    {
        path: '/admin/settings',
        component: Settings
    },
    {
        path: '/admin/guide',
        component: Guide
    },
    {
        path: '/admin/preview/:actionId',
        component: Preview
    }
]

export default privateRoutes
