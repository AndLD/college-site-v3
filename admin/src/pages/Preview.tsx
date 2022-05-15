import AdminLayout from '../components/AdminLayout'
import { Badge, Button, Divider, Spin, Table, Tag, Tooltip, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { privateRoutes } from '../utils/constants'
import {
    ArticlesAllowedFileExtension,
    ArticleData,
    IAction,
    IColumn,
    IPreviewFile
} from '../utils/types'
import { errorNotification } from '../utils/notifications'
import { ArrowDownOutlined } from '@ant-design/icons'
import { actionsUtils } from '../utils/actions'
import { previewUtils as previewUtils } from '../utils/preview'

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

        const actionFromLocalStorageJson = localStorage.getItem('previewAction')
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
            [key: string]: ArticlesAllowedFileExtension[]
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
                } else if (ext === 'pdf') {
                    previewUtils.blobToBase64(data).then((base64) => {
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

    function downloadActionFiles(actionId: string) {
        if (!previewFile) {
            return
        }

        if (previewFile.ext === 'pdf' && previewFile.objectUrl) {
            previewUtils.showDownloadDialog(
                `${previewFile.name}.${previewFile.ext}`,
                previewFile.objectUrl
            )
            return
        }

        setIsDownloadBtnLoading(true)
        const options: { [key: string]: ArticlesAllowedFileExtension[] } = {
            [actionId + '_pending']:
                (!action?.payload?.data?.docx && action?.payload?.data?.html) ||
                action?.payload?.data?.html
                    ? ['html']
                    : ['docx', 'html']
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

                previewUtils.showDownloadDialog(filename, window.URL.createObjectURL(data))
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => setIsDownloadBtnLoading(false))
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
                ? actionsUtils.getActionPayloadTable(
                      {
                          payload: action.payload,
                          payloadIds: action.payloadIds
                      },
                      action.entity
                  )
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
