import { Typography, Tabs } from 'antd'
import axios, { AxiosError } from 'axios'
import { ChangeEvent, useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { errorNotification, warningNotification } from '../utils/notifications'
import { IMenuBlock } from '../utils/types'
import SelectedMenu from '../components/Menu/SelectedMenu'
import { MenuContext } from '../contexts'
import MenuTable from '../components/Menu/MenuTable'
import { publicRoutes } from '../utils/constants'
import '../styles/Menu.scss'

const { Title } = Typography

const { TabPane } = Tabs

function Menu() {
    const [isMounted, setIsMounted] = useState(true)

    const [treeLoading, setTreeLoading] = useState(false)

    const [selectedMenu, setSelectedMenu] = useState<IMenuBlock | undefined>()

    function fetchSelectedMenu() {
        setTreeLoading(true)
        axios(publicRoutes.MENU)
            .then((res) => {
                if (isMounted) {
                    const menu = res.data.result
                    setTreeLoading(false)

                    if (!menu) {
                        warningNotification('No selected menu found!')
                        // setSelectedMenu(undefined)
                        // setTreeData([])
                    }
                    setSelectedMenu(menu)
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    useEffect(() => {
        setIsMounted(true)
        document.title = 'Admin Menu'

        fetchSelectedMenu()

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
                    fetchSelectedMenu
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
