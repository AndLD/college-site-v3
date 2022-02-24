import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getAuth } from '@firebase/auth'
import 'antd/dist/antd.css'
import './App.scss'
import AppRouter from './components/AppRouter'
import { setAuth, setToken, setUser } from './store/actions'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { privateRoutes } from './utils/constants'
import { errorNotification } from './utils/notifications'
import { IUser } from './utils/types'

const firebaseAuth = getAuth()

function App() {
    const dispatch = useDispatch()

    async function fetchUser(token: string) {
        await axios(privateRoutes.AUTHORIZED_USER, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                const user: IUser = res.data.result
                dispatch(setUser(user))
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    useEffect(() => {
        firebaseAuth.onAuthStateChanged((userCredentials: any) => {
            if (userCredentials)
                userCredentials.getIdToken().then((token: string) => {
                    fetchUser(token).then(() => {
                        dispatch(setAuth(true))
                        dispatch(setToken(token))
                    })
                })
            else {
                dispatch(setAuth(false))
            }
        })
    }, [])

    return <AppRouter />
}

export default App
