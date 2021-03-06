import { Button } from 'antd'
import { getAuth } from 'firebase/auth'
import { MouseEventHandler } from 'react'
import { useDispatch } from 'react-redux'
import { setAuth, setToken } from '../../store/actions'

function LogoutButton() {
    const dispatch = useDispatch()

    const logout: MouseEventHandler<HTMLElement> = (e) => {
        e.preventDefault()
        getAuth()
            .signOut()
            .then(() => {
                localStorage.removeItem('currentPage')
                // dispatch(setToken(''))
                dispatch(setAuth(false))
            })
    }

    return (
        <Button type="primary" onClick={logout}>
            Logout
        </Button>
    )
}

export default LogoutButton
