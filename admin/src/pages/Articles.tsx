import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function Articles() {
    const token = useSelector((state: any) => state.app.token)
    const [articles, setArticles] = useState(null)

    useEffect(() => {
        let isMounted = true
        document.title = 'Admin Articles'

        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout currentPage="Articles">
            <Title level={1}>Articles</Title>
            <div></div>
        </AdminLayout>
    )
}

export default Articles
