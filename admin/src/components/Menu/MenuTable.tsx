import { Badge, Button, Table } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MenuContext } from '../../contexts'
import { setTableSelectedRows } from '../../store/actions'
import { privateRoutes } from '../../utils/constants'
import { errorNotification, successNotification } from '../../utils/notifications'
import MenuTableControls from './MenuTable/MenuTableControls'

function MenuTable() {
    const dispatch = useDispatch()
    const token = useSelector((state: any) => state.app.token)

    const [tableData, setTableData] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5
    })
    const [tableLoading, setTableLoading] = useState(false)
    const [selectedMenu, setSelectedMenu] = useContext(MenuContext).selectedMenuState

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id'
        },
        {
            title: 'Description',
            dataIndex: 'description'
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
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (value: string, row: any, index: any) => (
                <div className="menu-table-status-cell">
                    <div className="menu-table-status-cell-hide-on-parent-hover">
                        <Badge status={value === 'Selected' ? 'success' : 'error'} /> {value}
                    </div>
                    <Button
                        className="menu-table-status-cell-show-on-parent-hover"
                        type="default"
                        danger={value === 'Selected' ? true : false}
                        size="small"
                        onClick={value === 'Selected' ? deselectMenu : () => selectMenu(row.id)}
                    >
                        {value === 'Selected' ? 'deselect' : 'select'}
                    </Button>
                </div>
            )
        }
    ]

    useEffect(() => {
        fetchMenu(pagination)
    }, [])

    const { fetchSelectedMenu } = useContext(MenuContext)

    function fetchMenu(pagination: any) {
        setTableLoading(true)
        axios(privateRoutes.MENU, {
            params: {
                page: pagination.current,
                results: pagination.pageSize,
                select: 'id,description,timestamp,lastUpdateTimestamp'
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                // if (!isMounted) return
                if (!res.data.meta?.pagination) throw new Error('No pagination obtained')
                console.log(res.data.result)
                setTableData(res.data.result)
                setTableLoading(false)
                setPagination({
                    ...pagination,
                    total: res.data.meta.pagination.total
                })
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function selectMenu(id: string) {
        axios(privateRoutes.APP_SETTINGS, {
            method: 'PUT',
            data: {
                selectedMenuId: id
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                if (res.data.result === true) {
                    fetchSelectedMenu()
                    fetchMenu(pagination)
                    successNotification('Menu block successfully selected!')
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function deselectMenu() {
        axios(privateRoutes.APP_SETTINGS, {
            method: 'PUT',
            data: {
                selectedMenuId: null
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                if (res.data.result === true) {
                    fetchSelectedMenu()
                    fetchMenu(pagination)
                    successNotification('Menu block successfully deselected!')
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function deleteMenu() {
        let isSelectedMenuUpdateNeeds = false
        axios(privateRoutes.MENU, {
            method: 'DELETE',
            params: {
                ids: selectedRows
                    .map((elem: any) => {
                        if (selectedMenu && elem.id === selectedMenu.id)
                            isSelectedMenuUpdateNeeds = true
                        return elem.id
                    })
                    .toString()
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(() => {
                if (isSelectedMenuUpdateNeeds) fetchSelectedMenu()
                // if (!isMounted) return

                // TODO: Подумать над костылем (отсроченное выполнение запроса на получение блоков меню): после удаления блоков меню, если сразу сделать получение блоков по пагинации, то они могут остаться на своих местах, хотя по факту они уже удалены
                // setTimeout(() => fetchMenu(pagination), 500)
                fetchMenu(pagination)

                setSelectedRows([])
                successNotification('Menu block was successfully deleted!')
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    useEffect(() => {
        dispatch(setTableSelectedRows(selectedRows))
    }, [selectedRows])

    return (
        <>
            <MenuTableControls
                deleteMenu={deleteMenu}
                selectedRows={selectedRows}
                actionSuccessCallback={() => fetchMenu(pagination)}
            />
            <Table
                rowSelection={{
                    type: 'checkbox',
                    onChange: (_: any, selectedRows: any) => {
                        setSelectedRows(selectedRows)
                    }
                }}
                columns={columns}
                rowKey={(record: any) => record.id}
                dataSource={
                    tableData &&
                    tableData.map((row: any) => ({
                        ...row,
                        status:
                            selectedMenu && row.id === selectedMenu.id ? 'Selected' : 'Not selected'
                    }))
                }
                pagination={pagination}
                loading={tableLoading}
                onChange={(pagination: any) => fetchMenu(pagination)}
            />
        </>
    )
}

export default MenuTable
