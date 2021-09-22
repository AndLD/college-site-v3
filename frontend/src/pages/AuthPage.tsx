import { getAuth, GoogleAuthProvider, signInWithPopup } from '@firebase/auth'
import { useDispatch } from 'react-redux'
import { setAuth } from '../store/actions'
import '../assets/css/AuthPage/authPage.css'
import googleLogo from '../assets/images/google.png'
import Logo from '../components/AuthPage/Logo'

const firebaseAuth = getAuth()

function Auth() {
    const dispatch = useDispatch()

    function loginWithGoogle(e: any) {
        e.preventDefault()
        signInWithPopup(firebaseAuth, new GoogleAuthProvider())
            .then((userCredentials) => {
                if (userCredentials) {
                    dispatch(setAuth(true))
                }
            })
            .catch((e) => {
                console.log(e.toString())
            })
    }

    return (
        <div id="auth-page">
            <div
                className="background-image-layer"
                style={{ animation: 'background-image-sliding-idle 60s linear infinite', animationDelay: '3s' }}
            >
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
