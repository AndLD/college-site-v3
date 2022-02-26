import { Typography, Tabs } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { ChangeEvent, useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { errorNotification, warningNotification } from '../utils/notifications'
import { IMenuBlock } from '../utils/types'
import SelectedMenu from '../components/Menu/SelectedMenu'
import { MenuContext } from '../contexts'
import MenuTable from '../components/Menu/MenuTable'
import { privateRoutes, publicRoutes } from '../utils/constants'
import '../styles/Menu.scss'
import { useSelector } from 'react-redux'

const { Title } = Typography

const { TabPane } = Tabs

function Menu() {
    const token = useSelector((state: any) => state.app.token)
    const [isMounted, setIsMounted] = useState(true)

    const [treeLoading, setTreeLoading] = useState(false)

    const [selectedMenu, setSelectedMenu] = useState<IMenuBlock | undefined>()

    function fetchSelectedMenu() {
        setTreeLoading(true)
        axios(publicRoutes.MENU)
            .then((res: AxiosResponse) => {
                if (isMounted) {
                    const menu = res.data.result
                    setTreeLoading(false)

                    if (!menu) {
                        warningNotification('No selected menu found!')
                    }
                    setSelectedMenu(menu)
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    const [tableData, setTableData] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5
    })
    const [tableLoading, setTableLoading] = useState(false)

    function fetchMenu(pagination: any, order?: string) {
        setTableLoading(true)
        axios(privateRoutes.MENU, {
            params: {
                page: pagination.current,
                results: pagination.pageSize,
                select: 'id,description,timestamp,lastUpdateTimestamp',
                order
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                // if (!isMounted) return
                if (!res.data.meta?.pagination) throw new Error('No pagination obtained')
                setTableData(res.data.result)
                setTableLoading(false)
                setPagination({
                    ...pagination,
                    total: res.data.meta.pagination.total
                })
                console.log('total menu blocks', res.data.meta.pagination.total)
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    useEffect(() => {
        setIsMounted(true)
        document.title = 'Admin Menu'

        fetchSelectedMenu()
        fetchMenu(pagination)

        return () => {
            setIsMounted(false)
        }
    }, [])

    return (
        <AdminLayout currentPage="Menu">
            <Title level={1}>Menu</Title>
            <MenuContext.Provider
                value={{
                    selectedMenuState: [selectedMenu, setSelectedMenu],
                    treeLoadingState: [treeLoading, setTreeLoading],
                    fetchSelectedMenu,
                    tableDataState: [tableData, setTableData],
                    paginationState: [pagination, setPagination],
                    tableLoadingState: [tableLoading, setTableLoading],
                    fetchMenu
                }}
            >
                <Tabs
                    onChange={(activeKey: string) =>
                        localStorage.setItem('defaultActiveKey', activeKey)
                    }
                    defaultActiveKey={localStorage.getItem('defaultActiveKey') || undefined}
                >
                    <TabPane tab="Selected menu" key={1}>
                        <SelectedMenu />
                    </TabPane>
                    <TabPane tab="Menu table" key={2}>
                        <MenuTable />
                    </TabPane>
                </Tabs>
            </MenuContext.Provider>
        </AdminLayout>
    )
}

export default Menu
