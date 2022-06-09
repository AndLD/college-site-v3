import { Badge, Table, TablePaginationConfig } from 'antd'
import { useContext } from 'react'
import { useSelector } from 'react-redux'
import { ArticlesContext } from '../../contexts'
import { ArticleData } from '../../utils/types'
import Tags from '../Users/Tags'

function ArticlesTable() {
    const publicUrl = useSelector((state: any) => state.app.env.publicUrl)
    const [tableData, setTableData] = useContext(ArticlesContext).tableDataState
    const [isTableLoading, setIsTableLoading] = useContext(ArticlesContext).isTableLoadingState
    const [pagination, setPagination] = useContext(ArticlesContext).paginationState
    const [selectedRows, setSelectedRows] = useContext(ArticlesContext).selectedRowsState
    const [searchValue, setSearchValue] = useContext(ArticlesContext).searchValueState
    const fetchArticles = useContext(ArticlesContext).fetchArticles

    return (
        <Table
            dataSource={tableData}
            columns={[
                // TODO: Refactor (dublication)
                {
                    title: '#',
                    render: (_, row, index) =>
                        index + 1 + (pagination.current - 1) * pagination.pageSize,
                    width: 70,
                    fixed: 'left'
                },
                {
                    title: 'Title',
                    dataIndex: 'title',
                    render: (title, row) => (
                        <a href={`${publicUrl}/article/${row.id}`} target="_blank">
                            {title}
                        </a>
                    ),
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
                    title: 'Description',
                    dataIndex: 'description',
                    width: 300
                },
                {
                    title: 'ID',
                    dataIndex: 'id',
                    width: 220
                },
                {
                    title: 'Old ID',
                    dataIndex: 'oldId',
                    width: 90
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
                    render: (data?: ArticleData) => {
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
                                    {/* TODO: Remove everything binded with 'json' filetype in articles and news */}
                                    {/* <div>
                                        <Badge color={data.json ? 'green' : 'red'} /> json
                                    </div> */}
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
                fetchArticles(pagination, f, order)
            }}
        />
    )
}

export default ArticlesTable
