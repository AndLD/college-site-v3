import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function Guide() {
    const token = useSelector((state: any) => state.app.token)
    // const [state, setState] = useState(null)

    useEffect(() => {
        let isMounted = true
        document.title = 'Admin Guide'

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout currentPage="Guide">
            <Title level={1}>Guide</Title>
            <div></div>
        </AdminLayout>
    )
}

export default Guide
