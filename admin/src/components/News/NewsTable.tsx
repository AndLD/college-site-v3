import { PushpinFilled, PushpinOutlined } from '@ant-design/icons'
import { Badge, Button, Table, TablePaginationConfig, Tooltip } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { NewsContext } from '../../contexts'
import { privateRoutes } from '../../utils/constants'
import { errorNotification, successNotification } from '../../utils/notifications'
import { INews, NewsData } from '../../utils/types'
import Tags from '../Users/Tags'
import '../../styles/News.scss'

function NewsTable() {
    const token = useSelector((state: any) => state.app.token)
    const [tableData, setTableData] = useContext(NewsContext).tableDataState
    const [isTableLoading, setIsTableLoading] = useContext(NewsContext).isTableLoadingState
    const [pagination, setPagination] = useContext(NewsContext).paginationState
    const [selectedRows, setSelectedRows] = useContext(NewsContext).selectedRowsState
    const [searchValue, setSearchValue] = useContext(NewsContext).searchValueState
    const fetchNews = useContext(NewsContext).fetchNews

    const [pinnedIds, setPinnedIds] = useState<string[]>([])

    useEffect(() => {
        fetchNewsPinnedIds()
    }, [])

    function toggleNewsPin(id: string) {
        axios(privateRoutes.APP_SETTINGS, {
            method: 'PUT',
            data: {
                pinnedNewsIds: id
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                if (res.data.result === true) {
                    fetchNewsPinnedIds()
                    successNotification('Pinned news list successfully updated!')
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function fetchNewsPinnedIds() {
        axios(privateRoutes.APP_SETTINGS, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                const pinnedNewsIds = res.data.result.pinnedNewsIds
                setPinnedIds(pinnedNewsIds)
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    return (
        <Table
            dataSource={tableData}
            columns={[
                {
                    title: 'Title',
                    dataIndex: 'title',
                    width: 450,
                    fixed: 'left'
                },
                {
                    title: 'Tags',
                    dataIndex: 'tags',
                    width: 200,
                    render: (tags: string[]) => {
                        tags = tags || []
                        return <Tags tags={tags} />
                    },
                    fixed: 'left'
                },
                {
                    title: 'Pinned',
                    align: 'center',
                    render: (_, row: INews) => {
                        const isPinned = pinnedIds.includes(row.id)

                        if (isPinned) {
                        }

                        return (
                            <div
                                className="news-table-pinned-cell"
                                onClick={() => toggleNewsPin(row.id)}
                            >
                                {isPinned ? (
                                    <>
                                        <div className="news-table-pinned-cell-hide-on-parent-hover">
                                            <PushpinFilled style={{ fontSize: 30 }} />
                                        </div>
                                        <div className="news-table-pinned-cell-show-on-parent-hover">
                                            <PushpinOutlined style={{ fontSize: 30 }} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="news-table-pinned-cell-show-on-parent-hover">
                                        <PushpinOutlined style={{ fontSize: 30 }} />
                                    </div>
                                )}
                            </div>
                        )
                    },
                    width: 90,
                    fixed: 'left'
                },
                {
                    title: 'Description',
                    dataIndex: 'description',
                    width: 300
                },
                {
                    title: 'ID',
                    dataIndex: 'id',
                    width: 200
                },
                {
                    title: 'Old ID',
                    dataIndex: 'oldId',
                    width: 90
                },
                {
                    title: <Tooltip title="Inline Main Image">IMI</Tooltip>,
                    dataIndex: 'inlineMainImage',
                    align: 'center',
                    render: (value: boolean) => (
                        <Tooltip title={value ? 'True' : 'False'}>
                            <Badge
                                style={{ marginLeft: 10 }}
                                status={value ? 'success' : 'error'}
                            />
                        </Tooltip>
                    ),
                    width: 50
                },
                {
                    title: 'Public timestamp',
                    dataIndex: 'publicTimestamp',
                    width: 110,
                    align: 'center',
                    render: (value: number) => value && new Date(value).toLocaleString(),
                    sorter: (row1: any, row2: any) => row1.publicTimestamp - row2.publicTimestamp,
                    sortDirections: ['ascend', 'descend']
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
                },
                {
                    title: 'Data',
                    dataIndex: 'data',
                    width: 90,
                    render: (data?: NewsData) => {
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
                                        <Badge color={data.png ? 'green' : 'red'} /> png
                                    </div>
                                </div>
                            )
                    },
                    fixed: 'right'
                }
            ]}
            rowSelection={{
                type: 'checkbox',
                selectedRowKeys: selectedRows.map((row: any) => row.id),
                onChange: (_: any, selectedRows: any) => {
                    setSelectedRows(selectedRows)
                }
            }}
            size="small"
            rowKey={(record: any) => record.id}
            pagination={pagination}
            loading={isTableLoading}
            scroll={{ x: 1500 }}
            onChange={(pagination: TablePaginationConfig, filters: any, sorter: any) => {
                const f = filters?.status && `status,in,${filters.status.join('.')}`

                const sortOrder =
                    sorter.order === 'ascend'
                        ? 'asc'
                        : sorter.order === 'descend'
                        ? 'desc'
                        : undefined
                const order = sortOrder && `${sorter.field},${sortOrder}`

                setSearchValue('')
                fetchNews(pagination, f, order)
            }}
        />
    )
}

export default NewsTable
