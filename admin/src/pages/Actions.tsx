import { DatePicker, Tooltip, Typography } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import ActionsTableControls from '../components/Actions/ActionsTableControls'
import { IAction } from '../utils/types'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification, warningNotification } from '../utils/notifications'
import Search from 'antd/lib/input/Search'
import moment from 'moment'
import { ActionsContext } from '../contexts'
import ActionsTable from '../components/Actions/ActionsTable'
import { actionsUtils } from '../utils/actions'
import DateRangePicker from '../components/Actions/DateRangePicker'
import ActionsSearch from '../components/Actions/ActionsSearch'

const { Title } = Typography

interface IWarnings {
    [key: string]: string[]
}

function Actions() {
    const token = useSelector((state: any) => state.app.token)
    const userStatus = useSelector((state: any) => state.app.user.status)

    useEffect(() => {
        document.title = 'Admin Actions'

        fetchActions(pagination, undefined, 'timestamp,desc')
    }, [])

    const [tableData, setTableData] = useState<IAction[]>([])
    const [selectedRows, setSelectedRows] = useState([])
    const [warnings, setWarnings] = useState<IWarnings>({})
    const [isTableLoading, setIsTableLoading] = useState<boolean>(false)
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20
    })
    const [isApproveBtnLoading, setIsApproveBtnLoading] = useState<boolean>(false)
    const [isDeclineBtnLoading, setIsDeclineBtnLoading] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState<string>('')
    const [dateRangeValue, setDateRangeValue] = useState<[number, number] | null>(null)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [sort, setSort] = useState<string | undefined>()

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

    useEffect(() => {
        fetchActions(
            pagination,
            actionsUtils.combineFilters({
                dateRangeValue,
                searchValue,
                statusFilterState: [statusFilter, setStatusFilter]
            }),
            sort || 'timestamp,desc'
        )
    }, [dateRangeValue])

    function fetchActions(pagination: any, filters?: string, order?: string) {
        setIsTableLoading(true)
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
                setIsTableLoading(false)
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
                fetchActions(
                    pagination,
                    actionsUtils.combineFilters({
                        dateRangeValue,
                        searchValue,
                        statusFilterState: [statusFilter, setStatusFilter]
                    }),
                    sort || 'timestamp,desc'
                )

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

    return (
        <AdminLayout currentPage="Actions">
            <Title level={1}>Actions</Title>
            <ActionsContext.Provider
                value={{
                    tableDataState: [tableData, setTableData],
                    isTableLoadingState: [isTableLoading, setIsTableLoading],
                    isApproveBtnLoadingState: [isApproveBtnLoading, setIsApproveBtnLoading],
                    isDeclineBtnLoadingState: [isDeclineBtnLoading, setIsDeclineBtnLoading],
                    warningsState: [warnings, setWarnings],
                    paginationState: [pagination, setPagination],
                    statusFilterState: [statusFilter, setStatusFilter],
                    selectedRowsState: [selectedRows, setSelectedRows],
                    searchValueState: [searchValue, setSearchValue],
                    sortState: [sort, setSort],
                    dateRangeValueState: [dateRangeValue, setDateRangeValue],
                    fetchActions,
                    updateActions
                }}
            >
                <div style={{ display: 'flex' }}>
                    <ActionsSearch />
                    <DateRangePicker />
                    {userStatus === 'admin' ? <ActionsTableControls /> : null}
                </div>
                <ActionsTable />
            </ActionsContext.Provider>
        </AdminLayout>
    )
}

export default Actions
