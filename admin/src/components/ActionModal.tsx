import { InboxOutlined } from '@ant-design/icons'
import { Modal, Form, Input, notification, message, Tree, Tabs } from 'antd'
import TextArea from 'antd/lib/input/TextArea'
import Dragger from 'antd/lib/upload/Dragger'
import { UploadFile } from 'antd/lib/upload/interface'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { stringify } from 'querystring'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActionModalVisibility, setTableSelectedRows } from '../store/actions'
import { privateRoute, privateRoutes } from '../utils/constants'
import { configMenu, deconfigMenu } from '../utils/menu'
import { errorNotification, successNotification, warningNotification } from '../utils/notifications'
import { IMenuBlock, IMenuBlockUpdate, IMenuElement, IMenuElementOfTree } from '../utils/types'
import MenuTree from './Menu/SelectedMenu/MenuTree'

const allowedFileTypes = ['application/json']

export default function ActionModal() {
    const currentPage = localStorage.getItem('currentPage')

    const dispatch = useDispatch()
    const token = useSelector((state: any) => state.app.token)

    // 'Add' | 'Update'
    const action = useSelector((state: any) => state.app.action)
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)
    const actionSuccessCallback = useSelector((state: any) => state.app.actionSuccessCallback)

    // Выбранные строки таблицы
    const tableSelectedRows = useSelector((state: any) => state.app.tableSelectedRows)

    // Инстанс формы Ant Design
    const [form] = Form.useForm()

    // Текущая открытая вкладка
    const [tabsActiveKey, setTabsActiveKey] = useState<string>('1')

    const [fetchedMenu, setFetchedMenu] = useState<IMenuBlock>()

    // Текст json в textarea
    const [menuJson, setMenuJson] = useState<string>('[]')

    const [menuJsonErrorMessage, setMenuJsonErrorMessage] = useState<string | undefined>()

    // Массив элементов меню в интерфесе
    const [menuTreeData, setMenuTreeData] = useState<IMenuElementOfTree[]>([])
    // Массив обновлений меню в интерфейсе
    const [menuTreeDataUpdates, setMenuTreeDataUpdates] = useState<IMenuBlockUpdate[]>([])

    // Является ли меню в интерфейсе автоматически обновляемым
    const [isMenuTreeDataAutoUpdateEnabled, setIsMenuTreeDataAutoUpdateEnabled] =
        useState<boolean>(true)
    // Является ли json в textarea автоматически обновляемым
    const [isMenuJsonAutoUpdateEnabled, setIsMenuJsonAutoUpdateEnabled] = useState<boolean>(false)

    const [draggerFileList, setDraggerFileList] = useState<UploadFile<any>[]>([])

    const menuFormItems = [
        <Form.Item key={1} name="description" label="Description">
            <Input placeholder="Enter menu block description" />
        </Form.Item>,
        <Tabs
            key={2}
            onChange={(activeKey: string) => setTabsActiveKey(activeKey)}
            activeKey={tabsActiveKey}
            // defaultActiveKey={'1'}
        >
            <Tabs.TabPane tab="Menu tree" key={1} style={{ overflow: 'scroll' }}>
                <MenuTree
                    treeDataState={[menuTreeData, setMenuTreeData]}
                    treeDataUpdatesState={[menuTreeDataUpdates, setMenuTreeDataUpdates]}
                />
            </Tabs.TabPane>

            <Tabs.TabPane tab="File upload" key={2}>
                <Dragger
                    multiple={false}
                    accept={'.json'}
                    maxCount={1}
                    fileList={draggerFileList}
                    customRequest={({ onSuccess }: any) => onSuccess()}
                    onChange={(info: any) => {
                        setDraggerFileList([info.file])
                        if (info.file.status === 'done') {
                            if (!allowedFileTypes.includes(info.file.type)) {
                                warningNotification('You should choose a *.json file!')
                                return
                            }
                            const reader = new FileReader()
                            reader.addEventListener('load', (event: any) => {
                                setMenuJson(event.target.result)
                                setTabsActiveKey('1')
                            })
                            reader.readAsText(info.file.originFileObj)
                        }
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
                        borderColor: menuJsonErrorMessage ? 'red' : ''
                    }}
                    value={menuJson}
                    onChange={(event: any) => {
                        setMenuJson(event.target.value)
                        setMenuTreeData([])
                        setMenuTreeDataUpdates([])
                    }}
                    rows={15}
                />
                <div style={{ display: menuJsonErrorMessage ? 'block' : 'none', color: 'red' }}>
                    {menuJsonErrorMessage}
                </div>
            </Tabs.TabPane>
        </Tabs>,
        // Пустой компонент Form.Item, value которого задается программно из другого компонента
        <Form.Item
            // style={{ display: 'none' }}
            key={3}
            name="menu"
            rules={[
                {
                    required: true,
                    message: 'Please set the menu!'
                }
            ]}
        >
            <div></div>
        </Form.Item>
    ]

    function getFormItems() {
        switch (currentPage) {
            case 'Menu':
                return menuFormItems
        }
    }

    function onAction(body: any) {
        if (currentPage) {
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
                    successNotification(
                        `Entity was successfully ${
                            action === 'Add' ? 'added' : action === 'Update' ? 'updated' : ''
                        }!`
                    )
                    dispatch(setActionModalVisibility(false))
                    actionSuccessCallback()
                })
                .catch((err: AxiosError) => errorNotification(err.message))
        }
    }

    function fetchMenuById(id: string) {
        axios(`${privateRoutes.MENU}/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                const description = res.data.result.description
                const menu = res.data.result.menu

                form.setFieldsValue({
                    description,
                    menu
                })

                setFetchedMenu(res.data.result)
                setMenuJson(JSON.stringify(menu, null, '\t'))
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    useEffect(() => {
        if (actionModalVisibility) {
            form.resetFields()

            setFetchedMenu(undefined)

            setMenuJson('[]')
            setMenuJsonErrorMessage(undefined)

            setMenuTreeDataUpdates([])
            setTabsActiveKey('2')

            setDraggerFileList([])

            setIsMenuTreeDataAutoUpdateEnabled(true)
            setIsMenuJsonAutoUpdateEnabled(false)
        }

        if (actionModalVisibility && action === 'Update') {
            tableSelectedRows[0]?.id && fetchMenuById(tableSelectedRows[0]?.id)
        }
    }, [actionModalVisibility])

    useEffect(() => {
        if (isMenuTreeDataAutoUpdateEnabled) {
            try {
                var menu = JSON.parse(menuJson)
            } catch (e: any) {
                setMenuJsonErrorMessage('Invalid JSON.')
            }

            if (menu) {
                const configuredMenu = configMenu(
                    menu,
                    [menuTreeDataUpdates, setMenuTreeDataUpdates],
                    () => {
                        setMenuJsonErrorMessage('JSON input does not match the menu structure.')
                    }
                )

                if (configuredMenu) {
                    setMenuTreeData(configuredMenu)

                    setMenuJsonErrorMessage(undefined)
                }
            }
        }
    }, [menuJson])

    useEffect(() => {
        if (isMenuJsonAutoUpdateEnabled) {
            const deconfiguredMenu = deconfigMenu(menuTreeData)

            if (deconfiguredMenu) {
                setMenuJson(JSON.stringify(deconfiguredMenu, null, '\t'))
            }
        }
    }, [menuTreeData])

    useEffect(() => {
        if (actionModalVisibility) {
            if (tabsActiveKey == '1') {
                setIsMenuTreeDataAutoUpdateEnabled(false)
                setIsMenuJsonAutoUpdateEnabled(true)
            } else if (tabsActiveKey == '2' || tabsActiveKey == '3') {
                setIsMenuTreeDataAutoUpdateEnabled(true)
                setIsMenuJsonAutoUpdateEnabled(false)
            }
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

                form.resetFields()
            }}
            onOk={() => {
                try {
                    var menu = JSON.parse(menuJson)
                } catch (e: any) {
                    setMenuJsonErrorMessage('Invalid JSON.')
                }

                if (menu.length) {
                    form.setFieldsValue({ menu })
                }

                form.validateFields()
                    .then((values: any) => {
                        const actionBody: any = {}
                        if (action === 'Add' || (action === 'Update' && fetchedMenu)) {
                            for (const key in values) {
                                if (
                                    // form.isFieldTouched(key) &&
                                    action === 'Add' ||
                                    (action === 'Update' &&
                                        fetchedMenu &&
                                        (typeof fetchedMenu[key as keyof IMenuBlock] === 'object'
                                            ? JSON.stringify(
                                                  fetchedMenu[key as keyof IMenuBlock]
                                              ) != JSON.stringify(values[key])
                                            : fetchedMenu[key as keyof IMenuBlock] != values[key]))
                                ) {
                                    actionBody[key] = values[key]
                                }
                            }
                        }

                        if (Object.keys(actionBody).length) {
                            onAction(actionBody)
                        } else
                            warningNotification(
                                action === 'Add'
                                    ? 'Fill the fields!'
                                    : action === 'Update'
                                    ? 'No updates detected'
                                    : 'Unable to perform the action'
                            )
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
