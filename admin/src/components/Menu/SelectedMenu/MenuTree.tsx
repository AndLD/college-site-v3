import { PlusCircleOutlined } from '@ant-design/icons'
import { Form, Popover, Tree } from 'antd'
import { generateKey } from 'fast-key-generator'
import { useEffect, useState } from 'react'
import { IMenuBlockUpdate, IMenuElementOfTree } from '../../../utils/types'
import MenuTreeElement from './MenuTreeElement'
import { TreeDataPopoverContent } from './TreeDataPopoverContent'

function MenuTree({
    treeDataState: [treeData, setTreeData],
    treeDataUpdatesState: [treeDataUpdates, setTreeDataUpdates],
    noUpdateCallback,
    updateCallback
}: {
    treeDataState: [IMenuElementOfTree[], any]
    treeDataUpdatesState: [IMenuBlockUpdate[], any]
    noUpdateCallback?: (...params: any) => any
    updateCallback?: (...params: any) => any
}) {
    const [addRootElemToTreeDataMenuForm] = Form.useForm()
    const [addRootElemToTreeDataMenuPopoverVisible, setAddRootElemToTreeDataMenuPopoverVisible] =
        useState<boolean>(false)

    useEffect(() => {
        const newUpdate = treeDataUpdates[treeDataUpdates.length - 1]

        if (!newUpdate) {
            noUpdateCallback && noUpdateCallback()
            return
        }

        if (newUpdate.type == 'Update' && newUpdate.body) {
            updateTreeDataMenu(newUpdate.key, newUpdate.body)
        } else if (newUpdate.type == 'Add' && newUpdate.body) {
            addChildToTreeDataMenu(newUpdate.key, newUpdate.body)
        } else if (newUpdate.type == 'Delete' && newUpdate.key) {
            deleteFromTreeDataMenu(newUpdate.key)
        }

        updateCallback && updateCallback()
    }, [treeDataUpdates])

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

    return (
        <>
            <Tree
                style={{ width: 'max-content' }}
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
    )
}

export default MenuTree
