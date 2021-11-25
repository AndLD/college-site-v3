import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function Menu() {
    const token = useSelector((state: any) => state.app.token)
    const [menu, setMenu] = useState(null)

    useEffect(() => {
        let isMounted = true
        document.title = 'Admin Menu'

        setTimeout(() => {
            axios('http://localhost:8080/api/public/menu', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
                .then((resp) => {
                    if (isMounted) {
                        setMenu(resp.data)
                    }
                })
                .catch((e) => console.log(e))
        }, 3000)
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout currentPage="Menu">
            <Title level={1}>Menu</Title>
            <div style={{ textAlign: 'center' }}>{menu ? JSON.stringify(menu) : <Spin size="large" />}</div>
        </AdminLayout>
    )
}

export default Menu
