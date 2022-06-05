import {
    QuestionOutlined,
    SafetyCertificateOutlined,
    StopOutlined,
    UserOutlined
} from '@ant-design/icons'
import { Select, Table } from 'antd'
import { useContext } from 'react'
import { UsersContext } from '../../contexts'
import { UserStatus } from '../../utils/types'
import DescriptionCell from './DescriptionCell'
import EditableTags from './EditableTags'

function UsersTable() {
    const [tableData, setTableData] = useContext(UsersContext).tableDataState
    const [isTableLoading, setIsTableLoading] = useContext(UsersContext).isTableLoadingState
    const [pagination, setPagination] = useContext(UsersContext).paginationState
    const [serachValue, setSearchValue] = useContext(UsersContext).searchValueState
    const [statusFilter, setStatusFilter] = useContext(UsersContext).statusFilterState
    const fetchUsers = useContext(UsersContext).fetchUsers
    const updateUser = useContext(UsersContext).updateUser

    return (
        <Table
            dataSource={tableData}
            columns={[
                {
                    title: '#',
                    render: (_, row, index) =>
                        index + 1 + (pagination.current - 1) * pagination.pageSize,
                    width: 70
                },
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
                    },
                    filters: [
                        {
                            text: (
                                <>
                                    <SafetyCertificateOutlined style={{ color: 'green' }} /> Admin
                                </>
                            ),
                            value: 'admin'
                        },
                        {
                            text: (
                                <>
                                    <UserOutlined style={{ color: 'blue' }} /> Moderator
                                </>
                            ),
                            value: 'moderator'
                        },
                        {
                            text: (
                                <>
                                    <StopOutlined style={{ color: 'red' }} /> Banned
                                </>
                            ),
                            value: 'banned'
                        },
                        {
                            text: (
                                <>
                                    <QuestionOutlined /> Unconfirmed
                                </>
                            ),
                            value: 'unconfirmed'
                        }
                    ],
                    filteredValue: statusFilter ? statusFilter.status : null
                },
                {
                    title: 'Description',
                    dataIndex: 'description',
                    width: 300,
                    render: (description: string, row: any) => {
                        return (
                            <DescriptionCell
                                description={description}
                                onSave={(description: string) =>
                                    updateUser(row.id, { description })
                                }
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
                            <EditableTags
                                tags={tags}
                                onSave={(tags: string[]) => updateUser(row.id, { tags })}
                            />
                        )
                    }
                },
                {
                    title: 'Timestamp',
                    dataIndex: 'timestamp',
                    render: (value: number) => value && new Date(value).toLocaleString(),
                    sorter: (row1: any, row2: any) => row1.timestamp - row2.timestamp,
                    sortDirections: ['descend']
                },
                {
                    title: 'Last Update Timestamp',
                    dataIndex: 'lastUpdateTimestamp',
                    render: (value: number) => value && new Date(value).toLocaleString(),
                    sorter: (row1: any, row2: any) =>
                        row1.lastUpdateTimestamp - row2.lastUpdateTimestamp,
                    sortDirections: ['ascend', 'descend']
                }
            ]}
            rowKey={(record: any) => record.id}
            pagination={pagination}
            loading={isTableLoading}
            onChange={(pagination: any, filters: any, sorter: any) => {
                setStatusFilter(filters)
                const f = filters?.status && `status,in,${filters.status.join('.')}`

                const sorterOrder =
                    sorter.order === 'ascend'
                        ? 'asc'
                        : sorter.order === 'descend'
                        ? 'desc'
                        : undefined
                const order = sorterOrder && `${sorter.field},${sorterOrder}`

                setSearchValue('')
                fetchUsers(pagination, f, order)
            }}
        />
    )
}

export default UsersTable
