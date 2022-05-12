import { DeleteTwoTone, EditTwoTone, FileAddTwoTone, WarningTwoTone } from '@ant-design/icons'
import { Badge, Table, Tooltip } from 'antd'
import { useContext } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { ActionsContext } from '../../contexts'
import { actionsUtils } from '../../utils/actions'
import { IAction } from '../../utils/types'

function ActionsTable() {
    const userStatus = useSelector((state: any) => state.app.user.status)

    const [tableData, setTableData] = useContext(ActionsContext).tableDataState
    const [isTableLoading, setIsTableLoading] = useContext(ActionsContext).isTableLoadingState
    const [warnings, setWarnings] = useContext(ActionsContext).warningsState
    const [pagination, setPagination] = useContext(ActionsContext).paginationState
    const [selectedRows, setSelectedRows] = useContext(ActionsContext).selectedRowsState
    const [statusFilter, setStatusFilter] = useContext(ActionsContext).statusFilterState
    const [sort, setSort] = useContext(ActionsContext).sortState
    const [dateRangeValue, setDateRangeValue] = useContext(ActionsContext).dateRangeValueState
    const [searchValue, setSearchValue] = useContext(ActionsContext).searchValueState
    const fetchActions = useContext(ActionsContext).fetchActions

    function onPreviewLinkClick(previewAction: IAction) {
        localStorage.setItem('previewAction', JSON.stringify(previewAction))
    }

    return (
        <Table
            dataSource={tableData}
            expandable={{ expandedRowRender: actionsUtils.getActionPayloadTable }}
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
                    render: (value: string, row: IAction) => {
                        return (
                            <>
                                {row.payload.data && row.status === 'pending' ? (
                                    <Link
                                        onClick={() => onPreviewLinkClick(row)}
                                        to={`/admin/preview/${value}`}
                                    >
                                        {value}
                                    </Link>
                                ) : (
                                    value
                                )}
                            </>
                        )
                    }
                },
                {
                    title: 'Status',
                    dataIndex: 'status',
                    render: (value: string) => (
                        <>
                            <Badge status={actionsUtils.defineStatus(value)} />
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
            loading={isTableLoading}
            onChange={(pagination: any, { status }: { status?: string[] }, sorter: any) => {
                const filtersString: string | undefined = actionsUtils.combineFilters({
                    newStatus: status || null,
                    dateRangeValue,
                    searchValue,
                    statusFilterState: [statusFilter, setStatusFilter]
                })

                const sorterOrder =
                    sorter.order === 'ascend'
                        ? 'asc'
                        : sorter.order === 'descend'
                        ? 'desc'
                        : undefined
                const tableSort = sorterOrder && `${sorter.field},${sorterOrder}`

                setSort(tableSort || sort)

                fetchActions(pagination, filtersString, tableSort || sort)
            }}
        />
    )
}

export default ActionsTable
