import AdminLayout from '../components/AdminLayout'
import { Button, Divider, Spin, Tooltip, Typography } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { privateRoutes } from '../utils/constants'
import { AllowedFileExtension, IAction, IPreviewFile } from '../utils/types'
import { errorNotification } from '../utils/notifications'
import { ArrowDownOutlined } from '@ant-design/icons'

const { Title } = Typography

function useQuery() {
    const { search } = useLocation()

    // TODO: Find parameter "action" among array of all parameters, not from the first parameter

    if (!search.includes('?action=')) {
        return null
    }

    const action: IAction = JSON.parse(search.split('?action=')[1].split('&')[0])

    return action
}

function Preview() {
    const token = useSelector((state: any) => state.app.token)

    const { actionId }: { actionId: string } = useParams()

    const [action, setAction] = useState<IAction | null>(useQuery())

    const [previewFile, setPreviewFile] = useState<IPreviewFile>()

    const [isDownloadBtnLoading, setIsDownloadBtnLoading] = useState<boolean>(false)

    useEffect(() => {
        document.title = 'Admin Preview'

        fetchActionFile(actionId)
    }, [])

    function fetchActionFile(actionId: string) {
        const options: {
            [key: string]: [
                AllowedFileExtension,
                AllowedFileExtension?,
                AllowedFileExtension?,
                AllowedFileExtension?
            ]
        } = {
            [actionId + '_pending']: ['html', 'pdf']
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

        // TODO: Download only missed file types
        // const options: {
        //     [key: string]: [
        //         AllowedFileExtension,
        //         AllowedFileExtension?,
        //         AllowedFileExtension?,
        //         AllowedFileExtension?
        //     ]
        // } = {
        //     [actionId + '_pending']: []
        // }

        setIsDownloadBtnLoading(true)

        axios(`${privateRoutes.ARTICLE}/download`, {
            params: {
                ids: actionId + '_pending'
            },
            headers: {
                Authorization: `Bearer ${token}`
                // 'download-options': JSON.stringify(options)
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

    return (
        <AdminLayout currentPage={`preview/${actionId}`}>
            <Title level={1}>
                Preview
                {previewFile ? null : <Spin style={{ marginLeft: 20 }} size="large" />}
            </Title>
            {action ? (
                <div>
                    <div>Action [{action.id}]</div>
                    {Object.keys(action.payload).map((key) => (
                        <div>{key[0] + key.slice(1)}</div>
                    ))}
                </div>
            ) : null}
            <Tooltip title="Download">
                <Button
                    style={{ margin: '0 0 0 0px' }}
                    type="primary"
                    disabled={!previewFile}
                    loading={isDownloadBtnLoading}
                    icon={<ArrowDownOutlined />}
                    // loading={}
                    onClick={() => downloadActionFiles(actionId)}
                ></Button>
            </Tooltip>
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
