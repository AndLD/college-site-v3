import { InboxOutlined } from '@ant-design/icons'
import { Modal, Form, Input, notification, message, Tree, Tabs } from 'antd'
import TextArea from 'antd/lib/input/TextArea'
import Dragger from 'antd/lib/upload/Dragger'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActionModalVisibility } from '../store/actions'
import { privateRoute, privateRoutes } from '../utils/constants'
import { configMenu, deconfigMenu } from '../utils/menu'
import { errorNotification, successNotification, warningNotification } from '../utils/notifications'
import { IMenuBlockUpdate, IMenuElementOfTree } from '../utils/types'
import MenuTree from './Menu/SelectedMenu/MenuTree'

const allowedFileTypes = ['application/json']

export default function ActionModal() {
    const dispatch = useDispatch()
    const token = useSelector((state: any) => state.app.token)

    const action = useSelector((state: any) => state.app.action)
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)
    const tableSelectedRows = useSelector((state: any) => state.app.tableSelectedRows)

    const [form] = Form.useForm()

    const [menuJson, setMenuJson] = useState<string>('[]')
    const [isMenuJsonInvalid, setIsMenuJsonInvalid] = useState<boolean>(false)

    const [menuTreeData, setMenuTreeData] = useState<IMenuElementOfTree[]>([])
    const [menuTreeDataUpdates, setMenuTreeDataUpdates] = useState<IMenuBlockUpdate[]>([])

    const [tabsActiveKey, setTabsActiveKey] = useState<string>('1')

    const [actionButtonEnabled, setActionButtonEnabled] = useState<boolean>(false)

    const [isMenuTreeDataAutoUpdateEnabled, setIsMenuTreeDataAutoUpdateEnabled] =
        useState<boolean>(true)
    const [isMenuJsonAutoUpdateEnabled, setIsMenuJsonAutoUpdateEnabled] = useState<boolean>(false)

    const menuFormItems = [
        <Form.Item key={1} name="description" label="Description">
            <Input placeholder="Enter menu block description" />
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
            <Tabs
                onChange={(activeKey: string) => setTabsActiveKey(activeKey)}
                activeKey={tabsActiveKey}
                defaultActiveKey={'1'}
            >
                <Tabs.TabPane tab="Menu tree" key={1} style={{ overflow: 'scroll' }}>
                    <MenuTree
                        treeDataState={[menuTreeData, setMenuTreeData]}
                        treeDataUpdatesState={[menuTreeDataUpdates, setMenuTreeDataUpdates]}
                    />
                </Tabs.TabPane>

                <Tabs.TabPane tab="File upload" key={2}>
                    <Dragger
                        /*style={{ borderColor: 'red' }}*/
                        multiple={false}
                        accept={'.json'}
                        maxCount={1}
                        // onRemove={() => setMenuJson('[]')}
                        customRequest={({ onSuccess }: any) => onSuccess()}
                        onDrop={(event: any) => {
                            if (!allowedFileTypes.includes(event.dataTransfer.files[0].type)) {
                                warningNotification('You should choose a *.json file!')
                                return
                            }
                            const reader = new FileReader()
                            reader.addEventListener('load', (event: any) => {
                                setMenuJson(event.target.result)
                                setTabsActiveKey('1')
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
                </Tabs.TabPane>
                <Tabs.TabPane tab="Json" key={3}>
                    <TextArea
                        style={{
                            borderColor: isMenuJsonInvalid ? 'red' : ''
                        }}
                        value={menuJson}
                        onChange={(event: any) => {
                            setMenuJson(event.target.value)
                            setMenuTreeData([])
                            setMenuTreeDataUpdates([])
                        }}
                        rows={15}
                    />
                </Tabs.TabPane>
            </Tabs>
        </Form.Item>
    ]

    function getFormItems() {
        const currentPage = localStorage.getItem('currentPage')

        switch (currentPage) {
            case 'Menu':
                return menuFormItems
        }
    }

    function onAction(body: any) {
        const currentPage = localStorage.getItem('currentPage')

        currentPage &&
            axios(
                `${privateRoute}/${currentPage.toLowerCase()}${
                    tableSelectedRows.length ? `/${tableSelectedRows[0].id}` : ''
                }`,
                {
                    method: action === 'Add' ? 'POST' : action === 'Update' ? 'PUT' : 'GET',
                    data: body,
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )
                .then((res: AxiosResponse) => {
                    console.log(res.data.result)
                    successNotification(
                        `Entity was successfully ${
                            'Add' ? 'added' : action === 'Update' ? 'updated' : ''
                        }!`
                    )
                })
                .catch((err: AxiosError) => errorNotification(err.message))
    }

    useEffect(() => {
        if (actionModalVisibility) {
            form.resetFields()
            setMenuJson('[]')
            setIsMenuJsonInvalid(false)
            // setMenuTreeData([])
            setMenuTreeDataUpdates([])
            setTabsActiveKey('2')
            setActionButtonEnabled(false)

            setIsMenuTreeDataAutoUpdateEnabled(true)
            setIsMenuJsonAutoUpdateEnabled(false)
        }
    }, [actionModalVisibility])

    useEffect(() => {
        if (isMenuTreeDataAutoUpdateEnabled) {
            try {
                var menu = JSON.parse(menuJson)
            } catch (e: any) {
                setIsMenuJsonInvalid(true)
                setActionButtonEnabled(false)
            }

            if (menu) {
                form.setFieldsValue({ menu })
                const configuredMenu = configMenu(
                    menu,
                    [menuTreeDataUpdates, setMenuTreeDataUpdates],
                    () => {
                        setIsMenuJsonInvalid(true)
                        message.error('JSON input does not match the menu structure!\n', 1)
                    }
                )

                if (configuredMenu) {
                    setMenuTreeData(configuredMenu)

                    setIsMenuJsonInvalid(false)
                    setActionButtonEnabled(true)
                }
            }
        }
    }, [menuJson])

    useEffect(() => {
        if (isMenuJsonAutoUpdateEnabled) {
            const deconfiguredMenu = deconfigMenu(menuTreeData)
            if (deconfiguredMenu) {
                form.setFieldsValue({ menu: deconfiguredMenu })
                setMenuJson(JSON.stringify(deconfiguredMenu, null, '\t'))
            }
        }
    }, [menuTreeData])

    useEffect(() => {
        if (actionModalVisibility)
            switch (tabsActiveKey) {
                case '1':
                    setIsMenuTreeDataAutoUpdateEnabled(false)
                    setIsMenuJsonAutoUpdateEnabled(true)
                    break
                case '3':
                    setIsMenuTreeDataAutoUpdateEnabled(true)
                    setIsMenuJsonAutoUpdateEnabled(false)
            }
    }, [tabsActiveKey])

    return (
        <Modal
            centered
            visible={actionModalVisibility}
            title={`${action}`}
            okText={action}
            cancelText="Cancel"
            onCancel={() => {
                dispatch(setActionModalVisibility(false))
                // setMenuJson('[]')
                // setIsMenuJsonInvalid(false)

                form.resetFields()
            }}
            okButtonProps={{
                disabled: !actionButtonEnabled
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
                            onAction(body)
                        } else warningNotification('You should do any changes to update user!')
                    })
                    .catch(() => {
                        notification.error({
                            message: 'Validation error',
                            description: 'Invalid form data!'
                        })
                    })
            }}
        >
            <Form form={form} layout="vertical" initialValues={{}}>
                {getFormItems()}
            </Form>
        </Modal>
    )
}
