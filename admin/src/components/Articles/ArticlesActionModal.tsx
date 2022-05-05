import { InboxOutlined, WarningTwoTone } from '@ant-design/icons'
import { Modal, Form, notification, Tabs, FormInstance, Tooltip } from 'antd'
import Dragger from 'antd/lib/upload/Dragger'
import { UploadFile } from 'antd/lib/upload/interface'
import axios, { AxiosError, AxiosResponse } from 'axios'
import moment from 'moment'
import { SetStateAction, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActionModalVisibility, setTableSelectedRows } from '../../store/actions'
import { privateRoutes } from '../../utils/constants'
import {
    errorNotification,
    successNotification,
    warningNotification
} from '../../utils/notifications'
import { IAction, IArticle, IArticlePost, IArticlePut } from '../../utils/types'
import ArticleForm from './ArticleForm'

const allowedFileTypes = [
    'text/html',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'application/json'
]

function ArticlesActionModal({ selectedRowsState }: { selectedRowsState: [IArticle[], any] }) {
    const dispatch = useDispatch()
    const token = useSelector((state: any) => state.app.token)

    const actionSuccessCallback = useSelector((state: any) => state.app.actionSuccessCallback)

    // 'Add' | 'Update'
    const action = useSelector((state: any) => state.app.action)
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)

    // Выбранные строки таблицы
    // const tableSelectedRows = useSelector((state: any) => state.app.tableSelectedRows)
    const [selectedRows, setSelectedRows] = selectedRowsState

    const [warnings, setWarnings] = useState<IAction[]>([])
    useEffect(() => {
        console.log(warnings)
    }, [warnings])

    const [fetchedArticle, setFetchedArticle] = useState<IArticle>()

    // const [isDraggerEnabled, setIsDraggerEnabled] = useState<boolean>(true)

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

    const [updateForm] = useState<FormInstance>(Form.useForm()[0])

    const [fileList, setFileList] = useState<UploadFile<any>[]>([])

    const [isActionModalBtnLoading, setIsActionModalBtnLoading] = useState<boolean>(false)

    useEffect(() => {
        if (fileList.length > (action === 'Add' ? 10 : 1))
            throw 'File list should have 0 to 10 files!'
        if (action === 'Add') {
            const newTabs: JSX.Element[] = fileList.map((file, i) => (
                <Tabs.TabPane tab={file.name} key={i} forceRender={true}>
                    <ArticleForm form={forms[i]} />
                </Tabs.TabPane>
            ))
            setTabs(newTabs)
        }
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
                .then((res: AxiosResponse) => {
                    const actionId = res.data.result?.actionId
                    const msg = actionId
                        ? `Request ['${actionId}'] to add article '${articleTitle}' was successfully sent`
                        : `Article '${articleTitle}' was successfully added`
                    successNotification(msg)
                })
                .catch((err: AxiosError) =>
                    errorNotification(
                        `Error trying to add article '${articleTitle}': ${err.message}`
                    )
                )
        }
    }

    async function onUpdate(body: any, file?: UploadFile) {
        setIsActionModalBtnLoading(true)

        const formData = new FormData()

        formData.append('json', JSON.stringify(body))

        if (file) {
            if (!file.originFileObj) {
                return warningNotification('File should have a content!')
            }

            const buffer = await file.originFileObj.arrayBuffer()
            if (buffer) {
                formData.append('file', new Blob([buffer]), file.name)
            }
        }

        await makeRequest(formData, body.title)

        dispatch(setActionModalVisibility(false))
        setIsActionModalBtnLoading(false)

        actionSuccessCallback()

        async function makeRequest(formData: FormData, articleTitle: string) {
            await axios(`${privateRoutes.ARTICLE}/${selectedRows[0].id}`, {
                method: 'PUT',
                data: formData,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            })
                .then((res: AxiosResponse) => {
                    const actionId = res.data.result?.actionId
                    const msg = actionId
                        ? `Request ['${actionId}'] to update article '${articleTitle}' was successfully sent`
                        : `Article '${articleTitle}' was successfully updated`
                    successNotification(msg)
                })
                .catch((err: AxiosError) =>
                    errorNotification(
                        `Error trying to update article '${articleTitle}': ${err.message}`
                    )
                )
        }
    }

    function fetchArticleById(id: string, form: FormInstance) {
        axios(`${privateRoutes.ARTICLE}/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(async (res: AxiosResponse) => {
                const { oldId, title, description, tags, publicTimestamp } = res.data.result

                form.setFieldsValue({
                    oldId,
                    title,
                    description,
                    tags,
                    publicTimestamp: moment(publicTimestamp)
                })

                setFetchedArticle(res.data.result)
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function fetchConflictsById(id: string) {
        axios(`${privateRoutes.ACTION}/conflicts`, {
            params: {
                article_id: id
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(async (res: AxiosResponse) => {
                setWarnings(
                    res.data.result.map(
                        (conflict: IAction) => `${conflict.action.toUpperCase()} ${conflict.id}`
                    )
                )
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    useEffect(() => {
        if (actionModalVisibility) {
            // setIsDraggerEnabled(true)
            setWarnings([])
            setTabs([])
            setFileList([])
            setForms([...initialForms])
            forms.forEach((form) => form.resetFields())
        }

        if (actionModalVisibility && action === 'Update' && selectedRows[0].id) {
            fetchArticleById(selectedRows[0].id, updateForm)
            fetchConflictsById(selectedRows[0].id)
        }
    }, [actionModalVisibility])

    function copyFileNameToTitle() {
        if (action === 'Add') {
            for (let i = 0; i < fileList.length; i++) {
                forms[i].setFieldsValue({
                    title: fileList[i].name.slice(0, fileList[i].name.lastIndexOf('.'))
                })
            }
        } else {
            updateForm.setFieldsValue({
                title: fileList[0].name.slice(0, fileList[0].name.lastIndexOf('.'))
            })
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
                    if (!values) {
                        return
                    }

                    const actionBody: any = {}

                    for (const key in values) {
                        if (key === 'publicTimestamp') {
                            if (values['publicTimestamp'])
                                actionBody['publicTimestamp'] = Date.parse(
                                    values['publicTimestamp'].toString()
                                )
                        } else actionBody[key] = values[key as keyof IArticlePost]
                    }

                    if (Object.keys(actionBody).length) {
                        actionBodies.push(actionBody)
                    } else {
                        warningNotification('Fill the fields!')
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

    function updateOkModalBtn() {
        updateForm
            .validateFields()
            .then((values: IArticlePut) => {
                if (!values) {
                    return
                }

                const actionBody: any = {}

                if (action === 'Update' && fetchedArticle) {
                    for (const key in values) {
                        if (
                            action === 'Update' &&
                            fetchedArticle &&
                            (typeof fetchedArticle[key as keyof IArticlePut] === 'object'
                                ? JSON.stringify(fetchedArticle[key as keyof IArticlePut]) !=
                                  JSON.stringify(values[key as keyof IArticlePut])
                                : fetchedArticle[key as keyof IArticlePut] !=
                                  values[key as keyof IArticlePut])
                        ) {
                            if (key === 'publicTimestamp') {
                                if (values['publicTimestamp'])
                                    actionBody['publicTimestamp'] = Date.parse(
                                        values['publicTimestamp'].toString()
                                    )
                            } else actionBody[key] = values[key as keyof IArticlePut]
                        }
                    }
                }

                if (Object.keys(actionBody).length || fileList.length) {
                    onUpdate(actionBody, fileList[0] || null)
                } else {
                    warningNotification('No updates detected')
                    return
                }
            })
            .catch(() => {
                notification.error({
                    message: 'Validation error',
                    description: 'Invalid form data!'
                })
            })
    }

    return (
        <Modal
            keyboard={false}
            centered
            visible={actionModalVisibility}
            title={
                <>
                    {action}
                    {warnings.length ? (
                        <>
                            <Tooltip
                                overlayStyle={{ maxWidth: 300 }}
                                placement="top"
                                title={warnings.join('\n')}
                                color="#FFA500"
                            >
                                <WarningTwoTone
                                    twoToneColor="#FFA500"
                                    style={{ fontSize: 25, margin: '0 10px' }}
                                />
                            </Tooltip>
                            <span style={{ color: '#FFA500' }}>Conflicts found</span>
                        </>
                    ) : null}
                </>
            }
            okText={action}
            okButtonProps={{
                loading: isActionModalBtnLoading
            }}
            cancelText="Cancel"
            onCancel={() => {
                dispatch(setActionModalVisibility(false))

                // setIsDraggerEnabled(true)
                setTabs([])
                if (action === 'Add') {
                    forms.forEach((form) => form.resetFields())
                } else {
                    updateForm.resetFields()
                    setSelectedRows([])
                }
            }}
            onOk={action === 'Add' ? addOkModalBtn : updateOkModalBtn}
        >
            {action === 'Add' ? <Tabs>{tabs}</Tabs> : <ArticleForm form={updateForm} />}
            <Dragger
                key={'dragger'}
                multiple={true}
                accept={'.html,.docx,.pdf,.json'}
                maxCount={action === 'Add' ? 10 : 1}
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
                <p className="ant-upload-hint">{action === 'Add' ? '10 files' : '1 file'} max</p>
            </Dragger>
            {fileList.length ? (
                <div style={{ marginTop: 20, textAlign: 'left' }}>
                    <a onClick={copyFileNameToTitle}>
                        {action === 'Add' ? 'Copy file names to titles' : 'Copy file name to title'}
                    </a>
                </div>
            ) : null}
        </Modal>
    )
}

export default ArticlesActionModal
