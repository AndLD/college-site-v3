import '../../styles/Auth/logo.css'
import logo from '../../assets/images/Auth/logo.png'

function Logo() {
    return (
        <a href="/">
            <img id="logo" alt="Health Samurai logo" src={logo} />
        </a>
    )
}

export default Logo
