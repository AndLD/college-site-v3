import { InboxOutlined, WarningTwoTone } from '@ant-design/icons'
import { Modal, Form, notification, Tabs, FormInstance, Tooltip } from 'antd'
import Dragger from 'antd/lib/upload/Dragger'
import { UploadFile, RcFile } from 'antd/lib/upload/interface'
import axios, { AxiosError, AxiosResponse } from 'axios'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActionModalVisibility } from '../../store/actions'
import { privateRoutes } from '../../utils/constants'
import {
    errorNotification,
    successNotification,
    warningNotification
} from '../../utils/notifications'
import { IAction, INews, INewsPost, INewsPut } from '../../utils/types'
import NewsForm from './NewsForm'

const allowedFileTypes = {
    html: 'text/html',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    png: 'image/png'
}

// interface UploadFileWithBuffer extends RcFile {
//     arrayBuffer?: ArrayBuffer
// }

function NewsActionModal({ selectedRowsState }: { selectedRowsState: [INews[], any] }) {
    const dispatch = useDispatch()
    const token = useSelector((state: any) => state.app.token)
    const actionSuccessCallback = useSelector((state: any) => state.app.actionSuccessCallback)
    // 'Add' | 'Update'
    const action = useSelector((state: any) => state.app.action)
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)
    const [selectedRows, setSelectedRows] = selectedRowsState
    const [warnings, setWarnings] = useState<IAction[]>([])
    const [fetchedNews, setFetchedNews] = useState<INews>()
    // const [isDraggerEnabled, setIsDraggerEnabled] = useState<boolean>(true)
    const [addForm, setAddForm] = useState<FormInstance>(Form.useForm()[0])
    const [updateForm] = useState<FormInstance>(Form.useForm()[0])
    const [fileList, setFileList] = useState<RcFile[]>([])
    const [isActionModalBtnLoading, setIsActionModalBtnLoading] = useState<boolean>(false)

    useEffect(() => {
        if (actionModalVisibility) {
            // setIsDraggerEnabled(true)
            setWarnings([])
            setFileList([])
            addForm.resetFields()
        }

        if (actionModalVisibility && action === 'Update' && selectedRows[0].id) {
            fetchNewsById(selectedRows[0].id, updateForm)
            fetchConflictsById(selectedRows[0].id)
        }
    }, [actionModalVisibility])

    async function onAdd(body: any) {
        const file: RcFile | undefined = getNewsFileFromList()
        const image: RcFile | undefined = getNewsImageFromList()

        const formData = new FormData()

        formData.append('json', JSON.stringify(body))

        if (!file) {
            return errorNotification('File not found!')
        }

        let buffer = await file.arrayBuffer()
        if (buffer) {
            formData.append('file', new Blob([buffer]), file.name)
        }

        if (image) {
            buffer = await image.arrayBuffer()
            if (buffer) {
                formData.append('image', new Blob([buffer]), image.name)
            }
        }

        await makeRequest(formData, body.title)

        dispatch(setActionModalVisibility(false))
        setIsActionModalBtnLoading(false)

        actionSuccessCallback()

        async function makeRequest(formData: FormData, newsTitle: string) {
            setIsActionModalBtnLoading(true)
            await axios(privateRoutes.NEWS, {
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
                        ? `Request ['${actionId}'] to add news '${newsTitle}' was successfully sent`
                        : `News '${newsTitle}' was successfully added`
                    successNotification(msg)
                })
                .catch((err: AxiosError) =>
                    errorNotification(`Error trying to add news '${newsTitle}': ${err.message}`)
                )
                .finally(() => setIsActionModalBtnLoading(false))
        }
    }

    async function onUpdate(body: any) {
        const file: RcFile | undefined = getNewsFileFromList()
        const image: RcFile | undefined = getNewsImageFromList()

        setIsActionModalBtnLoading(true)

        const formData = new FormData()

        formData.append('json', JSON.stringify(body))

        if (file) {
            const buffer = await file.arrayBuffer()
            if (buffer) {
                formData.append('file', new Blob([buffer]), file.name)
            }
        }

        if (image) {
            const buffer = await image.arrayBuffer()
            if (buffer) {
                formData.append('image', new Blob([buffer]), image.name)
            }
        }

        await makeRequest(formData, body.title)

        dispatch(setActionModalVisibility(false))
        setIsActionModalBtnLoading(false)

        actionSuccessCallback()

        async function makeRequest(formData: FormData, newsTitle?: string) {
            await axios(`${privateRoutes.NEWS}/${selectedRows[0].id}`, {
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
                        ? `Request ['${actionId}'] to update news ['${
                              newsTitle || selectedRows[0].id
                          }'] was successfully sent`
                        : `News ['${newsTitle || selectedRows[0].id}'] was successfully updated`
                    successNotification(msg)
                })
                .catch((err: AxiosError) =>
                    errorNotification(`Error trying to update news '${newsTitle}': ${err.message}`)
                )
        }
    }

    function fetchNewsById(id: string, form: FormInstance) {
        axios(`${privateRoutes.NEWS}/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                const { oldId, title, description, tags, publicTimestamp, inlineMainImage } =
                    res.data.result

                form.setFieldsValue({
                    oldId,
                    title,
                    description,
                    tags,
                    publicTimestamp: moment(publicTimestamp),
                    inlineMainImage
                })

                setFetchedNews(res.data.result)
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function fetchConflictsById(id: string) {
        axios(`${privateRoutes.ACTION}/conflicts`, {
            params: {
                news_id: id
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                setWarnings(
                    res.data.result.map(
                        (conflict: IAction) => `${conflict.action.toUpperCase()} ${conflict.id}`
                    )
                )
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function getNewsFileFromList() {
        for (const file of fileList) {
            const splitted = file.name.split('.')
            const ext = splitted[splitted.length - 1]

            if (ext === 'docx' || ext === 'html') {
                return file
            }
        }
    }

    function getNewsImageFromList() {
        for (const file of fileList) {
            const splitted = file.name.split('.')
            const ext = splitted[splitted.length - 1]

            if (ext === 'png') {
                return file
            }
        }
    }

    function copyFileNameToTitle() {
        const file: UploadFile<any> | undefined = getNewsFileFromList()

        if (!file) {
            return
        }

        if (action === 'Add') {
            addForm.setFieldsValue({
                title: file.name.slice(0, file.name.lastIndexOf('.'))
            })
        } else {
            updateForm.setFieldsValue({
                title: file.name.slice(0, file.name.lastIndexOf('.'))
            })
        }
    }

    function addOkModalBtn() {
        addForm
            .validateFields()
            .then((values: INewsPost) => {
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
                    } else if (values[key as keyof INewsPost]) {
                        actionBody[key] = values[key as keyof INewsPost]
                    }
                }

                if (Object.keys(actionBody).length) {
                    onAdd(actionBody)
                    return
                }

                warningNotification('Fill the fields!')
                return
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
            .then((values: INewsPut) => {
                if (!values) {
                    return
                }

                const actionBody: any = {}

                if (action === 'Update' && fetchedNews) {
                    for (const key in values) {
                        if (
                            action === 'Update' &&
                            fetchedNews &&
                            (typeof fetchedNews[key as keyof INewsPut] === 'object'
                                ? JSON.stringify(fetchedNews[key as keyof INewsPut]) !=
                                  JSON.stringify(values[key as keyof INewsPut])
                                : fetchedNews[key as keyof INewsPut] !=
                                  values[key as keyof INewsPut])
                        ) {
                            if (key === 'publicTimestamp') {
                                if (values['publicTimestamp'])
                                    actionBody['publicTimestamp'] = Date.parse(
                                        values['publicTimestamp'].toString()
                                    )
                            } else actionBody[key] = values[key as keyof INewsPut]
                        }
                    }
                }

                if (Object.keys(actionBody).length || fileList.length) {
                    onUpdate(actionBody)
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
                if (action === 'Add') {
                    addForm.resetFields()
                } else {
                    updateForm.resetFields()
                    setSelectedRows([])
                }
            }}
            onOk={action === 'Add' ? addOkModalBtn : updateOkModalBtn}
        >
            <NewsForm form={action === 'Add' ? addForm : updateForm} />
            <Dragger
                key={'dragger'}
                multiple={true}
                accept={'.html,.docx,.png'}
                maxCount={2}
                fileList={fileList}
                // disabled={!isDraggerEbabled}
                beforeUpload={async (file, currentFileList) => {
                    if (currentFileList.length < fileList.length) {
                        setFileList(currentFileList)
                        return false
                    }

                    if (file.type && !Object.values(allowedFileTypes).includes(file.type)) {
                        warningNotification('You should choose *.html, *.docx or *.png file!')
                        return false
                    }

                    const fileTypes = fileList.map((file) => file.type)

                    if (
                        fileTypes.includes(file.type) ||
                        (file.type === allowedFileTypes.docx &&
                            fileTypes.includes(allowedFileTypes.html)) ||
                        (file.type === allowedFileTypes.html &&
                            fileTypes.includes(allowedFileTypes.docx))
                    ) {
                        warningNotification(
                            'You should choose no more than one document and one image'
                        )
                        return false
                    }

                    setFileList([...fileList, file])

                    return false
                }}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">*.html, *.docx, *.png</p>
                <p className="ant-upload-hint">2 files max</p>
            </Dragger>
            {fileList.length ? (
                <div style={{ marginTop: 20, textAlign: 'left' }}>
                    <a onClick={copyFileNameToTitle}>Copy file name to title</a>
                </div>
            ) : null}
        </Modal>
    )
}

export default NewsActionModal
