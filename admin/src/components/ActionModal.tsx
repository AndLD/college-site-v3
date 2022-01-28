import { Modal, Form, Input, notification, message, Tree } from 'antd'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActionModalVisibility } from '../store/actions'
import { warningNotification } from '../utils/notifications'
import { IMenuElementOfTree } from '../utils/types'

// const props = {
//     // name: 'file',
//     multiple: false,
//     accept: '.json',
//     // action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
//     // onChange(info: any) {
//     //     const { status } = info.file
//     //     if (status !== 'uploading') {
//     //         console.log(info.file, info.fileList)
//     //     }
//     //     if (status === 'done') {
//     //         message.success(`${info.file.name} file uploaded successfully.`)
//     //     } else if (status === 'error') {
//     //         message.error(`${info.file.name} file upload failed.`)
//     //     }
//     // },
//     customRequest: () => true,
//     onDrop(e: any) {
//         console.log('Dropped files', e.dataTransfer.files)
//         const reader = new FileReader()
//         reader.addEventListener('load', (event: any) => {
//             console.log('load result', event.target)
//         })
//         console.log(e.dataTransfer.files[0])
//         reader.readAsText(e.dataTransfer.files[0])
//     }
//     // beforeUpload(file: any) {
//     //     return false
//     // }
// }

export default function ActionModal({ values }: any) {
    const dispatch = useDispatch()

    const action = useSelector((state: any) => state.app.action)
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)
    // const onAction = useSelector((state: any) => state.onAction)

    const [form] = Form.useForm()
    const [formItems, setFormItems] = useState([])

    const [menuTreeData, setMenuTreeData] = useState<IMenuElementOfTree[]>([])
    const menuFormItems = [
        <Form.Item key={1} name="description" label="Description">
            <Input />
        </Form.Item>,
        <Form.Item
            key={2}
            name="menu"
            label="Menu"
            rules={[
                {
                    required: true,
                    message: 'Please set the menu!'
                }
            ]}
        >
            <Tree
                showLine
                onSelect={(selectedKeys, info) => {
                    console.log('selected', selectedKeys, info)
                }}
                treeData={menuTreeData}
            />
            {/* <Dragger {...props}>
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">*.json</p>
            </Dragger> */}
        </Form.Item>
    ]

    useEffect(() => {
        let chousenFormItems: any = []

        const currentPage = window.localStorage.getItem('currentPage')

        switch (currentPage) {
            case 'Menu':
                chousenFormItems = menuFormItems
        }

        setFormItems(chousenFormItems)

        if (actionModalVisibility) form.resetFields()
    }, [actionModalVisibility])

    return (
        <Modal
            centered
            visible={actionModalVisibility}
            title={`${action}`}
            okText={action}
            cancelText="Cancel"
            onCancel={() => {
                dispatch(setActionModalVisibility(false))
                form.resetFields()
            }}
            onOk={() => {
                form.validateFields()
                    .then((values: any) => {
                        const actionBody: any = {}
                        for (const key in values) {
                            if (form.isFieldTouched(key)) {
                                actionBody[key] = values[key]
                            }
                        }
                        const body = actionBody.birthday
                            ? { ...actionBody, birthday: actionBody.birthday.format('DD.MM.YYYY') }
                            : actionBody
                        if (Object.keys(body).length) {
                            console.log('onAction(body)', body)
                        } else warningNotification('You should do any changes to update user!')
                        form.resetFields()
                    })
                    .catch(() => {
                        notification.error({
                            message: 'Validation error',
                            description: 'Invalid form data!'
                        })
                    })
            }}
        >
            <Form form={form} layout="vertical" initialValues={values}>
                {formItems}
            </Form>
        </Modal>
    )
}
