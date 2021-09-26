import '../assets/css/AuthPage/authPage.css'
import AuthCard from '../components/AuthPage/AuthCard'

function AuthPage() {
    return (
        <div id="auth-page">
            <div
                className="background-image-layer"
                style={{ animation: 'background-image-sliding-idle 60s linear infinite', animationDelay: '3s' }}
            >
                <div className="background-gradient-layer">
                    <AuthCard />
                </div>
            </div>
        </div>
    )
}

export default AuthPage
