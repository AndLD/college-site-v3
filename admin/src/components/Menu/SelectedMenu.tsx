import { CloseOutlined, EditOutlined, PlusCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Divider, Empty, Form, Input, Popconfirm, Popover, Spin, Tree } from 'antd'
import Title from 'antd/lib/typography/Title'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { generateKey } from 'fast-key-generator'
import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { MenuContext } from '../../contexts'
import { privateRoutes } from '../../utils/constants'
import { errorNotification, successNotification } from '../../utils/notifications'
import { IMenuBlockUpdate, IMenuElement, IMenuElementOfTree } from '../../utils/types'
import MenuTree from './SelectedMenu/MenuTree'
import MenuTreeElement from './SelectedMenu/MenuTreeElement'
import SelectedMenuControls from './SelectedMenu/SelectedMenuControls'

function SelectedMenu() {
    const token = useSelector((state: any) => state.app.token)

    const [selectedMenu, setSelectedMenu] = useContext(MenuContext).selectedMenuState

    const [menuDescriptionEditMode, setMenuDescriptionEditMode] = useState<boolean>(false)
    const [newMenuDescription, setNewMenuDescription] = useState<string>('')
    const [menuDescription, setMenuDescription] = useState<string>('')
    const [isMenuDescriptionUpdated, setIsMenuDescriptionUpdated] = useState<boolean>(false)

    const [treeData, setTreeData] = useState<IMenuElementOfTree[]>([])
    const [treeDataUpdates, setTreeDataUpdates] = useState<IMenuBlockUpdate[]>([])
    const [treeLoading, setTreeLoading] = useContext(MenuContext).treeLoadingState

    const [selectedMenuControlsEnabled, setSelectedMenuControlsEnabled] = useState<boolean>(false)

    useEffect(() => {
        if (selectedMenu) {
            const menu = configMenu()
            if (menu) {
                setTreeData(menu)
                setMenuDescription(selectedMenu.description)
            }
        }
    }, [selectedMenu])

    useEffect(() => {
        setNewMenuDescription(menuDescription)
    }, [menuDescription])

    function configMenu() {
        const menu = JSON.parse(JSON.stringify(selectedMenu?.menu))

        if (!menu) return

        for (const elem of menu as IMenuElementOfTree[]) {
            configElem(elem)
        }

        return menu as IMenuElementOfTree[]

        function configElem(elem: IMenuElementOfTree) {
            elem.key = generateKey({})
            elem.title = (
                <MenuTreeElement
                    elem={{
                        title: elem.title,
                        hidden: elem.hidden || false,
                        link: elem.link,
                        key: elem.key
                    }}
                    treeDataUpdatesState={[treeDataUpdates, setTreeDataUpdates]}
                />
            )
            for (const child of elem.children as IMenuElementOfTree[]) {
                configElem(child)
            }
        }
    }

    function deconfigMenu() {
        const menu = treeData

        if (!menu) return

        const deconfiguredMenu = []

        for (const elem of menu as IMenuElement[]) {
            deconfiguredMenu.push(deconfigElem(elem))
        }

        return deconfiguredMenu

        function deconfigElem(elem: IMenuElement) {
            const title = (elem.title as any).props.elem.title
            const deconfiguredElem = {
                title,
                link: elem.link,
                hidden: elem.hidden,
                children: []
            } as IMenuElement

            for (const child of elem.children as IMenuElement[]) {
                deconfiguredElem.children.push(deconfigElem(child))
            }

            return deconfiguredElem
        }
    }

    function saveSelectedMenuChanges() {
        const data: any = {}
        if (isMenuDescriptionUpdated) {
            data.description = menuDescription
        }
        if (treeDataUpdates.length) {
            data.menu = deconfigMenu()
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
        const menu = configMenu()
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
                <Title
                    level={4}
                    className="menu-description"
                    onClick={() => {
                        if (!menuDescriptionEditMode) setMenuDescriptionEditMode(true)
                    }}
                >
                    {menuDescriptionEditMode ? (
                        <>
                            <Input
                                size="large"
                                placeholder="New description"
                                value={newMenuDescription}
                                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                    setNewMenuDescription(event.target.value)
                                }
                                style={{
                                    maxWidth: '400px',
                                    marginRight: '10px'
                                }}
                            />
                            <SaveOutlined
                                style={{
                                    fontSize: '20px',
                                    margin: '0 5px'
                                }}
                                onClick={() => {
                                    setMenuDescriptionEditMode(false)
                                    setMenuDescription(newMenuDescription)
                                    setIsMenuDescriptionUpdated(true)
                                    setSelectedMenuControlsEnabled(true)
                                }}
                            />
                            <CloseOutlined
                                style={{
                                    fontSize: '20px',
                                    margin: '0 5px'
                                }}
                                onClick={() => {
                                    setMenuDescriptionEditMode(false)
                                    setNewMenuDescription(menuDescription)
                                }}
                            />
                        </>
                    ) : (
                        <>
                            {menuDescription ? (
                                menuDescription
                            ) : (
                                <span style={{ color: '#d4d4d4' }}>No description</span>
                            )}
                            <EditOutlined
                                className="menu-description-action"
                                style={{
                                    fontSize: '20px',
                                    margin: '0 5px',
                                    transform: 'translateY(20%)'
                                }}
                            />
                        </>
                    )}
                </Title>
                <p>{selectedMenu?.id}</p>
                {treeLoading ? (
                    <div style={{ textAlign: 'center' }}>
                        <Spin size="large" />
                    </div>
                ) : !treeData.length ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <MenuTree
                        treeDataState={[treeData, setTreeData]}
                        treeDataUpdatesState={[treeDataUpdates, setTreeDataUpdates]}
                        noUpdateCallback={() => setSelectedMenuControlsEnabled(false)}
                        updateCallback={() => setSelectedMenuControlsEnabled(true)}
                    />
                )}
            </div>
            <Divider />
        </>
    )
}

export default SelectedMenu
