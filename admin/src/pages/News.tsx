import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function News() {
    const token = useSelector((state: any) => state.app.token)
    const [news, setNews] = useState(null)

    useEffect(() => {
        let isMounted = true
        document.title = 'Admin News'

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout currentPage="News">
            <Title level={1}>News</Title>
            <div></div>
        </AdminLayout>
    )
}

export default News