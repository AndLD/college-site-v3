import { Input, Select, Spin, Tag, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { Table } from 'antd'
import { errorNotification, successNotification } from '../utils/notifications'
import { privateRoutes } from '../utils/constants'
import axios, { AxiosError, AxiosResponse } from 'axios'
import DescriptionCell from '../components/Users/DescriptionCell'
import { generateKey } from 'fast-key-generator'
import { UserStatus } from '../utils/types'
import {
    QuestionOutlined,
    SafetyCertificateOutlined,
    StopOutlined,
    UserOutlined
} from '@ant-design/icons'

const { Title } = Typography

function Users() {
    const token = useSelector((state: any) => state.app.token)

    const [tableData, setTableData] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5
    })
    const [tableLoading, setTableLoading] = useState(false)

    const [focusedRow, setFocusedRow] = useState<any>()

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
            render: (status: UserStatus) => {
                return (
                    <Select
                        defaultValue={status}
                        style={{ width: '100%' }}
                        onChange={(status: UserStatus) => {
                            if (focusedRow) {
                                updateUser(focusedRow.id, { status })
                            }
                        }}
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
            render: (description: string) => {
                return (
                    <DescriptionCell
                        description={description}
                        onSave={(description: string) => {
                            if (focusedRow) {
                                updateUser(focusedRow.id, { description })
                            }
                        }}
                    />
                )
            }
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            render: (tags: string[]) => {
                return tags && tags.map((tag: string) => <Tag key={generateKey({})}>{tag}</Tag>)
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
                onRow={(row: any) => ({
                    onClick: () => {
                        setFocusedRow(row)
                    }
                })}
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
