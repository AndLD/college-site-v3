import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function Settings() {
    const token = useSelector((state: any) => state.app.token)
    const [settings, setSettings] = useState(null)

    useEffect(() => {
        let isMounted = true
        document.title = 'Admin Settings'

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout currentPage="Settings">
            <Title level={1}>Settings</Title>
            <div></div>
        </AdminLayout>
    )
}

export default Settings
