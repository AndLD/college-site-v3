import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom'
import { RootStateOrAny, useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { setToken } from '../store/actions'
import publicRoutes from '../routes/public'
import privateRoutes from '../routes/private'

const AppRouter = () => {
    const dispatch = useDispatch()

    const auth = useSelector((state: RootStateOrAny) => state.app.auth)
    const [routes, setRoutes] = useState(publicRoutes)

    const [currentPage] = useState(window.localStorage.getItem('currentPage'))

    useEffect(() => {
        if (auth === true) {
            setRoutes([...privateRoutes, ...publicRoutes.filter((route) => route.path !== '/auth')])
        } else {
            setRoutes(publicRoutes)
            dispatch(setToken(''))
        }
    }, [auth])

    return (
        <BrowserRouter>
            <Switch>
                {routes.map((route: { path: string; component: any; exact: boolean }) => (
                    <Route path={route.path} component={route.component} exact={route.exact} key={route.path} />
                ))}

                <Redirect
                    to={auth ? `/admin/${currentPage === 'Dashboard' || !currentPage ? '' : currentPage}` : '/auth'}
                />
            </Switch>
        </BrowserRouter>
    )
}

export default AppRouter
