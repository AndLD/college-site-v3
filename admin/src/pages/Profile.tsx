import { Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import Text from 'antd/lib/typography/Text'
import UserDescription from '../components/Profile/UserDescription'
import '../styles/Profile.scss'
import Tags from '../components/Users/Tags'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification } from '../utils/notifications'

const { Title } = Typography

function Profile() {
    const token = useSelector((state: any) => state.app.token)
    const user = useSelector((state: any) => state.app.user)

    const [userDescription, setUserDescription] = useState<string>(user.description)

    useEffect(() => {
        document.title = 'Admin Profile'
    }, [])

    function updateAuthorizedUser(data: { description?: string; tags?: string[] }) {
        axios(`${privateRoutes.USER}/authorized`, {
            method: 'PUT',
            data,
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                successNotification('User has been successfully updated!')
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    return (
        <AdminLayout currentPage="Profile">
            <Title level={1}>Profile</Title>
            <Title level={3}>{user.name}</Title>
            <Text code style={{ fontSize: 20 }}>
                {user.email}
            </Text>
            <UserDescription
                userDescriotionState={[userDescription, setUserDescription]}
                onSave={(data) => updateAuthorizedUser(data)}
            />
            <Tags
                tags={user.tags}
                onSave={(newTags: string[]) => updateAuthorizedUser({ tags: newTags })}
            />
        </AdminLayout>
    )
}

export default Profile
