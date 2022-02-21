import { Select, Spin, Tag, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { IUser } from '../utils/types'
import { Table } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { Option } from 'antd/lib/mentions'

const { Title } = Typography

function Users() {
    const token = useSelector((state: any) => state.app.token)
    const [users, setUsers] = useState(null)
    const dataUsers = [
        {
            id: '111',
            name: 'Name1',
            email: 'debovamail@gmail.com',
            description: '',
            tags: ['test1', 'test2'],
            status: 'admin',
            timestamp: 1645440593336
        },
        {
            id: '112',
            name: 'Name2',
            email: 'bbea@com.ua',
            status: 'banned',
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
                        <Option value="admin">Admin</Option>
                        <Option value="moderator">Moderator</Option>
                        <Option value="banned">Banned</Option>
                        <Option value="unconfirmed">Unconfirmed</Option>
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

    return (
        <AdminLayout currentPage="Users">
            <Title level={1}>Users</Title>
            <Table dataSource={dataUsers} columns={columnsUsers}></Table>
        </AdminLayout>
    )
}

export default Users
