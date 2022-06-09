import { Select, Typography } from 'antd'
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
import EditableTags from '../components/Users/EditableTags'
import '../styles/Users.scss'
import UsersSearch from '../components/Users/UsersSearch'
import { UsersContext } from '../contexts'
import UsersTable from '../components/Users/UsersTable'

const { Title } = Typography

function Users() {
    const token = useSelector((state: any) => state.app.token)
    const [tableData, setTableData] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20
    })
    const [isTableLoading, setIsTableLoading] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState<string>()
    const [statusFilter, setStatusFilter] = useState<any>()

    useEffect(() => {
        document.title = 'Admin Users'

        fetchUsers(pagination)
    }, [])

    function fetchUsers(pagination: any, filters?: string, order?: string) {
        setIsTableLoading(true)
        axios(privateRoutes.USER, {
            params: {
                page: pagination.current,
                results: pagination.pageSize,
                filters,
                order
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                if (!res.data.meta?.pagination) throw new Error('No pagination obtained')
                setTableData(res.data.result)
                setIsTableLoading(false)
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
            .then(() => {
                successNotification('User has been successfully updated!')
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    return (
        <AdminLayout currentPage="Users">
            <Title level={1}>Users</Title>
            <UsersContext.Provider
                value={{
                    tableDataState: [tableData, setTableData],
                    paginationState: [pagination, setPagination],
                    isTableLoadingState: [isTableLoading, setIsTableLoading],
                    searchValueState: [searchValue, setSearchValue],
                    statusFilterState: [statusFilter, setStatusFilter],
                    fetchUsers,
                    updateUser
                }}
            >
                <UsersSearch />
                <UsersTable />
            </UsersContext.Provider>
        </AdminLayout>
    )
}

export default Users
