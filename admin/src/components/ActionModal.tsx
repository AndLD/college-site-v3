import { InboxOutlined } from '@ant-design/icons'
import { Modal, Form, Input, notification, message, Tree } from 'antd'
import TextArea from 'antd/lib/input/TextArea'
import Dragger from 'antd/lib/upload/Dragger'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActionModalVisibility } from '../store/actions'
import { errorNotification, warningNotification } from '../utils/notifications'
import { IMenuElementOfTree } from '../utils/types'

const allowedFileTypes = ['application/json']

export default function ActionModal({ values }: any) {
    const dispatch = useDispatch()

    const action = useSelector((state: any) => state.app.action)
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)
    // const onAction = useSelector((state: any) => state.onAction)

    const [form] = Form.useForm()

    const [menuJson, setMenuJson] = useState<string>('')

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
            <Tree showLine treeData={menuTreeData} />
            <Dragger
                /*style={{ borderColor: 'red' }}*/
                multiple={false}
                accept={'.json'}
                customRequest={(options: any) => {
                    console.log(options)
                }}
                onDrop={(event: any) => {
                    if (!allowedFileTypes.includes(event.dataTransfer.files[0].type)) {
                        errorNotification('You should choose a *.json file!')
                        return
                    }
                    const reader = new FileReader()
                    reader.addEventListener('load', (event: any) => {
                        setMenuJson(event.target.result)
                    })
                    reader.readAsText(event.dataTransfer.files[0])
                }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                <p className="ant-upload-hint">*.json</p>
            </Dragger>
            <TextArea
                // name="menu"
                value={menuJson}
                // defaultValue={menuJson}
                onChange={(event: any) => {
                    setMenuJson(event.target.value)
                }}
                rows={15}
            />
        </Form.Item>
    ]

    function getFormItems() {
        const currentPage = window.localStorage.getItem('currentPage')

        switch (currentPage) {
            case 'Menu':
                return menuFormItems
        }
    }

    // useEffect(() => {
    //     if (actionModalVisibility) form.resetFields()
    // }, [actionModalVisibility])

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
                {getFormItems()}
            </Form>
        </Modal>
    )
}
