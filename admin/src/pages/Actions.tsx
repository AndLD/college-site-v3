import { Badge, Table, Tag, Tooltip, Typography } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import ActionsTableControls from '../components/Actions/ActionsTableControls'
import { ArticleData, IAction } from '../utils/types'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification, warningNotification } from '../utils/notifications'
import { DeleteTwoTone, EditTwoTone, FileAddTwoTone, WarningTwoTone } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import Search from 'antd/lib/input/Search'

const { Title } = Typography

interface IColumn {
    title: string
    dataIndex: string
    render?: (value: any) => any
    width?: number
}

interface IWarnings {
    [key: string]: string[]
}

function Actions() {
    const token = useSelector((state: any) => state.app.token)
    const userStatus = useSelector((state: any) => state.app.user.status)

    // const mockData: IAction[] = [
    //     {
    //         id: '1',
    //         // parentId: '1',
    //         entity: 'articles',
    //         action: 'add',
    //         payload: {
    //             id: '1',
    //             data: {
    //                 html: true
    //             }
    //         },
    //         status: 'pending',
    //         user: 'nil10035@gmail.com',
    //         timestamp: Date.now()
    //         // lastUpdateTimestamp: Date.now()
    //     }
    // ]

    useEffect(() => {
        document.title = 'Admin Actions'

        fetchActions(pagination, undefined, 'timestamp,desc')
    }, [])

    const [tableData, setTableData] = useState<IAction[]>([])
    const [warnings, setWarnings] = useState<IWarnings>({})
    useEffect(() => {
        if (!tableData?.length) {
            return
        }

        const warnings: any = {}

        const pendingActions = tableData.filter(
            (row) =>
                row.status === 'pending' && (row.action === 'update' || row.action === 'delete')
        )

        for (const current of pendingActions) {
            const conflictActions: string[] = []

            for (const otherAction of pendingActions) {
                if (current === otherAction) {
                    continue
                }

                for (const payloadId of current.payloadIds) {
                    if (otherAction.payloadIds.includes(payloadId)) {
                        conflictActions.push(
                            `${otherAction.action.toUpperCase()} ${otherAction.id}`
                        )
                    }
                }
            }

            if (conflictActions.length) {
                warnings[current.id] = conflictActions
            }
        }

        setWarnings(warnings)
    }, [tableData])

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20
    })
    const [tableLoading, setTableLoading] = useState<boolean>(false)

    const [searchValue, setSearchValue] = useState<string>()

    const [selectedRows, setSelectedRows] = useState([])

    const [isApproveBtnLoading, setIsApproveBtnLoading] = useState<boolean>(false)
    const [isDeclineBtnLoading, setIsDeclineBtnLoading] = useState<boolean>(false)

    function fetchActions(pagination: any, filters?: string, order?: string) {
        setTableLoading(true)
        axios(privateRoutes.ACTION, {
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
                setTableLoading(false)
                setPagination({
                    ...pagination,
                    total: res.data.meta.pagination.total
                })
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function updateActions(status: 'approve' | 'decline') {
        if (status === 'approve') {
            setIsApproveBtnLoading(true)
        } else if (status === 'decline') {
            setIsDeclineBtnLoading(true)
        }
        axios(`${privateRoutes.ACTION}/${status}`, {
            method: 'POST',
            params: {
                ids: selectedRows.map((elem: any) => elem.id).toString()
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                fetchActions(pagination, undefined, 'timestamp,desc')

                const updateActionIds: string[] = res.data.result

                if (updateActionIds.length === selectedRows.length) {
                    successNotification(
                        `Actions (${selectedRows.length}) were successfully ${status}d!`
                    )
                } else {
                    warningNotification(
                        `Actions (${updateActionIds.length} of ${selectedRows.length}) were successfully ${status}d! Probably you trying to ${status} actions whose status is defined already.`
                    )
                }

                setSelectedRows([])
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => {
                if (status === 'approve') {
                    setIsApproveBtnLoading(false)
                } else if (status === 'decline') {
                    setIsDeclineBtnLoading(false)
                }
            })
    }

    function defineStatus(value: string) {
        switch (value) {
            case 'pending':
                return 'processing'
            case 'approved':
                return 'success'
            case 'declined':
                return 'error'
            default:
                return 'warning'
        }
    }

    const expandedRowRender = ({ payload, payloadIds }: IAction) => {
        const columns: IColumn[] = []

        for (const key in payload) {
            const column: IColumn = {
                title: key[0].toUpperCase() + key.slice(1),
                dataIndex: key
            }

            if (key === 'tags') {
                column.render = (tags: string[]) =>
                    tags.map((tag: string, index) => <Tag key={'tag' + index}>{tag}</Tag>)
            }
            if (key.includes('timestamp') || key.includes('Timestamp')) {
                column.render = (value: number) => value && new Date(value).toLocaleString()
            } else if (key === 'data') {
                column.width = 70
                column.render = (data?: ArticleData) => {
                    if (data)
                        return (
                            <div>
                                <div>
                                    <Badge color={data.html ? 'green' : 'red'} /> html
                                </div>
                                <div>
                                    <Badge color={data.docx ? 'green' : 'red'} /> docx
                                </div>
                                <div>
                                    <Badge color={data.pdf ? 'green' : 'red'} /> pdf
                                </div>
                                <div>
                                    <Badge color={data.json ? 'green' : 'red'} /> json
                                </div>
                            </div>
                        )
                }
            }

            columns.push(column)
        }

        if (payloadIds.length) {
            const column: IColumn = {
                title: 'ID' + (payloadIds.length > 1 ? 's' : ''),
                dataIndex: 'payloadIds',
                render: (payloadIds: string[]) => {
                    return payloadIds.map((payloadId, index) => (
                        <Tag key={'payloadId' + index}>{payloadId}</Tag>
                    ))
                }
            }

            columns.push(column)
        }

        columns.sort((a, b) => {
            if (a.title > b.title) return 1
            return -1
        })

        const data = [{ ...payload, payloadIds }]

        return (
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                rowKey={(record: any) => Date.now()}
                bordered
            />
        )
    }

    return (
        <AdminLayout currentPage="Actions">
            <Title level={1}>Actions</Title>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: 1 }}>
                    <Search
                        style={{ marginBottom: 20 }}
                        placeholder="Search by title"
                        loading={tableLoading}
                        value={searchValue}
                        onChange={(event) => {
                            const text = event.target.value
                            setSearchValue(text)
                            fetchActions(
                                pagination,
                                text ? `keywords,contains,${text.toLowerCase()}` : undefined,
                                'timestamp,desc'
                            )
                        }}
                        enterButton
                    />
                </div>
                {userStatus === 'admin' ? (
                    <ActionsTableControls
                        selectedRows={selectedRows}
                        isApproveBtnLoading={isApproveBtnLoading}
                        isDeclineBtnLoading={isDeclineBtnLoading}
                        approveActions={() => updateActions('approve')}
                        declineActions={() => updateActions('decline')}
                    />
                ) : null}
            </div>
            <Table
                dataSource={tableData}
                expandable={{ expandedRowRender }}
                columns={[
                    {
                        align: 'center',
                        render: (_: undefined, row) => {
                            if (warnings[row.id]) {
                                return (
                                    <Tooltip
                                        overlayStyle={{ maxWidth: 300 }}
                                        placement="right"
                                        title={warnings[row.id].join('\n')}
                                    >
                                        <WarningTwoTone
                                            twoToneColor="#FFA500"
                                            style={{ fontSize: 25 }}
                                        />
                                    </Tooltip>
                                )
                            }
                            return null
                        }
                    },
                    {
                        title: 'Entity',
                        dataIndex: 'entity',
                        render: (value: string) => value.toUpperCase()
                    },
                    {
                        title: 'Action',
                        dataIndex: 'action',
                        align: 'center',
                        render: (value: string) => {
                            switch (value) {
                                case 'add':
                                    return <FileAddTwoTone style={{ fontSize: 25 }} />
                                case 'update':
                                    return <EditTwoTone style={{ fontSize: 25 }} />
                                case 'delete':
                                    return <DeleteTwoTone style={{ fontSize: 25 }} />
                            }
                        }
                    },
                    {
                        title: 'ID',
                        dataIndex: 'id',
                        width: 200,
                        render: (value: string, row: IAction) => (
                            <>
                                {row.payload.data && row.status === 'pending' ? (
                                    <Link
                                        to={`/admin/preview/${value}?action=${JSON.stringify(row)}`}
                                    >
                                        {value}
                                    </Link>
                                ) : (
                                    value
                                )}
                            </>
                        )
                    },
                    {
                        title: 'Status',
                        dataIndex: 'status',
                        render: (value: string) => (
                            <>
                                <Badge status={defineStatus(value)} />
                                {value[0].toUpperCase() + value.slice(1)}
                            </>
                        ),
                        filters: [
                            {
                                text: 'Approved',
                                value: 'approved'
                            },
                            {
                                text: 'Declined',
                                value: 'declined'
                            },
                            {
                                text: 'Pending',
                                value: 'pending'
                            }
                        ]
                    },
                    {
                        title: 'User',
                        dataIndex: 'user',
                        width: 200
                    },
                    {
                        title: 'Last update User',
                        dataIndex: 'lastUpdateUser',
                        width: 200
                    },
                    {
                        title: 'Timestamp',
                        dataIndex: 'timestamp',
                        width: 110,
                        align: 'center',
                        render: (value: number) => value && new Date(value).toLocaleString(),
                        sorter: (row1: any, row2: any) => row1.timestamp - row2.timestamp,
                        sortDirections: ['descend'],
                        defaultSortOrder: 'descend'
                    },
                    {
                        title: 'Last update timestamp',
                        dataIndex: 'lastUpdateTimestamp',
                        width: 110,
                        align: 'center',
                        render: (value: number) => value && new Date(value).toLocaleString(),
                        sorter: (row1: any, row2: any) =>
                            row1.lastUpdateTimestamp - row2.lastUpdateTimestamp,
                        sortDirections: ['ascend', 'descend']
                    }
                ]}
                rowSelection={
                    userStatus === 'admin'
                        ? {
                              type: 'checkbox',
                              selectedRowKeys: selectedRows.map((row: any) => row.id),
                              onChange: (_: any, selectedRows: any) => {
                                  setSelectedRows(selectedRows)
                              }
                          }
                        : undefined
                }
                size="small"
                rowKey={(record: any) => record.id}
                pagination={pagination}
                loading={tableLoading}
                onChange={(pagination: any, filters: any, sorter: any) => {
                    const f = filters?.status && `status,in,${filters.status.join('.')}`

                    const sorterOrder =
                        sorter.order === 'ascend'
                            ? 'asc'
                            : sorter.order === 'descend'
                            ? 'desc'
                            : undefined
                    const order = sorterOrder && `${sorter.field},${sorterOrder}`

                    setSearchValue('')
                    fetchActions(pagination, f, order)
                }}
            />
        </AdminLayout>
    )
}

export default Actions
