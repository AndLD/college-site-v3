import { CloseOutlined, EditOutlined, PlusCircleOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Divider, Empty, Form, Input, Popconfirm, Popover, Spin, Tree } from 'antd'
import Title from 'antd/lib/typography/Title'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { generateKey } from 'fast-key-generator'
import { ChangeEvent, useContext, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { MenuContext } from '../../context/menu-context'
import { privateRoutes } from '../../utils/constants'
import { errorNotification, successNotification } from '../../utils/notifications'
import { IMenuBlockUpdate, IMenuElement, IMenuElementOfTree } from '../../utils/types'
import MenuTreeElement from './MenuTreeElement'
import { TreeDataPopoverContent } from './TreeDataPopoverContent'

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

    const [addRootElemToTreeDataMenuForm] = Form.useForm()
    const [addRootElemToTreeDataMenuPopoverVisible, setAddRootElemToTreeDataMenuPopoverVisible] =
        useState<boolean>(false)

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

    useEffect(() => {
        const newUpdate = treeDataUpdates[treeDataUpdates.length - 1]

        if (!newUpdate) {
            setSelectedMenuControlsEnabled(false)
            return
        }

        if (newUpdate.type == 'Update' && newUpdate.body) {
            updateTreeDataMenu(newUpdate.key, newUpdate.body)
        } else if (newUpdate.type == 'Add' && newUpdate.body) {
            addChildToTreeDataMenu(newUpdate.key, newUpdate.body)
        } else if (newUpdate.type == 'Delete' && newUpdate.key) {
            deleteFromTreeDataMenu(newUpdate.key)
        }

        setSelectedMenuControlsEnabled(true)
    }, [treeDataUpdates])

    function addChildToTreeDataMenu(key: string | undefined, body: any) {
        // TODO: Understand why 'const menu = treeData' does not work? Only this works:
        const menu = [...treeData]

        const childContent = {
            title: body['title'],
            hidden: body['hidden'] || false,
            link: body['link'],
            key: generateKey({})
        }

        const newTreeDataElem = {
            ...childContent,
            title: (
                <MenuTreeElement
                    elem={childContent}
                    treeDataUpdatesState={[treeDataUpdates, setTreeDataUpdates]}
                />
            ),
            children: []
        }

        if (key)
            for (const elem of menu) {
                addChildToTreeDataElem(elem)
            }
        else {
            menu.push(newTreeDataElem)
        }

        setTreeData(menu)

        function addChildToTreeDataElem(elem: IMenuElementOfTree) {
            if (elem.key == key) {
                elem.children.push(newTreeDataElem)
            } else
                for (const child of elem.children) {
                    addChildToTreeDataElem(child)
                }
        }
    }

    function deleteFromTreeDataMenu(key: string) {
        let menu = [...treeData]

        menu = menu.filter(deleteTreeDataElem)

        setTreeData(menu)

        function deleteTreeDataElem(elem: IMenuElementOfTree) {
            if (elem.key == key) {
                return false
            } else {
                elem.children = elem.children.filter(deleteTreeDataElem)
                return true
            }
        }
    }

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

    function onDrop(info: any) {
        const dropKey = info.node.key
        const dragKey = info.dragNode.key
        const dropPos = info.node.pos
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1])

        const dragElem: IMenuElementOfTree = {
            key: dragKey,
            title: info.dragNode.title,
            hidden: info.dragNode.hidden,
            link: info.dragNode.link,
            children: info.dragNode.children
        }

        // console.log({
        //     dropKey,
        //     dragKey,
        //     dropPosition,
        //     dropToGap: info.dropToGap
        // })

        let menu = treeData

        menu = menu.filter(filterForDragKey)

        insertDragElem(menu)

        function filterForDragKey(elem: IMenuElementOfTree) {
            if (elem.key !== dragKey) {
                elem.children = elem.children.filter(filterForDragKey)
                return true
            }
        }

        function insertDragElem(menu: IMenuElementOfTree[]) {
            for (let i = 0; i < menu.length; i++) {
                if (menu[i].key === dropKey) {
                    if (dropPosition == -1) {
                        if (i - 1 >= 0) {
                            menu.splice(i - 1, 0, dragElem)
                        } else {
                            menu.unshift(dragElem)
                        }
                    }
                    if (dropPosition == 0) {
                        menu[i].children.unshift(dragElem)
                    }
                    if (dropPosition == 1) {
                        if (i + 1 < menu.length) {
                            menu.splice(i + 1, 0, dragElem)
                        } else {
                            menu.push(dragElem)
                        }
                    }
                    return true
                }
                if (insertDragElem(menu[i].children)) return true
            }
        }

        setTreeData(menu)
        setTreeDataUpdates([
            ...treeDataUpdates,
            {
                type: 'Update',
                key: dragKey
            }
        ])
    }

    function updateTreeDataMenu(key: string | undefined, body: any) {
        const newTreeData = []

        for (const elem of treeData) {
            newTreeData.push(updateTreeDataElem(elem))
        }

        setTreeData(newTreeData)

        function updateTreeDataElem(elem: IMenuElementOfTree) {
            const newTreeDataElem = {
                ...elem,
                children: [] as IMenuElementOfTree[]
            }

            if (elem.key == key) {
                newTreeDataElem.title = (
                    <MenuTreeElement
                        elem={{
                            title: body['title'] || newTreeDataElem.title.props.elem.title,
                            hidden:
                                body['hidden'] !== undefined
                                    ? body['hidden']
                                    : newTreeDataElem.hidden || false,
                            link: body['link'] || newTreeDataElem.link,
                            key: newTreeDataElem.key
                        }}
                        treeDataUpdatesState={[treeDataUpdates, setTreeDataUpdates]}
                    />
                )
                for (const field in body) {
                    if (field != 'title') {
                        ;(newTreeDataElem as any)[field] = body[field]
                    }
                }
            }
            for (const child of elem.children) {
                newTreeDataElem.children.push(updateTreeDataElem(child))
            }

            return newTreeDataElem
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
            <div style={{ textAlign: 'right', margin: '0 0 16px 0' }}>
                <Popconfirm
                    disabled={!selectedMenuControlsEnabled}
                    title="Are you sure to reset changes?"
                    onConfirm={resetSelectedMenuChanges}
                    okText="Yes"
                    okButtonProps={{
                        danger: true
                    }}
                    cancelText="No"
                >
                    <Button danger disabled={!selectedMenuControlsEnabled}>
                        Reset
                    </Button>
                </Popconfirm>
                <Popconfirm
                    disabled={!selectedMenuControlsEnabled}
                    title="Are you sure to update selected menu?"
                    onConfirm={saveSelectedMenuChanges}
                    okText="Yes"
                    cancelText="No"
                >
                    <Button
                        style={{ margin: '0 0 0 5px' }}
                        type="primary"
                        disabled={!selectedMenuControlsEnabled}
                    >
                        Save
                    </Button>
                </Popconfirm>
            </div>
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
                    <>
                        <Tree
                            selectable={false}
                            showLine
                            draggable
                            onDrop={onDrop}
                            treeData={treeData}
                        />
                        <Popover
                            content={
                                <TreeDataPopoverContent
                                    form={addRootElemToTreeDataMenuForm}
                                    action="Add"
                                    initialValues={{
                                        hidden: false
                                    }}
                                    onAction={(key: string | undefined, body: any) => {
                                        setTreeDataUpdates([
                                            ...treeDataUpdates,
                                            {
                                                type: 'Add',
                                                key,
                                                body
                                            }
                                        ])
                                        setAddRootElemToTreeDataMenuPopoverVisible(false)
                                    }}
                                />
                            }
                            visible={addRootElemToTreeDataMenuPopoverVisible}
                            onVisibleChange={(visible) => {
                                setAddRootElemToTreeDataMenuPopoverVisible(visible)
                                if (!visible) {
                                    addRootElemToTreeDataMenuForm.resetFields()
                                }
                            }}
                            trigger="click"
                        >
                            <PlusCircleOutlined
                                className="menu-tree-element-action"
                                style={{
                                    fontSize: '20px',
                                    margin: '0 5px',
                                    transform: 'translateY(20%)'
                                }}
                            />
                        </Popover>
                    </>
                )}
            </div>
            <Divider />
        </>
    )
}

export default SelectedMenu
