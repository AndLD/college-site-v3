import { Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import Text from 'antd/lib/typography/Text'
import UserDescription from '../components/Profile/UserDescription'
import '../styles/Profile.scss'
import EditableTags from '../components/Users/EditableTags'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification } from '../utils/notifications'
import { SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import Paragraph from 'antd/lib/typography/Paragraph'

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
            <div style={{ textAlign: 'center' }}>
                <Text style={{ fontSize: 30 }}>
                    {user?.status === 'admin' ? (
                        <>
                            <SafetyCertificateOutlined style={{ color: 'green', fontSize: 25 }} />{' '}
                            Admin
                        </>
                    ) : user?.status === 'moderator' ? (
                        <>
                            <UserOutlined style={{ color: 'blue' }} /> Moderator
                        </>
                    ) : (
                        ''
                    )}
                </Text>
                <Title level={3}>{user.name}</Title>

                <Paragraph code style={{ margin: '20px 0px', fontSize: 18 }}>
                    {user.email}
                </Paragraph>
                <div style={{ margin: '20px auto', width: '50%' }}>
                    <UserDescription
                        userDescriotionState={[userDescription, setUserDescription]}
                        onSave={(data) => updateAuthorizedUser(data)}
                    />
                </div>
                <div style={{ margin: 'auto', width: '20%' }}>
                    {user?.tags ? (
                        <EditableTags
                            tags={user?.tags}
                            onSave={(newTags: string[]) => updateAuthorizedUser({ tags: newTags })}
                        />
                    ) : (
                        ''
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}

export default Profile
