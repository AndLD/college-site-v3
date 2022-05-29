import AdminLayout from '../components/AdminLayout'
import { Badge, Button, Divider, Empty, Spin, Table, Tag, Tooltip, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { privateRoutes, publicRoutes } from '../utils/constants'
import {
    ArticlesAllowedFileExtension,
    ArticleData,
    IAction,
    IColumn,
    IPreviewFile,
    NewsAllowedFileExtension,
    NewsData
} from '../utils/types'
import { errorNotification, warningNotification } from '../utils/notifications'
import { ArrowDownOutlined } from '@ant-design/icons'
import { actionsUtils } from '../utils/actions'
import { previewUtils as previewUtils } from '../utils/preview'
import { isArrayBuffer } from 'lodash'

const { Title } = Typography

function Preview() {
    const token = useSelector((state: any) => state.app.token)
    const { actionId }: { actionId: string } = useParams()
    const [action, setAction] = useState<IAction | null>()
    const [previewImage, setPreviewImage] = useState<IPreviewFile>()
    const [previewFile, setPreviewFile] = useState<IPreviewFile>()
    const [isActionMetadataLoading, setIsActionMetadataLoading] = useState<boolean>(false)
    const [isImageLoading, setIsImageLoading] = useState<boolean>(false)
    const [isFileLoading, setIsFileLoading] = useState<boolean>(false)
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
            // TODO: Combine downloading file & image into one request
            fetchActionFile(actionId, {
                [actionId + '_pending']: [
                    action?.payload?.data?.docx || action?.payload?.data?.html ? 'html' : 'pdf'
                ]
            })
            if (action.entity === 'news') {
                fetchActionFile(actionId, {
                    [actionId + '_pending']: ['png']
                })
            }
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

    function fetchActionFile(
        actionId: string,
        options: {
            [key: string]: (ArticlesAllowedFileExtension | NewsAllowedFileExtension)[]
        }
    ) {
        const requestedExt = Object.values(options)[0]

        if (requestedExt.includes('html') || requestedExt.includes('pdf')) {
            setIsFileLoading(true)
        } else if (requestedExt.includes('png')) {
            setIsImageLoading(true)
        }

        const route = action?.entity === 'articles' ? privateRoutes.ARTICLE : privateRoutes.NEWS

        axios(`${route}/download`, {
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

                if (ext !== 'html' && ext !== 'pdf' && ext !== 'png') {
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
                            base64,
                            ext
                        })
                    })
                } else if (ext === 'png') {
                    previewUtils.blobToBase64(data).then((base64) => {
                        setPreviewImage({
                            name,
                            base64,
                            ext
                        })
                    })
                }
            })
            .catch((err: AxiosError) => {
                if (err.message === 'Request failed with status code 404') {
                    return
                }

                errorNotification(err.message)
            })
            .finally(() => {
                if (requestedExt.includes('html') || requestedExt.includes('pdf')) {
                    setIsFileLoading(false)
                } else if (requestedExt.includes('png')) {
                    setIsImageLoading(false)
                }
            })
    }

    function downloadActionFiles(actionId: string) {
        if (!previewFile || !action) {
            return
        }

        if (action.entity === 'articles' && previewFile.ext === 'pdf' && previewFile.objectUrl) {
            previewUtils.showDownloadDialog(`${previewFile.name}.pdf`, previewFile.objectUrl)
            return
        }

        setIsDownloadBtnLoading(true)
        const options: {
            [key: string]: (ArticlesAllowedFileExtension | NewsAllowedFileExtension)[]
        } = {
            [actionId + '_pending']: []
        }

        for (const key in action.payload?.data as ArticleData | NewsData) {
            if (key === 'png') {
                continue
            }

            if (action.payload?.data[key] === true) {
                options[actionId + '_pending'].push(
                    key as ArticlesAllowedFileExtension | NewsAllowedFileExtension
                )
            }
        }

        const route = action.entity === 'articles' ? privateRoutes.ARTICLE : privateRoutes.NEWS

        axios(`${route}/download`, {
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
                Preview of {action?.entity === 'articles' ? 'article' : 'news'}
                {isFileLoading || isImageLoading ? (
                    <Spin style={{ marginLeft: 20 }} size="large" />
                ) : null}
            </Title>
            <span>{`Action [${actionId}]`}</span>
            <Tooltip title="Download">
                <Button
                    style={{ margin: '0 0 15px 10px' }}
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
            {action?.entity === 'news' ? (
                <>
                    <Tooltip title="Main Image">
                        {previewImage ? (
                            <div
                                style={{
                                    textAlign: 'center'
                                }}
                            >
                                <img
                                    src={'data:image/png;base64,' + previewImage.base64}
                                    alt="Preview news main image"
                                    style={{ height: '40vh' }}
                                />
                            </div>
                        ) : (
                            <Empty />
                        )}
                    </Tooltip>
                    <Divider />
                </>
            ) : null}
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
