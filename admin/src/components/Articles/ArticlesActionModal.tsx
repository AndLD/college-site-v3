import { InboxOutlined } from '@ant-design/icons'
import { Modal, Form, Input, notification, message, Tree, Tabs, DatePicker } from 'antd'
import TextArea from 'antd/lib/input/TextArea'
import Dragger from 'antd/lib/upload/Dragger'
import { UploadFile } from 'antd/lib/upload/interface'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActionModalVisibility } from '../../store/actions'
import { privateRoute, privateRoutes, publicRoutes } from '../../utils/constants'
import { configMenu, deconfigMenu } from '../../utils/menu'
import {
    errorNotification,
    successNotification,
    warningNotification
} from '../../utils/notifications'
import { IArticlePut, IMenuBlock, IMenuBlockUpdate, IMenuElementOfTree } from '../../utils/types'
import EditableTags from '../Users/EditableTags'

const allowedFileTypes = [
    'text/html',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/json'
]

function ArticlesActionModal() {
    const dispatch = useDispatch()
    const token = useSelector((state: any) => state.app.token)

    // 'Add' | 'Update'
    const action = useSelector((state: any) => state.app.action)
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)

    // Выбранные строки таблицы
    const tableSelectedRows = useSelector((state: any) => state.app.tableSelectedRows)

    const [fetchedArticle, setFetchedArticle] = useState()

    // Инстанс формы Ant Design
    const [form] = Form.useForm()

    const [title, setTitle] = useState<string>('')
    const [tags, setTags] = useState<string[]>([])
    const [fileList, setFileList] = useState<UploadFile<any>[]>([])

    const articleFormItems = [
        <Form.Item
            key={'title'}
            name="title"
            label="Title"
            rules={[
                {
                    required: true,
                    message: 'Title is required'
                }
            ]}
        >
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </Form.Item>,
        <Form.Item key={'description'} name="description" label="Description">
            <Input />
        </Form.Item>,
        <Form.Item key={'publicTimestamp'} name="publicTimestamp" label="Public Date">
            <DatePicker showTime />
        </Form.Item>,

        <div key={'editableTags'} style={{ marginBottom: 20 }}>
            <EditableTags
                tags={tags}
                onSave={(newTags) => setTags(newTags)}
                isNewTagBtnVisible={true}
            />
        </div>,
        <Form.Item style={{ display: 'none' }} key={5} name="tags">
            <div></div>
        </Form.Item>,

        <Form.Item key={'oldId'} name="oldId">
            <Input min={1} max={3000} type="number" placeholder="Old ID" style={{ width: 100 }} />
        </Form.Item>,

        <Dragger
            key={'dragger'}
            multiple={false}
            accept={'.html,.docx,.pdf,.json'}
            maxCount={10}
            fileList={fileList}
            customRequest={({ onSuccess }: any) => onSuccess()}
            onChange={(info) => {
                setFileList(info.fileList)
                if (info.file.status === 'done') {
                    if (!allowedFileTypes.includes(info.file.type)) {
                        warningNotification(
                            'You should choose *.html, *.docx, *.pdf or *.json file!'
                        )
                        return
                    }
                }
            }}
        >
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag file to this area to upload</p>
            <p className="ant-upload-hint">*.html, *.docx, *.pdf, *.json</p>
        </Dragger>
    ]

    function onAdd(body: any, fileList: UploadFile<any>[]) {
        const formData = new FormData()

        formData.append('json', JSON.stringify(body))
        for (const file of fileList) {
            if (!file.originFileObj) {
                return warningNotification('Each file should have a content!')
            }

            const reader = new FileReader()
            reader.addEventListener('load', (event: any) => {
                formData.append('file', new Blob([event.target.result]), file.name)
                makeRequest()
            })
            reader.readAsArrayBuffer(file.originFileObj)
        }

        function makeRequest() {
            axios(`${privateRoutes.ARTICLE}`, {
                method: 'POST',
                data: formData,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
                .then((res: AxiosResponse) => {
                    successNotification(`Entity was successfully added`)
                    dispatch(setActionModalVisibility(false))

                    setTitle('')
                    setTags([])
                    setFileList([])
                })
                .catch((err: AxiosError) => errorNotification(err.message))
        }
    }

    // function onAction(body: any) {
    //     axios(
    //         `${privateRoutes.ARTICLE}/${
    //             tableSelectedRows.length ? `/${tableSelectedRows[0].id}` : ''
    //         }`,
    //         {
    //             method: action === 'Add' ? 'POST' : action === 'Update' ? 'PUT' : 'GET',
    //             data: body,
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //                 'Content-Type': draggerFileList.length
    //                     ? 'multipart/form-data'
    //                     : 'application/json'
    //             }
    //         }
    //     )
    //         .then((res: AxiosResponse) => {
    //             successNotification(
    //                 `Entity was successfully ${
    //                     action === 'Add' ? 'added' : action === 'Update' ? 'updated' : ''
    //                 }!`
    //             )
    //             dispatch(setActionModalVisibility(false))
    //             actionSuccessCallback()
    //         })
    //         .catch((err: AxiosError) => errorNotification(err.message))
    // }

    function fetchArticleById(id: string) {
        // TODO: Отправлять через query-параметры флаг, по которому бекенд определит, нужно ли возвращать файл статьи, или нет. Например: "?content=false"
        axios(`${publicRoutes.ARTICLE}/${id}`, {
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

                setFetchedArticle(res.data.result)
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    useEffect(() => {
        if (actionModalVisibility) {
            form.resetFields()

            // setTitle('')
            // setTags([])
            // setDraggerFileList([])
        }

        if (actionModalVisibility && action === 'Update') {
            tableSelectedRows[0]?.id && fetchArticleById(tableSelectedRows[0]?.id)
        }
    }, [actionModalVisibility])

    return (
        <Modal
            keyboard={false}
            centered
            visible={actionModalVisibility}
            title={`${action}`}
            okText={action}
            cancelText="Cancel"
            onCancel={() => {
                dispatch(setActionModalVisibility(false))

                setTitle('')
                setTags([])
                setFileList([])

                form.resetFields()
            }}
            onOk={() => {
                if (tags.length) {
                    form.setFieldsValue({ tags })
                }

                form.validateFields()
                    .then((values: any) => {
                        const actionBody: any = {}
                        if (action === 'Add' || (action === 'Update' && fetchedArticle)) {
                            for (const key in values) {
                                if (
                                    form.isFieldTouched(key) &&
                                    (action === 'Add' ||
                                        (action === 'Update' &&
                                            fetchedArticle &&
                                            (typeof fetchedArticle[key as keyof IArticlePut] ===
                                            'object'
                                                ? JSON.stringify(
                                                      fetchedArticle[key as keyof IArticlePut]
                                                  ) != JSON.stringify(values[key])
                                                : fetchedArticle[key as keyof IArticlePut] !=
                                                  values[key])))
                                ) {
                                    if (key.toLowerCase().includes('timestamp')) {
                                        actionBody[key] = Date.parse(values[key].toString())
                                    } else actionBody[key] = values[key]
                                }
                            }
                        }

                        if (Object.keys(actionBody).length) {
                            // onAction(actionBody)
                            if (action === 'Add') {
                                onAdd(actionBody, fileList)
                            }
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
                {articleFormItems}
            </Form>
        </Modal>
    )
}

export default ArticlesActionModal
