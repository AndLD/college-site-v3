import { useEffect } from 'react'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { useDispatch } from 'react-redux'
import AuthCard from '../components/AuthPage/AuthCard'
import { setAuth, setToken } from '../store/actions'

const firebaseAuth = getAuth()

function AuthPage() {
    const dispatch = useDispatch()

    useEffect(() => {
        firebaseAuth.onAuthStateChanged((userCredentials: any) => {
            if (userCredentials)
                userCredentials.getIdToken().then((token: string) => {
                    dispatch(setAuth(true))
                    dispatch(setToken(token))
                    console.log(token)
                })
        })
    }, [])

    const loginWithGoogle = (e: MouseEvent) => {
        e.preventDefault()
        signInWithPopup(firebaseAuth, new GoogleAuthProvider()).then((userCredentials) => {
            if (userCredentials) {
                dispatch(setAuth(true))
            }
        })
    }

    return (
        <div>
            <h1>Auth Page</h1>

            <AuthCard loginWithGoogle={loginWithGoogle} />

            <br />
            <a href="/profile">Profile Page</a>
            <br />
            <a href="/">Main Page</a>
        </div>
    )
}

export default AuthPage
