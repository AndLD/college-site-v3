import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function Users() {
    const token = useSelector((state: any) => state.app.token)
    const [users, setUsers] = useState(null)

    useEffect(() => {
        let isMounted = true
        document.title = 'Admin Users'

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout currentPage="Users">
            <Title level={1}>Users</Title>
            <div></div>
        </AdminLayout>
    )
}

export default Users
