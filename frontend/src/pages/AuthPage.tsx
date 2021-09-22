import { useEffect, useRef } from 'react'
import { getAuth, GoogleAuthProvider, signInWithPopup } from '@firebase/auth'
import { useDispatch } from 'react-redux'
import { setAuth, setToken } from '../store/actions'
import '../assets/css/AuthPage/authPage.css'
import googleLogo from '../assets/images/google.png'
import Logo from '../components/AuthPage/Logo'

const firebaseAuth = getAuth()

function Auth() {
    const dispatch = useDispatch()

    const backgroundImageLayerRef: any = useRef(null)

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

    useEffect(() => {
        setTimeout(() => {
            backgroundImageLayerRef.current.style = 'animation: background-image-sliding-idle 60s linear infinite;'
        }, 3000)
    }, [])

    const loginWithGoogle = (e: any) => {
        e.preventDefault()
        signInWithPopup(firebaseAuth, new GoogleAuthProvider()).then((userCredentials) => {
            if (userCredentials) {
                dispatch(setAuth(true))
            }
        })
    }

    return (
        <div id="auth-page">
            <div className="background-image-layer" ref={backgroundImageLayerRef}>
                <div className="background-gradient-layer">
                    <div className="auth-wrapper">
                        <Logo />
                        <form className="auth-form" action="">
                            <h1>ВСП "КРФК НАУ"</h1>

                            <h2>Вход через gmail</h2>
                            <div className="google-btn" onClick={loginWithGoogle}>
                                <img src={googleLogo} alt="Google OAuth2" />
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Auth
