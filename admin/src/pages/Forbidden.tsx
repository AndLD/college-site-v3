import { useSelector } from 'react-redux'
import '../styles/Forbidden.scss'

function Forbidden() {
    const user = useSelector((state: any) => state.app.user)

    return (
        <>
            <div className="forbidden-background-image">
                <div className="forbidden-container">
                    <div className="title">403</div>
                    <div className="message">
                        You are{' '}
                        <span style={{ color: 'red' }}>
                            {['unconfirmed', 'banned'].includes(user.status)
                                ? user.status
                                : 'undefined'}
                        </span>
                        !
                    </div>
                    <div className="message">Contact an admin to solve the problem.</div>
                </div>
            </div>
        </>
    )
}

export default Forbidden
