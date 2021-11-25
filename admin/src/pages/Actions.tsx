import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function Actions() {
    const token = useSelector((state: any) => state.app.token)
    const [actions, setActions] = useState(null)

    useEffect(() => {
        let isMounted = true
        document.title = 'Admin Actions'

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout currentPage="Actions">
            <Title level={1}>Actions</Title>
            <div></div>
        </AdminLayout>
    )
}

export default Actions
