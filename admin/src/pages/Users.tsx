import { Select, Spin, Tag, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { IUser } from '../utils/types'
import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { Option } from 'antd/lib/mentions'
import { errorNotification, successNotification } from '../utils/notifications'
import { privateRoutes } from '../utils/constants'
import axios, { AxiosError, AxiosResponse } from 'axios'

const { Title } = Typography

function Users() {
    const token = useSelector((state: any) => state.app.token)
    const [users, setUsers] = useState(null)
    const [tableData, setTableData] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5
    })
    const [tableLoading, setTableLoading] = useState(false)

    // const [selectedMenu, setSelectedMenu] = useContext(MenuContext).selectedMenuState
    const dataUsers = [
        {
            id: '111',
            name: 'Name1',
            email: 'debovamail@gmail.com',
            status: 'admin',
            description: '',
            tags: ['test1', 'test2'],
            timestamp: 1645440593336
        },
        {
            id: '112',
            name: 'Name2',
            email: 'bbea@com.ua',
            status: 'banned',
            description: '',
            tags: ['test1', 'test2'],
            timestamp: 1645440593336
        }
    ]

    const columnsUsers = [
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
            render: (status: string) => {
                return (
                    <Select defaultValue={status} style={{ width: 120 }}>
                        <Select.Option value="admin">Admin</Select.Option>
                        <Select.Option value="moderator">Moderator</Select.Option>
                        <Select.Option value="banned">Banned</Select.Option>
                        <Select.Option value="unconfirmed">Unconfirmed</Select.Option>
                    </Select>
                )
            }
        },
        {
            title: 'Description',
            dataIndex: 'description'
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            render: (tags: string[]) => {
                return tags && tags.map((tag: string) => <Tag>{tag}</Tag>)
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
        let isMounted = true
        document.title = 'Admin Users'

        return () => {
            isMounted = false
        }
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
    return (
        <AdminLayout currentPage="Users">
            <Title level={1}>Users</Title>
            <Table
                dataSource={tableData}
                columns={columnsUsers}
                rowKey={(record: any) => record.id}
                pagination={pagination}
                loading={tableLoading}
                onChange={(pagination: any) => fetchUsers(pagination)}
            />
        </AdminLayout>
    )
}

export default Users
