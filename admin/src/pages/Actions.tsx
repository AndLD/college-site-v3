import { Badge, Spin, Table, Typography } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import ActionsTableControls from '../components/Actions/ActionsTableControls'
import { ArticleData, IAction } from '../utils/types'
import Search from 'antd/lib/input/Search'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification } from '../utils/notifications'
import {
    DeleteOutlined,
    DeleteTwoTone,
    EditOutlined,
    EditTwoTone,
    FileAddOutlined,
    FileAddTwoTone
} from '@ant-design/icons'

const { Title } = Typography

interface IColumn {
    title: string
    dataIndex: string
    render?: (value: any) => any
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

        fetchActions(pagination)
    }, [])

    const [tableData, setTableData] = useState<IAction[]>([])
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
            .then(() => {
                fetchActions(pagination)

                successNotification(
                    `Actions (${selectedRows.length}) were successfully ${status}d!`
                )
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

    const expandedRowRender = ({ payload }: IAction) => {
        const columns: IColumn[] = []

        for (const key in payload) {
            const column: IColumn = {
                title: key[0].toUpperCase() + key.slice(1),
                dataIndex: key
            }

            if (key.includes('timestamp') || key.includes('Timestamp')) {
                column.render = (value: number) => value && new Date(value).toLocaleString()
            } else if (key === 'data') {
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

        columns.sort((a, b) => {
            if (a.title > b.title) return 1
            return -1
        })

        const data = [payload]

        return (
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                rowKey={(record: any) => record.timestamp}
                bordered
            />
        )
    }

    return (
        <AdminLayout currentPage="Actions">
            <Title level={1}>Articles</Title>
            <div /*style={{ display: 'flex' }}*/>
                {/* <div style={{ flex: 1 }}>
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
                                text ? `keywords,contains,${text.toLowerCase()}` : undefined
                            )
                        }}
                        enterButton
                    />
                </div> */}
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
                        title: 'Entity',
                        dataIndex: 'entity'
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
                        width: 200
                    },
                    {
                        title: 'Parent ID',
                        dataIndex: 'parentId'
                    },
                    {
                        title: 'Status',
                        dataIndex: 'status',
                        render: (value: string) => (
                            <>
                                <Badge status={defineStatus(value)} />
                                {value[0].toUpperCase() + value.slice(1)}
                            </>
                        )
                    },
                    {
                        title: 'User',
                        dataIndex: 'user',
                        width: 200
                    },
                    {
                        title: 'Timestamp',
                        dataIndex: 'timestamp',
                        width: 110,
                        align: 'center',
                        render: (value: number) => value && new Date(value).toLocaleString(),
                        sorter: (row1: any, row2: any) => row1.timestamp - row2.timestamp,
                        sortDirections: ['descend']
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
                    const sorterOrder =
                        sorter.order === 'ascend'
                            ? 'asc'
                            : sorter.order === 'descend'
                            ? 'desc'
                            : undefined
                    const order = sorterOrder && `${sorter.field},${sorterOrder}`

                    setSearchValue('')
                    fetchActions(pagination, undefined, order)
                }}
            />
        </AdminLayout>
    )
}

export default Actions
