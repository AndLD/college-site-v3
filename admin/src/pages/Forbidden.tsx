import { CoffeeOutlined, CustomerServiceOutlined } from '@ant-design/icons'
import { useSelector } from 'react-redux'
import LogoutButton from '../components/AdminLayout/LogoutButton'
import '../styles/Forbidden.scss'

function Forbidden() {
    const user = useSelector((state: any) => state.app.user)

    return (
        <>
            <div className="forbidden-background-image">
                <div className="forbidden-container">
                    <div className="title">waiting room</div>
                    <div className="message">
                        You are{' '}
                        <span style={{ color: 'red' }}>
                            {user.status === 'unconfirmed' || user.status === 'banned'
                                ? user.status
                                : 'undefined'}
                        </span>
                    </div>
                    <div className="message">
                        Contact an admin to solve the problem{' '}
                        <CustomerServiceOutlined style={{ fontSize: 50 }} />
                    </div>
                    <span style={{ marginTop: 30 }}>
                        <LogoutButton />
                    </span>
                </div>
            </div>
        </>
    )
}

export default Forbidden
