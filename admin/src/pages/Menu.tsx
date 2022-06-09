import { Typography, Tabs } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { errorNotification, warningNotification } from '../utils/notifications'
import { IMenuBlock } from '../utils/types'
import SelectedMenu from '../components/Menu/SelectedMenu'
import { MenuContext } from '../contexts'
import MenuTable from '../components/Menu/MenuTable'
import { privateRoutes, publicRoutes } from '../utils/constants'
import '../styles/Menu.scss'
import { useSelector } from 'react-redux'
import MenuActionModal from '../components/Menu/MenuActionModal'
import MenuTabs from '../components/Menu/MenuTabs'

const { Title } = Typography

const { TabPane } = Tabs

function Menu() {
    const token = useSelector((state: any) => state.app.token)
    const userStatus = useSelector((state: any) => state.app.user.status)
    const [isMounted, setIsMounted] = useState(true)
    const [treeLoading, setTreeLoading] = useState(false)
    const [selectedMenu, setSelectedMenu] = useState<IMenuBlock | undefined>()
    const [tableData, setTableData] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20
    })
    const [isTableLoading, setIsTableLoading] = useState(false)

    function fetchSelectedMenu() {
        setTreeLoading(true)
        axios(publicRoutes.MENU)
            .then((res: AxiosResponse) => {
                if (isMounted) {
                    const menu = res.data.result

                    if (!menu) {
                        warningNotification('No selected menu found!')
                    }
                    setSelectedMenu(menu)
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => setTreeLoading(false))
    }

    function fetchMenu(pagination: any, order?: string) {
        setIsTableLoading(true)
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
            {userStatus === 'admin' ? <MenuActionModal /> : null}
            <Title level={1}>Menu</Title>
            <MenuContext.Provider
                value={{
                    selectedMenuState: [selectedMenu, setSelectedMenu],
                    treeLoadingState: [treeLoading, setTreeLoading],
                    fetchSelectedMenu,
                    tableDataState: [tableData, setTableData],
                    paginationState: [pagination, setPagination],
                    isTableLoadingState: [isTableLoading, setIsTableLoading],
                    fetchMenu
                }}
            >
                <MenuTabs />
            </MenuContext.Provider>
        </AdminLayout>
    )
}

export default Menu
