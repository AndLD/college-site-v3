import { CloseOutlined, EditOutlined, PlusCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Divider, Empty, Form, Input, Popconfirm, Popover, Spin, Tree } from 'antd'
import Title from 'antd/lib/typography/Title'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { generateKey } from 'fast-key-generator'
import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { MenuContext } from '../../contexts'
import { privateRoutes } from '../../utils/constants'
import { configMenu, deconfigMenu } from '../../utils/menu'
import { errorNotification, successNotification } from '../../utils/notifications'
import { IMenuBlockUpdate, IMenuElement, IMenuElementOfTree } from '../../utils/types'
import MenuDescription from './SelectedMenu/MenuDescription'
import MenuTree from './SelectedMenu/MenuTree'
import MenuTreeElement from './SelectedMenu/MenuTreeElement'
import SelectedMenuControls from './SelectedMenu/SelectedMenuControls'

function SelectedMenu() {
    const token = useSelector((state: any) => state.app.token)

    const [selectedMenu, setSelectedMenu] = useContext(MenuContext).selectedMenuState

    const [menuDescription, setMenuDescription] = useState<string>('')
    const [isMenuDescriptionUpdated, setIsMenuDescriptionUpdated] = useState<boolean>(false)

    const [treeData, setTreeData] = useState<IMenuElementOfTree[]>([])
    const [treeDataUpdates, setTreeDataUpdates] = useState<IMenuBlockUpdate[]>([])
    const [treeLoading, setTreeLoading] = useContext(MenuContext).treeLoadingState

    const [selectedMenuControlsEnabled, setSelectedMenuControlsEnabled] = useState<boolean>(false)

    useEffect(() => {
        if (selectedMenu) {
            const menu = configMenu(selectedMenu?.menu, [treeDataUpdates, setTreeDataUpdates])
            if (menu) {
                setTreeData(menu)
                setMenuDescription(selectedMenu.description)
            }
        }
    }, [selectedMenu])

    function saveSelectedMenuChanges() {
        const data: any = {}
        if (isMenuDescriptionUpdated) {
            data.description = menuDescription
        }
        if (treeDataUpdates.length) {
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
        setIsMenuDescriptionUpdated(false)

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
                            setIsMenuDescriptionUpdated={setIsMenuDescriptionUpdated}
                            setSelectedMenuControlsEnabled={setSelectedMenuControlsEnabled}
                        />
                        <p>{selectedMenu?.id}</p>
                        <MenuTree
                            treeDataState={[treeData, setTreeData]}
                            treeDataUpdatesState={[treeDataUpdates, setTreeDataUpdates]}
                            noUpdateCallback={() => setSelectedMenuControlsEnabled(false)}
                            updateCallback={() => setSelectedMenuControlsEnabled(true)}
                        />
                    </>
                )}
            </div>
            <Divider />
        </>
    )
}

export default SelectedMenu
