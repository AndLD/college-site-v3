import { useEffect, useState } from 'react'
import { RootStateOrAny, useDispatch, useSelector } from 'react-redux'
import { Redirect, Route, Switch, useLocation } from 'react-router-dom'
import Forbidden from '../pages/Forbidden'
import privateRoutes from '../routes/private'
import publicRoutes from '../routes/public'
import { setToken } from '../store/actions'

function AppRouterSwitch() {
    const dispatch = useDispatch()

    const location = useLocation()

    const auth = useSelector((state: RootStateOrAny) => state.app.auth)
    const user = useSelector((state: any) => state.app.user)
    const [routes, setRoutes] = useState(publicRoutes)

    useEffect(() => {
        if (auth === true && user && user.status !== 'admin' && user.status !== 'moderator') {
            setRoutes([{ path: '/forbidden', component: Forbidden }])
        } else if (auth === true && user && user.status === 'admin') {
            setRoutes(privateRoutes)
        } else if (auth === true && user && user.status === 'moderator') {
            setRoutes([
                ...privateRoutes.filter(
                    (route: any) => !['/admin/settings', '/admin/users'].includes(route.path)
                )
            ])
        } else {
            setRoutes(publicRoutes)
            dispatch(setToken(''))
        }
    }, [auth, user])

    return (
        <Switch>
            {routes.map((route: { path: string; component: any }) => (
                <Route path={route.path} component={route.component} exact key={route.path} />
            ))}

            {/* // TODO: Refactor (make easier) */}
            <Redirect
                to={
                    auth && user && user.status !== 'admin' && user.status !== 'moderator'
                        ? '/forbidden'
                        : auth //&& user
                        ? location.pathname
                        : !auth
                        ? '/auth'
                        : '/'
                }
            />
        </Switch>
    )
}

export default AppRouterSwitch
