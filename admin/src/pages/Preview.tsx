import AdminLayout from '../components/AdminLayout'
import { Badge, Button, Divider, Spin, Table, Tag, Tooltip, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { privateRoutes } from '../utils/constants'
import { AllowedFileExtension, ArticleData, IAction, IColumn, IPreviewFile } from '../utils/types'
import { errorNotification } from '../utils/notifications'
import { ArrowDownOutlined } from '@ant-design/icons'

const { Title } = Typography

function Preview() {
    const token = useSelector((state: any) => state.app.token)

    const { actionId }: { actionId: string } = useParams()

    const [action, setAction] = useState<IAction | null>()

    const [previewFile, setPreviewFile] = useState<IPreviewFile>()

    const [isActionMetadataLoading, setIsActionMetadataLoading] = useState<boolean>(false)
    const [isDownloadBtnLoading, setIsDownloadBtnLoading] = useState<boolean>(false)

    useEffect(() => {
        document.title = 'Admin Preview'

        const actionFromLocalStorageJson = localStorage.getItem('prewiewAction')
        const actionFromLocalStorage =
            actionFromLocalStorageJson && JSON.parse(actionFromLocalStorageJson)

        if (!actionFromLocalStorage || actionFromLocalStorage.id !== actionId) {
            fetchActionMetadata(actionId)
        } else {
            setAction(actionFromLocalStorage)
        }
    }, [])

    useEffect(() => {
        if (action) {
            fetchActionFile(actionId)
        }
    }, [action])

    function fetchActionMetadata(actionId: string) {
        setIsActionMetadataLoading(true)
        axios(`${privateRoutes.ACTION}/${actionId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                setAction(res.data.result)
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => setIsActionMetadataLoading(false))
    }

    function fetchActionFile(actionId: string) {
        const options: {
            [key: string]: AllowedFileExtension[]
        } = {
            [actionId + '_pending']: [
                action?.payload?.data?.docx || action?.payload?.data?.html ? 'html' : 'pdf'
            ]
        }

        axios(`${privateRoutes.ARTICLE}/download`, {
            params: {
                ids: actionId + '_pending'
            },
            headers: {
                Authorization: `Bearer ${token}`,
                'download-options': JSON.stringify(options)
            },
            responseType: 'blob'
        })
            .then((res: AxiosResponse) => {
                const contentDisposition = res.headers['content-disposition']

                if (!contentDisposition) {
                    throw new Error('"content-disposition" response header missed')
                }

                const data = new Blob([res.data])
                const filename: string = contentDisposition
                    .split('filename=')[1]
                    .replaceAll('"', '')

                const name = filename.slice(0, filename.lastIndexOf('.'))
                const ext = filename.slice(filename.lastIndexOf('.') + 1)

                if (ext !== 'html' && ext !== 'pdf') {
                    throw new Error(`Unsupported "${ext}" file obtained`)
                }

                if (ext === 'html') {
                    data.text().then((htmlString: string) => {
                        setPreviewFile({
                            name,
                            htmlString,
                            ext
                        })
                    })
                    // TODO: Remove "return"?
                    return
                } else if (ext === 'pdf') {
                    blobToBase64(data).then((base64) => {
                        setPreviewFile({
                            name,
                            objectUrl: window.URL.createObjectURL(data),
                            base64: (base64 as string).split('base64,')[1],
                            ext
                        })
                    })
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function blobToBase64(blob: Blob) {
        return new Promise((resolve, _) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(blob)
        })
    }

    function showDownloadDialog(filename: string, objectUrl: string) {
        const url = objectUrl
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
    }

    function downloadActionFiles(actionId: string) {
        if (!previewFile) {
            return
        }

        if (previewFile.ext === 'pdf' && previewFile.objectUrl) {
            showDownloadDialog(`${previewFile.name}.${previewFile.ext}`, previewFile.objectUrl)
            return
        }

        setIsDownloadBtnLoading(true)

        const options: { [key: string]: AllowedFileExtension[] } = {
            [actionId + '_pending']: ['docx', 'html']
        }

        axios(`${privateRoutes.ARTICLE}/download`, {
            params: {
                ids: actionId + '_pending'
            },
            headers: {
                Authorization: `Bearer ${token}`,
                'download-options': JSON.stringify(options)
            },
            responseType: 'blob'
        })
            .then((res: AxiosResponse) => {
                const contentDisposition = res.headers['content-disposition']

                if (!contentDisposition) {
                    throw new Error('"content-disposition" response header missed')
                }

                const filename = contentDisposition.split('filename=')[1].replaceAll('"', '')

                const data = new Blob([res.data])

                showDownloadDialog(filename, window.URL.createObjectURL(data))
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => setIsDownloadBtnLoading(false))
    }

    // TODO: move method to utils (this is "expandedRowRender" method from pages/Actions.tsx)
    const getActionPayloadTable = ({
        payload,
        payloadIds
    }: {
        payload: { [key: string]: any }
        payloadIds: string[]
    }) => {
        const columns: IColumn[] = []

        for (const key in payload) {
            const column: IColumn = {
                title: key[0].toUpperCase() + key.slice(1),
                dataIndex: key
            }

            if (key === 'tags') {
                column.render = (tags: string[]) =>
                    tags.map((tag: string, index) => <Tag key={'tag' + index}>{tag}</Tag>)
            }
            if (key.toLowerCase().includes('timestamp')) {
                column.render = (value: number) => value && new Date(value).toLocaleString()
            } else if (key === 'data') {
                column.width = 100
                // TODO: Take function representating the ArticleData to utils because it dublicates lots of times among the project
                column.render = (data?: ArticleData) => {
                    if (data)
                        return (
                            <div>
                                <div>
                                    <Badge color={data.html ? 'green' : 'red'} /> html
                                </div>
                                <div>
                                    <Badge color={data.docx ? 'green' : 'red'} /> docx
                                </div>
                                <div>
                                    <Badge color={data.pdf ? 'green' : 'red'} /> pdf
                                </div>
                                <div>
                                    <Badge color={data.json ? 'green' : 'red'} /> json
                                </div>
                            </div>
                        )
                }
            }

            columns.push(column)
        }

        if (payloadIds.length) {
            const column: IColumn = {
                title: 'ID' + (payloadIds.length > 1 ? 's' : ''),
                dataIndex: 'payloadIds',
                render: (payloadIds: string[]) => {
                    return payloadIds.map((payloadId, index) => (
                        <Tag key={'payloadId' + index}>{payloadId}</Tag>
                    ))
                }
            }

            columns.push(column)
        }

        columns.sort((a, b) => {
            if (a.title > b.title) return 1
            return -1
        })

        const data = [{ ...payload, payloadIds }]

        return (
            <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                rowKey={() => Date.now()}
                loading={isActionMetadataLoading}
                bordered
                style={{ marginTop: 15 }}
            />
        )
    }

    return (
        <AdminLayout currentPage={`preview/${actionId}`}>
            <Title level={1}>
                Preview
                {previewFile ? null : <Spin style={{ marginLeft: 20 }} size="large" />}
            </Title>
            <span>{`Action [${actionId}]`}</span>
            <Tooltip title="Download">
                <Button
                    style={{ margin: '0 0 0 10px' }}
                    type="primary"
                    disabled={!previewFile}
                    loading={isDownloadBtnLoading}
                    icon={<ArrowDownOutlined />}
                    onClick={() => downloadActionFiles(actionId)}
                ></Button>
            </Tooltip>
            {action
                ? getActionPayloadTable({
                      payload: action.payload,
                      payloadIds: action.payloadIds
                  })
                : null}
            <Divider />
            {previewFile ? (
                <div>
                    {previewFile.ext === 'html' && previewFile.htmlString ? (
                        <div dangerouslySetInnerHTML={{ __html: previewFile.htmlString }}></div>
                    ) : previewFile.ext === 'pdf' && previewFile.base64 ? (
                        <iframe
                            width="100%"
                            style={{ height: '90vh' }}
                            src={'data:application/pdf;base64,' + previewFile.base64}
                        ></iframe>
                    ) : (
                        'Something went wrong'
                    )}
                </div>
            ) : null}
        </AdminLayout>
    )
}

export default Preview
