import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Form, Popconfirm, Popover, Tooltip } from 'antd'
import { SetStateAction, useEffect, useState } from 'react'
import { IMenuElement, IMenuElementOfTree, IMenuBlockUpdate } from '../../../utils/types'
import { TreeDataPopoverContent } from './TreeDataPopoverContent'

export default function MenuTreeElement({
    elem,
    treeDataUpdatesState: [treeDataUpdates, setTreeDataUpdates]
}: {
    elem: { title: string; hidden: boolean; link: string; key: string }
    treeDataUpdatesState: [IMenuBlockUpdate[], any]
}) {
    const [addForm] = Form.useForm()
    const [updateForm] = Form.useForm()

    const [updatePopoverVisible, setUpdatePopoverVisible] = useState<boolean>(false)
    const [addPopoverVisible, setAddPopoverVisible] = useState<boolean>(false)

    return (
        <div
            className="menu-tree-element"
            style={{
                color: elem.hidden ? '#d4d4d4' : 'black'
            }}
        >
            <Tooltip
                placement="left"
                title={elem.link || 'No link'}
                mouseEnterDelay={0}
                mouseLeaveDelay={0}
            >
                <span
                    style={{
                        overflowWrap: 'normal'
                    }}
                >
                    {elem.title}
                </span>
            </Tooltip>
            <span>
                <Popover
                    content={
                        <TreeDataPopoverContent
                            form={addForm}
                            action="Add"
                            treeDataKey={elem.key}
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
                                setAddPopoverVisible(false)
                            }}
                        />
                    }
                    visible={addPopoverVisible}
                    onVisibleChange={(visible) => {
                        setAddPopoverVisible(visible)
                        if (!visible) {
                            addForm.resetFields()
                        }
                    }}
                    trigger="click"
                >
                    <PlusCircleOutlined
                        className="menu-tree-element-action"
                        style={{ fontSize: '20px', margin: '0 5px', transform: 'translateY(20%)' }}
                    />
                </Popover>

                <Popover
                    content={
                        <TreeDataPopoverContent
                            form={updateForm}
                            action="Update"
                            initialValues={{
                                title: elem.title,
                                hidden: elem.hidden,
                                link: elem.link
                            }}
                            treeDataKey={elem.key}
                            onAction={(key: string | undefined, body: any) => {
                                setTreeDataUpdates([
                                    ...treeDataUpdates,
                                    {
                                        type: 'Update',
                                        key,
                                        body
                                    }
                                ])
                                setUpdatePopoverVisible(false)
                            }}
                        />
                    }
                    visible={updatePopoverVisible}
                    onVisibleChange={(visible) => {
                        setUpdatePopoverVisible(visible)
                        if (!visible) {
                            updateForm.resetFields()
                        }
                    }}
                    trigger="click"
                >
                    <EditOutlined
                        className="menu-tree-element-action"
                        style={{ fontSize: '20px', margin: '0 5px', transform: 'translateY(20%)' }}
                        onClick={() => setUpdatePopoverVisible(true)}
                    />
                </Popover>
                <Popconfirm
                    title="Are you sure to delete menu element?"
                    onConfirm={() => {
                        setTreeDataUpdates([
                            ...treeDataUpdates,
                            {
                                type: 'Delete',
                                key: elem.key
                            }
                        ])
                    }}
                    okText="Delete"
                    cancelText="Cancel"
                >
                    <DeleteOutlined
                        className="menu-tree-element-action"
                        style={{ fontSize: '20px', margin: '0 5px', transform: 'translateY(20%)' }}
                    />
                </Popconfirm>
            </span>
        </div>
    )
}
