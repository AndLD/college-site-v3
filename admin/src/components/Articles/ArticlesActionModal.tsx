import { InboxOutlined, InfoCircleFilled } from '@ant-design/icons'
import {
    Modal,
    Form,
    Input,
    notification,
    message,
    Tree,
    Tabs,
    DatePicker,
    FormInstance,
    Button
} from 'antd'
import TextArea from 'antd/lib/input/TextArea'
import Dragger from 'antd/lib/upload/Dragger'
import { UploadFile } from 'antd/lib/upload/interface'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { generateKey } from 'fast-key-generator'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setAction, setActionModalVisibility } from '../../store/actions'
import { privateRoute, privateRoutes, publicRoutes } from '../../utils/constants'
import { configMenu, deconfigMenu } from '../../utils/menu'
import {
    errorNotification,
    successNotification,
    warningNotification
} from '../../utils/notifications'
import {
    IArticlePost,
    IArticlePut,
    IMenuBlock,
    IMenuBlockUpdate,
    IMenuElementOfTree
} from '../../utils/types'
import EditableTags from '../Users/EditableTags'
import ArticleForm from './ArticleForm'

const allowedFileTypes = [
    'text/html',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/json'
]

function ArticlesActionModal() {
    const dispatch = useDispatch()
    const token = useSelector((state: any) => state.app.token)

    const actionSuccessCallback = useSelector((state: any) => state.app.actionSuccessCallback)

    // 'Add' | 'Update'
    const action = useSelector((state: any) => state.app.action)
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)

    // Выбранные строки таблицы
    // const tableSelectedRows = useSelector((state: any) => state.app.tableSelectedRows)

    // const [fetchedArticle, setFetchedArticle] = useState()

    const [isDraggerEbabled, setIsDraggerEnabled] = useState<boolean>(true)

    const [tabs, setTabs] = useState<JSX.Element[]>([])

    const initialForms = [
        Form.useForm()[0],
        Form.useForm()[0],
        Form.useForm()[0],
        Form.useForm()[0],
        Form.useForm()[0],
        Form.useForm()[0],
        Form.useForm()[0],
        Form.useForm()[0],
        Form.useForm()[0],
        Form.useForm()[0]
    ]

    const [forms, setForms] = useState<FormInstance[]>([])

    const [fileList, setFileList] = useState<UploadFile<any>[]>([])

    const [isActionModalBtnLoading, setIsActionModalBtnLoading] = useState<boolean>(false)

    useEffect(() => {
        if (fileList.length > 10) throw 'File list should have 0 to 10 files!'
        const newTabs: JSX.Element[] = fileList.map((file, i) => (
            <Tabs.TabPane tab={file.name} key={i} forceRender={true}>
                <ArticleForm form={forms[i]} />
            </Tabs.TabPane>
        ))
        setTabs(newTabs)
    }, [fileList])

    async function onAdd(bodies: any, fileList: UploadFile<any>[]) {
        setIsActionModalBtnLoading(true)
        const requestPromises: Promise<any>[] = []

        for (let i = 0; i < fileList.length; i++) {
            const formData = new FormData()

            if (!fileList[i].originFileObj) {
                return warningNotification('Each file should have a content!')
            }

            const buffer = await fileList[i].originFileObj?.arrayBuffer()
            if (buffer) {
                formData.append('json', JSON.stringify(bodies[i]))
                formData.append('file', new Blob([buffer]), fileList[i].name)
                requestPromises.push(makeRequest(formData, bodies[i].title))
            }
        }

        Promise.all(requestPromises).then(() => {
            dispatch(setActionModalVisibility(false))
            setIsActionModalBtnLoading(false)

            actionSuccessCallback()
        })

        async function makeRequest(formData: FormData, articleTitle: string) {
            await axios(privateRoutes.ARTICLE, {
                method: 'POST',
                data: formData,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
                .then(() => {
                    successNotification(`Article '${articleTitle}' was successfully added`)
                })
                .catch((err: AxiosError) =>
                    errorNotification(
                        `Error trying to add article '${articleTitle}': ${err.message}`
                    )
                )
        }
    }

    // function fetchArticleById(id: string, form: FormInstance) {
    //     // TODO: Отправлять через query-параметры флаг, по которому бекенд определит, нужно ли возвращать файл статьи, или нет. Например: "?content=false"
    //     axios(`${publicRoutes.ARTICLE}/${id}`, {
    //         headers: {
    //             Authorization: `Bearer ${token}`
    //         }
    //     })
    //         .then((res: AxiosResponse) => {
    //             const description = res.data.result.description
    //             const menu = res.data.result.menu

    //             form.setFieldsValue({
    //                 description,
    //                 menu
    //             })

    //             setFetchedArticle(res.data.result)
    //         })
    //         .catch((err: AxiosError) => errorNotification(err.message))
    // }

    useEffect(() => {
        if (actionModalVisibility) {
            setIsDraggerEnabled(true)
            setTabs([])
            setFileList([])
            setForms([...initialForms])
            forms.forEach((form) => form.resetFields())
        }

        // if (actionModalVisibility && action === 'Update' && tableSelectedRows[0]?.id) {
        //     fetchArticleById(tableSelectedRows[0].id)
        // }
    }, [actionModalVisibility])

    function copyFileNameToTitle() {
        for (let i = 0; i < fileList.length; i++) {
            forms[i].setFieldsValue({ title: fileList[i].name.split('.')[0] })
        }
    }

    function addOkModalBtn() {
        const validationPromises: Promise<IArticlePost>[] = []

        for (let i = 0; i < fileList.length; i++) {
            validationPromises.push(forms[i].validateFields())
        }

        Promise.all(validationPromises)
            .then((valueArrays: IArticlePost[]) => {
                const actionBodies: any[] = []

                valueArrays.forEach((values) => {
                    if (!values) return
                    const actionBody: any = {}
                    if (action === 'Add' /* || (action === 'Update' && fetchedArticle)*/) {
                        for (const key in values) {
                            if (
                                //forms[i].isFieldTouched(key) &&
                                action === 'Add'
                                // ||
                                //     (action === 'Update' &&
                                //         fetchedArticle &&
                                //         (typeof fetchedArticle[key as keyof IArticlePut] ===
                                //         'object'
                                //             ? JSON.stringify(
                                //                   fetchedArticle[key as keyof IArticlePut]
                                //               ) != JSON.stringify(values[key])
                                //             : fetchedArticle[key as keyof IArticlePut] !=
                                //               values[key]))
                            ) {
                                if (key === 'publicTimestamp') {
                                    if (values['publicTimestamp'])
                                        actionBody['publicTimestamp'] = Date.parse(
                                            values['publicTimestamp'].toString()
                                        )
                                } else actionBody[key] = values[key as keyof IArticlePost]
                            }
                        }
                    }

                    if (Object.keys(actionBody).length) {
                        // onAction(actionBody)
                        if (action === 'Add') {
                            actionBodies.push(actionBody)
                        }
                    } else {
                        warningNotification(
                            action === 'Add'
                                ? 'Fill the fields!'
                                : action === 'Update'
                                ? 'No updates detected'
                                : 'Unable to perform the action'
                        )
                        return
                    }
                })

                onAdd(actionBodies, fileList)
            })
            .catch(() => {
                notification.error({
                    message: 'Validation error',
                    description: 'Invalid form data!'
                })
            })
    }

    function updateOkModalBtn() {}

    return (
        <Modal
            keyboard={false}
            centered
            visible={actionModalVisibility}
            title={`${action}`}
            okText={action}
            okButtonProps={{
                loading: isActionModalBtnLoading
            }}
            cancelText="Cancel"
            onCancel={() => {
                dispatch(setActionModalVisibility(false))

                setIsDraggerEnabled(true)
                setTabs([])
                forms.forEach((form) => form.resetFields())
            }}
            onOk={action === 'Add' ? addOkModalBtn : updateOkModalBtn}
        >
            <Tabs>{tabs}</Tabs>
            <Dragger
                key={'dragger'}
                multiple={true}
                accept={'.html,.docx,.pdf,.json'}
                maxCount={10}
                fileList={fileList}
                // disabled={!isDraggerEbabled}
                customRequest={({ onSuccess }: any) => onSuccess()}
                onChange={(info) => {
                    for (const file of info.fileList) {
                        if (file.status === 'done') {
                            if (info.file.type && !allowedFileTypes.includes(info.file.type)) {
                                warningNotification(
                                    'You should choose *.html, *.docx, *.pdf or *.json file!'
                                )
                                return
                            }
                        }
                    }
                    setFileList(info.fileList)
                }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">*.html, *.docx, *.pdf, *.json</p>
                <p className="ant-upload-hint">10 files max</p>
            </Dragger>
            <div style={{ marginTop: 20, textAlign: 'left' }}>
                <a
                    style={{ display: fileList.length ? 'block' : 'none' }}
                    onClick={copyFileNameToTitle}
                >
                    Copy file names to titles
                </a>
            </div>
        </Modal>
    )
}

export default ArticlesActionModal
