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

const { Title } = Typography

function Users() {
    const token = useSelector((state: any) => state.app.token)

    const [tableData, setTableData] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5
    })
    const [tableLoading, setTableLoading] = useState(false)

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
                    <Select defaultValue={status} style={{ width: 120 }} onChange={() => {}}>
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
            dataIndex: 'description',
            render: (description: string) => {
                return <DescriptionCell description={description} />
            },
            onClick: () => {
                console.log(1)
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
