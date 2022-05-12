import { Typography } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification } from '../utils/notifications'
import { AllowedFileExtension, IArticle } from '../utils/types'
import ArticlesTableControls from '../components/Articles/ArticlesTableControls'
import ArticlesActionModal from '../components/Articles/ArticlesActionModal'
import { ArticlesContext } from '../contexts'
import ArticlesTable from '../components/Articles/ArticlesTable'
import ArticlesSearch from '../components/Articles/ArticlesSearch'

const { Title } = Typography

function Articles() {
    const token = useSelector((state: any) => state.app.token)

    const [tableData, setTableData] = useState<IArticle[]>([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20
    })
    const [isTableLoading, setIsTableLoading] = useState<boolean>(false)
    const [isDownloadBtnLoading, setIsDownloadBtnLoading] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState<string>()
    const [selectedRows, setSelectedRows] = useState([])
    const [isDeleteBtnLoading, setIsDeleteBtnLoading] = useState<boolean>(false)

    useEffect(() => {
        document.title = 'Admin Articles'

        fetchArticles(pagination)
    }, [])

    function fetchArticles(pagination: any, filters?: string, order?: string) {
        setIsTableLoading(true)
        axios(privateRoutes.ARTICLE, {
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

    function deleteArticles() {
        setIsDeleteBtnLoading(true)
        axios(privateRoutes.ARTICLE, {
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
                    ? `Request ['${actionId}'] to delete articles ('${selectedRows.length}') was successfully sent`
                    : `Articles ('${selectedRows.length}') was successfully deleted`
                successNotification(msg)

                if (!actionId) {
                    fetchArticles(pagination)
                }

                setSelectedRows([])
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => {
                setIsDeleteBtnLoading(false)
            })
    }

    function downloadArticles() {
        setIsDownloadBtnLoading(true)

        const options: {
            [key: string]: AllowedFileExtension[]
        } = {}
        const ids = selectedRows
            .map((elem: any) => {
                if (elem.data.docx) {
                    options[elem.id] = ['docx']
                } else if (!elem.data.docx && elem.data.html) {
                    options[elem.id] = ['html']
                } else if (elem.data.pdf) {
                    options[elem.id] = ['pdf']
                }
                return elem.id
            })
            .toString()

        axios(`${privateRoutes.ARTICLE}/download`, {
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
        <AdminLayout currentPage="Articles">
            <ArticlesActionModal selectedRowsState={[selectedRows, setSelectedRows]} />
            <Title level={1}>Articles</Title>
            <ArticlesContext.Provider
                value={{
                    tableDataState: [tableData, setTableData],
                    isTableLoadingState: [isTableLoading, setIsTableLoading],
                    isDeleteBtnLoadingState: [isDeleteBtnLoading, setIsDeleteBtnLoading],
                    isDownloadBtnLoadingState: [isDownloadBtnLoading, setIsDownloadBtnLoading],
                    paginationState: [pagination, setPagination],
                    selectedRowsState: [selectedRows, setSelectedRows],
                    searchValueState: [searchValue, setSearchValue],
                    fetchArticles,
                    deleteArticles,
                    downloadArticles
                }}
            >
                <div style={{ display: 'flex' }}>
                    <ArticlesSearch />
                    <ArticlesTableControls />
                </div>
                <ArticlesTable />
            </ArticlesContext.Provider>
        </AdminLayout>
    )
}

export default Articles
