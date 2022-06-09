import { BrowserRouter } from 'react-router-dom'
import AppRouterSwitch from './AppRouterSwitch'

const AppRouter = () => {
    return (
        <BrowserRouter>
            <AppRouterSwitch />
        </BrowserRouter>
    )
}

export default AppRouter
