import { getAuth, GoogleAuthProvider, signInWithPopup } from '@firebase/auth'
import { useDispatch } from 'react-redux'
import { setAuth } from '../../store/actions'
import Logo from './Logo'
import googleLogo from '../../assets/images/google.png'

const firebaseAuth = getAuth()

const AuthCard = () => {
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
    )
}

export default AuthCard
