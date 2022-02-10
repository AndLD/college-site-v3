import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Form, Popconfirm, Popover } from 'antd'
import { SetStateAction, useEffect, useState } from 'react'
import { IMenuElement, IMenuElementOfTree, IMenuBlockUpdate } from '../../utils/types'
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

    return (
        <div
            className="menu-tree-element"
            style={{
                color: elem.hidden ? '#d4d4d4' : 'black'
            }}
        >
            <span>{elem.title}</span>
            <Popover
                content={
                    <TreeDataPopoverContent form={addForm} action="Add" treeDataKey={elem.key} />
                }
                onVisibleChange={(visible) => {
                    if (!visible) {
                        // addForm.resetFields()
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
                        onAction={(key: string, body: any) => {
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
                    // console.log()
                }}
                okText="Delete"
                cancelText="Cancel"
            >
                <DeleteOutlined
                    className="menu-tree-element-action"
                    style={{ fontSize: '20px', margin: '0 5px', transform: 'translateY(20%)' }}
                />
            </Popconfirm>
        </div>
    )
}