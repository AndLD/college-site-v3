import { InboxOutlined } from '@ant-design/icons'
import { Modal, Form, Input, notification, message, Tree, Tabs } from 'antd'
import TextArea from 'antd/lib/input/TextArea'
import Dragger from 'antd/lib/upload/Dragger'
import { UploadFile } from 'antd/lib/upload/interface'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActionModalVisibility } from '../store/actions'
import { privateRoute } from '../utils/constants'
import { configMenu, deconfigMenu } from '../utils/menu'
import { errorNotification, successNotification, warningNotification } from '../utils/notifications'
import { IMenuBlockUpdate, IMenuElementOfTree } from '../utils/types'
import MenuTree from './Menu/SelectedMenu/MenuTree'

const allowedFileTypes = ['application/json']

export default function ActionModal() {
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

    // Текст json в textarea
    const [menuJson, setMenuJson] = useState<string>('[]')
    // Является ли json в textarea неправильным
    const [isMenuJsonInvalid, setIsMenuJsonInvalid] = useState<boolean>(false)

    // Массив элементов меню в интерфесе
    const [menuTreeData, setMenuTreeData] = useState<IMenuElementOfTree[]>([])
    // Массив обновлений меню в интерфейсе
    const [menuTreeDataUpdates, setMenuTreeDataUpdates] = useState<IMenuBlockUpdate[]>([])

    // Является ли основная кнопка модального окна активной
    const [isActionButtonEnabled, setIsActionButtonEnabled] = useState<boolean>(false)

    // Является ли меню в интерфейсе автоматически обновляемым
    const [isMenuTreeDataAutoUpdateEnabled, setIsMenuTreeDataAutoUpdateEnabled] =
        useState<boolean>(true)
    // Является ли json в textarea автоматически обновляемым
    const [isMenuJsonAutoUpdateEnabled, setIsMenuJsonAutoUpdateEnabled] = useState<boolean>(false)

    // Установлены ли поля формы
    const [isFormFieldsValueSetted, setIsFormFieldsValueSetted] = useState<boolean>(false)

    const [draggerFileList, setDraggerFileList] = useState<UploadFile<any>[]>([])

    const menuFormItems = [
        <Form.Item key={1} name="description" label="Description">
            <Input placeholder="Enter menu block description" />
        </Form.Item>,
        // Пустой компонент Form.Item, value которого задается программно из другого компонента
        <Form.Item
            style={{ display: 'none' }}
            key={2}
            name="menu"
            // label="Menu"
            // rules={[
            //     {
            //         required: true,
            //         message: 'Please set the menu!'
            //     }
            // ]}
        >
            <div></div>
        </Form.Item>,
        <Tabs
            key={'2.1'}
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
                    // onDrop={(event: any) => {
                    //     if (!allowedFileTypes.includes(event.dataTransfer.files[0].type)) {
                    //         warningNotification('You should choose a *.json file!')
                    //         return
                    //     }
                    //     const reader = new FileReader()
                    //     reader.addEventListener('load', (event: any) => {
                    //         setMenuJson(event.target.result)
                    //         setTabsActiveKey('1')
                    //     })
                    //     console.log(event.dataTransfer.files[0])
                    //     reader.readAsText(event.dataTransfer.files[0])
                    // }}
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
                            'Add' ? 'added' : action === 'Update' ? 'updated' : ''
                        }!`
                    )
                    dispatch(setActionModalVisibility(false))
                    actionSuccessCallback()
                })
                .catch((err: AxiosError) => errorNotification(err.message))
        }
    }

    useEffect(() => {
        if (actionModalVisibility) {
            form.resetFields()
            setMenuJson('[]')
            setIsMenuJsonInvalid(false)
            // setMenuTreeData([])
            setMenuTreeDataUpdates([])
            setTabsActiveKey('2')
            setIsActionButtonEnabled(false)

            setDraggerFileList([])

            setIsMenuTreeDataAutoUpdateEnabled(true)
            setIsMenuJsonAutoUpdateEnabled(false)
        }
    }, [actionModalVisibility])

    useEffect(() => {
        try {
            var menu = JSON.parse(menuJson)
        } catch (e: any) {
            setIsMenuJsonInvalid(true)
            setIsActionButtonEnabled(false)
        }

        if (menu) {
            const configuredMenu = configMenu(
                menu,
                [menuTreeDataUpdates, setMenuTreeDataUpdates],
                () => {
                    setIsMenuJsonInvalid(true)
                    message.error('JSON input does not match the menu structure!\n', 1)
                }
            )

            if (configuredMenu) {
                // if (!isFormFieldsValueSetted && menu.length) {
                //     setIsFormFieldsValueSetted(true)
                //     form.setFieldsValue({ menu })
                //     console.log('menuJson, setFieldsValue', { menu })
                // } else {
                //     setIsFormFieldsValueSetted(false)
                // }

                if (isMenuTreeDataAutoUpdateEnabled) {
                    setMenuTreeData(configuredMenu)

                    setIsMenuJsonInvalid(false)
                    setIsFormFieldsValueSetted(false)
                    setIsActionButtonEnabled(true)
                }
            }
        }
    }, [menuJson])

    useEffect(() => {
        const deconfiguredMenu = deconfigMenu(menuTreeData)

        if (deconfiguredMenu) {
            // if (!isFormFieldsValueSetted && deconfiguredMenu.length) {
            //     setIsFormFieldsValueSetted(true)
            //     form.setFieldsValue({ menu: deconfiguredMenu })
            //     console.log('menuTreeData, setFieldsValue', { deconfiguredMenu })
            // } else {
            //     setIsFormFieldsValueSetted(false)
            // }

            if (isMenuJsonAutoUpdateEnabled) {
                setMenuJson(JSON.stringify(deconfiguredMenu, null, '\t'))

                setIsFormFieldsValueSetted(false)
                setIsActionButtonEnabled(true)
            }
        } else {
            setIsActionButtonEnabled(false)
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

    useEffect(() => {
        console.log('menu tree auto update: ', isMenuTreeDataAutoUpdateEnabled)
    }, [isMenuTreeDataAutoUpdateEnabled])

    useEffect(() => {
        console.log('menu json auto update: ', isMenuJsonAutoUpdateEnabled)
    }, [isMenuJsonAutoUpdateEnabled])

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
                disabled: !isActionButtonEnabled
            }}
            onOk={() => {
                if (!isFormFieldsValueSetted) {
                    try {
                        var menu = JSON.parse(menuJson)
                    } catch (e: any) {
                        setIsMenuJsonInvalid(true)
                        setIsActionButtonEnabled(false)
                    }

                    if (menu.length) {
                        setIsFormFieldsValueSetted(true)
                        form.setFieldsValue({ menu })
                        console.log('menuJson, setFieldsValue', { menu })
                    }
                    // else {
                    //     setIsFormFieldsValueSetted(false)
                    // }
                }

                form.validateFields()
                    .then((values: any) => {
                        console.log('values after validation', values)
                        const actionBody: any = {}
                        for (const key in values) {
                            if (form.isFieldTouched(key)) {
                                actionBody[key] = values[key]
                            }
                        }
                        // const body = actionBody.birthday
                        //     ? { ...actionBody, birthday: actionBody.birthday.format('DD.MM.YYYY') }
                        //     : actionBody
                        if (Object.keys(actionBody).length) {
                            onAction(actionBody)
                        } else warningNotification('Unable to perform action!')
                    })
                    .catch(() => {
                        notification.error({
                            message: 'Validation error',
                            description: 'Invalid form data!'
                        })
                    })
            }}
        >
            <Form
                form={form}
                fields={[{ name: 'description' }, { name: 'menu' }]}
                layout="vertical"
                initialValues={{}}
            >
                {getFormItems()}
            </Form>
        </Modal>
    )
}
