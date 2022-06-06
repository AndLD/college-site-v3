import '../../styles/Auth/logo.css'
import logo from '../../assets/images/Auth/logo.png'
import { useSelector } from 'react-redux'

function Logo() {
    const publicUrl = useSelector((state: any) => state.app.env.publicUrl)

    return (
        <a href={publicUrl}>
            <img id="logo" alt="College logo" src={logo} />
        </a>
    )
}

export default Logo
