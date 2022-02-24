import { Image, Input, Select, Spin, Tag, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { Table } from 'antd'
import { errorNotification, successNotification, warningNotification } from '../utils/notifications'
import { privateRoutes } from '../utils/constants'
import axios, { AxiosError, AxiosResponse } from 'axios'
import DescriptionCell from '../components/Users/DescriptionCell'
import { UserStatus } from '../utils/types'
import {
    QuestionOutlined,
    SafetyCertificateOutlined,
    StopOutlined,
    UserOutlined
} from '@ant-design/icons'
import TagsCell from '../components/Users/TagsCell'
import '../styles/Users.scss'

const { Title } = Typography

function Users() {
    const token = useSelector((state: any) => state.app.token)

    const [tableData, setTableData] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5
    })
    const [tableLoading, setTableLoading] = useState(false)

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id'
        },
        {
            title: 'Name',
            dataIndex: 'name'
        },
        {
            title: 'Email',
            dataIndex: 'email'
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (status: UserStatus, row: any) => {
                return (
                    <Select
                        defaultValue={status}
                        style={{ width: '100%' }}
                        onChange={(status: UserStatus) => updateUser(row.id, { status })}
                    >
                        <Select.Option value="admin">
                            <SafetyCertificateOutlined style={{ color: 'green' }} /> Admin
                        </Select.Option>
                        <Select.Option value="moderator">
                            <UserOutlined style={{ color: 'blue' }} /> Moderator
                        </Select.Option>
                        <Select.Option value="banned">
                            <StopOutlined style={{ color: 'red' }} /> Banned
                        </Select.Option>
                        <Select.Option value="unconfirmed">
                            <QuestionOutlined /> Unconfirmed
                        </Select.Option>
                    </Select>
                )
            }
        },
        {
            title: 'Description',
            dataIndex: 'description',
            render: (description: string, row: any) => {
                return (
                    <DescriptionCell
                        description={description}
                        onSave={(description: string) => updateUser(row.id, { description })}
                    />
                )
            }
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            width: 200,
            render: (tags: string[], row: any) => {
                tags = tags || []
                return (
                    <TagsCell
                        tags={tags}
                        onSave={(tags: string[]) => updateUser(row.id, { tags })}
                    />
                )
            }
        },
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            render: (value: number) => value && new Date(value).toLocaleString()
        },
        {
            title: 'Last Update Timestamp',
            dataIndex: 'lastUpdateTimestamp',
            render: (value: number) => value && new Date(value).toLocaleString()
        }
    ]

    useEffect(() => {
        // let isMounted = true
        document.title = 'Admin Users'

        // return () => {
        //     isMounted = false
        // }
    }, [])

    useEffect(() => {
        fetchUsers(pagination)
    }, [])

    function fetchUsers(pagination: any) {
        setTableLoading(true)
        axios(privateRoutes.USER, {
            params: {
                page: pagination.current,
                results: pagination.pageSize
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                // if (!isMounted) return
                if (!res.data.meta?.pagination) throw new Error('No pagination obtained')
                setTableData(res.data.result)
                setTableLoading(false)
                setPagination({
                    ...pagination,
                    total: res.data.meta.pagination.total
                })
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function updateUser(
        id: string,
        data: { status?: UserStatus; description?: string; tags?: string[] }
    ) {
        axios(`${privateRoutes.USER}/${id}`, {
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
        <AdminLayout currentPage="Users">
            <Title level={1}>Users</Title>
            <Table
                dataSource={tableData}
                columns={columns}
                rowKey={(record: any) => record.id}
                pagination={pagination}
                loading={tableLoading}
                onChange={(pagination: any) => fetchUsers(pagination)}
            />
        </AdminLayout>
    )
}

export default Users
