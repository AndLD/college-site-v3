import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { getAuth } from '@firebase/auth'
import 'antd/dist/antd.css'
import './App.scss'
import AppRouter from './components/AppRouter'
import { setAuth, setToken } from './store/actions'

const firebaseAuth = getAuth()

function App() {
    const dispatch = useDispatch()

    useEffect(() => {
        firebaseAuth.onAuthStateChanged((userCredentials: any) => {
            if (userCredentials)
                userCredentials.getIdToken().then((token: string) => {
                    dispatch(setAuth(true))
                    dispatch(setToken(token))
                })
            else {
                dispatch(setAuth(false))
            }
        })
    }, [])

    return <AppRouter />
}

export default App
