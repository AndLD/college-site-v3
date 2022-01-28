import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons'
import { Form, Popconfirm, Popover } from 'antd'
import { TreeDataPopoverContent } from './TreeDataPopoverContent'

export default function MenuTreeElement({
    elem
}: {
    elem: { title: string; hidden: boolean; link: string; key: string }
}) {
    const [addForm] = Form.useForm()
    const [updateForm] = Form.useForm()

    return (
        <div className="menu-tree-element">
            <span>{elem.title}</span>
            <Popover
                content={<TreeDataPopoverContent form={addForm} action="Add" />}
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
                    />
                }
                onVisibleChange={(visible) => {
                    if (!visible) {
                        updateForm.resetFields()
                    }
                }}
                trigger="click"
            >
                <EditOutlined
                    className="menu-tree-element-action"
                    style={{ fontSize: '20px', margin: '0 5px', transform: 'translateY(20%)' }}
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
