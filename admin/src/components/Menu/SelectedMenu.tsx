import { Divider, Empty, Spin } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import _ from 'lodash'
import { useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { MenuContext } from '../../contexts'
import { privateRoutes } from '../../utils/constants'
import { configMenu, deconfigMenu } from '../../utils/menu'
import { errorNotification, successNotification } from '../../utils/notifications'
import { IMenuBlockUpdate, IMenuElementOfTree } from '../../utils/types'
import MenuDescription from './SelectedMenu/MenuDescription'
import MenuTree from './SelectedMenu/MenuTree'
import SelectedMenuControls from './SelectedMenu/SelectedMenuControls'

function SelectedMenu() {
    const token = useSelector((state: any) => state.app.token)

    const fetchMenu = useContext(MenuContext).fetchMenu
    const [tableData, setTableData] = useContext(MenuContext).tableDataState

    const [selectedMenu, setSelectedMenu] = useContext(MenuContext).selectedMenuState

    const [menuDescription, setMenuDescription] = useState<string>('')

    const [treeData, setTreeData] = useState<IMenuElementOfTree[]>([])
    const [treeDataUpdates, setTreeDataUpdates] = useState<IMenuBlockUpdate[]>([])
    const [treeLoading, setTreeLoading] = useContext(MenuContext).treeLoadingState

    const [selectedMenuControlsEnabled, setSelectedMenuControlsEnabled] = useState<boolean>(false)

    const [pagination, setPagination] = useContext(MenuContext).paginationState

    useEffect(() => {
        if (selectedMenu) {
            const menu = configMenu(selectedMenu.menu, [treeDataUpdates, setTreeDataUpdates])
            if (menu) {
                setTreeData(menu)
                setMenuDescription(selectedMenu.description)
            }
        }
    }, [selectedMenu])

    useEffect(() => {
        if (selectedMenu) {
            setSelectedMenuControlsEnabled(
                (menuDescription && menuDescription !== selectedMenu.description) ||
                    (treeData.length > 0 && !_.isEqual(deconfigMenu(treeData), selectedMenu.menu))
            )
        }
    }, [treeData, menuDescription])

    function saveSelectedMenuChanges() {
        const data: any = {}

        if (menuDescription && menuDescription !== selectedMenu.description) {
            data.description = menuDescription
        }
        if (treeData.length && !_.isEqual(deconfigMenu(treeData), selectedMenu.menu)) {
            data.menu = deconfigMenu(treeData)
        }

        axios(privateRoutes.MENU + '/' + selectedMenu?.id, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`
            },
            data
        })
            .then((res: AxiosResponse) => {
                for (const row of tableData) {
                    if (row.id === selectedMenu.id) {
                        fetchMenu(pagination)
                        break
                    }
                }
                setSelectedMenu(res.data.result)
                setMenuDescription(res.data.result.description)
                setTreeDataUpdates([])

                successNotification('Selected menu seccussfully updated!')
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function resetSelectedMenuChanges() {
        const menu = configMenu(selectedMenu?.menu, [treeDataUpdates, setTreeDataUpdates])
        if (!menu) {
            errorNotification('Error reseting selected menu changes!')
            return
        }

        setMenuDescription(selectedMenu?.description || '')

        setTreeData(menu)
        setTreeDataUpdates([])
    }

    return (
        <>
            <SelectedMenuControls
                selectedMenuControlsEnabled={selectedMenuControlsEnabled}
                saveSelectedMenuChanges={saveSelectedMenuChanges}
                resetSelectedMenuChanges={resetSelectedMenuChanges}
            />
            <div>
                {treeLoading ? (
                    <div style={{ textAlign: 'center' }}>
                        <Spin size="large" />
                    </div>
                ) : !treeData.length ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <>
                        <MenuDescription
                            menuDescriotionState={[menuDescription, setMenuDescription]}
                        />
                        <p>{selectedMenu?.id}</p>
                        <MenuTree
                            treeDataState={[treeData, setTreeData]}
                            treeDataUpdatesState={[treeDataUpdates, setTreeDataUpdates]}
                        />
                    </>
                )}
            </div>
            <Divider />
        </>
    )
}

export default SelectedMenu
