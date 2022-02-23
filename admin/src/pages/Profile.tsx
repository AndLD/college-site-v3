import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function Profile() {
    const token = useSelector((state: any) => state.app.token)
    const user = useSelector((state: any) => state.app.user)
    useEffect(() => {
        let isMounted = true
        document.title = 'Admin Profile'
        console.log(user)
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout currentPage="Profile">
            <Title level={1}>Profile</Title>
            <div></div>
        </AdminLayout>
    )
}

export default Profile
