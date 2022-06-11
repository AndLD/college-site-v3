import { Typography } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { INews, NewsAllowedFileExtension } from '../utils/types'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification } from '../utils/notifications'
import { NewsContext } from '../contexts'
import NewsSearch from '../components/News/NewsSearch'
import NewsTableControls from '../components/News/NewsTableControls'
import NewsTable from '../components/News/NewsTable'
import NewsActionModal from '../components/News/NewsActionModal'

const { Title } = Typography

function News() {
    const token = useSelector((state: any) => state.app.token)
    const [tableData, setTableData] = useState<INews[]>([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20
    })
    const [isTableLoading, setIsTableLoading] = useState<boolean>(false)
    const [isDownloadBtnLoading, setIsDownloadBtnLoading] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState<string>()
    const [selectedRows, setSelectedRows] = useState([])
    const [isDeleteBtnLoading, setIsDeleteBtnLoading] = useState<boolean>(false)
    const [pinnedNewsIds, setPinnedNewsIds] = useState<string[]>([])

    useEffect(() => {
        document.title = 'Admin News'

        fetchNews(pagination, undefined, 'publicTimestamp,desc')
    }, [])

    function fetchNews(pagination: any, filters?: string, order?: string) {
        setIsTableLoading(true)
        axios(privateRoutes.NEWS, {
            params: {
                page: pagination.current,
                results: pagination.pageSize,
                filters,
                order
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                if (!res.data.meta?.pagination) throw new Error('No pagination obtained')

                setTableData(res.data.result)
                setIsTableLoading(false)
                setPagination({
                    ...pagination,
                    total: res.data.meta.pagination.total
                })
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => {
                setIsTableLoading(false)
            })
    }

    function deleteNews() {
        setIsDeleteBtnLoading(true)
        axios(privateRoutes.NEWS, {
            method: 'DELETE',
            params: {
                ids: selectedRows.map((elem: any) => elem.id).toString()
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                const actionId = res.data.result?.actionId
                const msg = actionId
                    ? `Request ['${actionId}'] to delete news ('${selectedRows.length}') was successfully sent`
                    : `News ('${selectedRows.length}') was successfully deleted`
                successNotification(msg)

                if (!actionId) {
                    fetchNews(pagination, undefined, 'publicTimestamp,desc')
                }

                setSelectedRows([])
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => {
                setIsDeleteBtnLoading(false)
            })
    }

    function downloadNews() {
        setIsDownloadBtnLoading(true)

        const options: {
            [key: string]: NewsAllowedFileExtension[]
        } = {}
        const ids = selectedRows
            .map((elem: any) => {
                if (elem.data.docx) {
                    options[elem.id] = ['docx']
                } else if (!elem.data.docx && elem.data.html) {
                    options[elem.id] = ['html']
                }

                if (elem.data.png) {
                    options[elem.id].push('png')
                }

                return elem.id
            })
            .toString()

        axios(`${privateRoutes.NEWS}/download`, {
            params: {
                ids
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

                const url = window.URL.createObjectURL(new Blob([res.data]))
                const link = document.createElement('a')
                link.href = url
                link.setAttribute(
                    'download',
                    contentDisposition.split('filename=')[1].replaceAll('"', '')
                )
                document.body.appendChild(link)
                link.click()

                setSelectedRows([])
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => setIsDownloadBtnLoading(false))
    }

    return (
        <AdminLayout currentPage="News">
            <NewsActionModal selectedRowsState={[selectedRows, setSelectedRows]} />
            <Title level={1}>News</Title>
            <NewsContext.Provider
                value={{
                    tableDataState: [tableData, setTableData],
                    isTableLoadingState: [isTableLoading, setIsTableLoading],
                    isDeleteBtnLoadingState: [isDeleteBtnLoading, setIsDeleteBtnLoading],
                    isDownloadBtnLoadingState: [isDownloadBtnLoading, setIsDownloadBtnLoading],
                    paginationState: [pagination, setPagination],
                    selectedRowsState: [selectedRows, setSelectedRows],
                    searchValueState: [searchValue, setSearchValue],
                    pinnedNewsIdsState: [pinnedNewsIds, setPinnedNewsIds],
                    fetchNews,
                    deleteNews,
                    downloadNews
                }}
            >
                <div style={{ display: 'flex' }}>
                    <NewsSearch />
                    <NewsTableControls />
                </div>
                <NewsTable />
            </NewsContext.Provider>
        </AdminLayout>
    )
}

export default News
