import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { RootStateOrAny, useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { setToken } from '../store/actions'
import publicRoutes from '../routes/public'
import privateRoutes from '../routes/private'
import Forbidden from '../pages/Forbidden'

const AppRouter = () => {
    const dispatch = useDispatch()

    const auth = useSelector((state: RootStateOrAny) => state.app.auth)
    const user = useSelector((state: any) => state.app.user)
    const [routes, setRoutes] = useState(publicRoutes)

    const [currentPage] = useState(window.localStorage.getItem('currentPage'))

    useEffect(() => {
        if (auth === true && user && user.status !== 'admin' && user.status !== 'moderator') {
            setRoutes([{ path: '/forbidden', component: Forbidden, exact: true }])
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
        <BrowserRouter>
            <Switch>
                {routes.map((route: { path: string; component: any; exact: boolean }) => (
                    <Route
                        path={route.path}
                        component={route.component}
                        exact={route.exact}
                        key={route.path}
                    />
                ))}

                <Redirect
                    to={
                        auth && user && user.status !== 'admin' && user.status !== 'moderator'
                            ? '/forbidden'
                            : auth && user
                            ? `/admin/${
                                  currentPage === 'Dashboard' || !currentPage ? '' : currentPage
                              }`
                            : !auth
                            ? '/auth'
                            : '/'
                    }
                />
            </Switch>
        </BrowserRouter>
    )
}

export default AppRouter
