import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function News() {
    const token = useSelector((state: any) => state.app.token)

    useEffect(() => {
        document.title = 'Admin News'
    }, [])

    return (
        <AdminLayout currentPage="News">
            <Title level={1}>News</Title>
            <div></div>
        </AdminLayout>
    )
}

export default News
