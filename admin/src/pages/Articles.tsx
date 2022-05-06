import { Badge, Table, TablePaginationConfig, Typography } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import Search from 'antd/lib/input/Search'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification } from '../utils/notifications'
import { AllowedFileExtension, ArticleData, IArticle } from '../utils/types'
import Tags from '../components/Users/Tags'
import ArticlesTableControls from '../components/Articles/ArticlesTableControls'
import ArticlesActionModal from '../components/Articles/ArticlesActionModal'

const { Title } = Typography

function Articles() {
    const token = useSelector((state: any) => state.app.token)

    // const testTableData = [
    //     {
    //         // id: generateKey({}),
    //         oldId: 1524,
    //         title: 'Напрямки діяльності центру сприяння працевлаштування курсантів (студентів) і випускників',
    //         description: 'Test description of very long article',
    //         tags: ['library', 'ksm', 'pod_ta_pz'],
    //         data: {
    //             html: true
    //         },
    //         publicTimestamp: 1645904921981,
    //         timestamp: 1645904921981,
    //         lastUpdateTimestamp: 1645904921981
    //     },
    //     {
    //         // id: generateKey({}),
    //         oldId: 1525,
    //         title: 'Атестація',
    //         description: 'Test description of very long article',
    //         tags: ['library', 'ksm', 'pod_ta_pz'],
    //         data: {
    //             html: true
    //         },
    //         publicTimestamp: 1645904921981,
    //         timestamp: 1645904921981,
    //         lastUpdateTimestamp: 1645904921981
    //     },
    //     {
    //         // id: generateKey({}),
    //         oldId: 1526,
    //         title: 'Нормативно-правова база навчально-виробничого відділу',
    //         description: 'Test description of very long article',
    //         tags: ['library', 'ksm', 'pod_ta_pz'],
    //         data: {
    //             html: true
    //         },
    //         publicTimestamp: 1645904921981,
    //         timestamp: 1645904921981,
    //         lastUpdateTimestamp: 1645904921981
    //     }
    // ]

    const [tableData, setTableData] = useState<IArticle[]>([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20
    })
    const [isTableLoading, setIsTableLoading] = useState<boolean>(false)

    const [searchValue, setSearchValue] = useState<string>()
    const [filteredValue, setFilteredValue] = useState<any>()

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
        const options: {
            [key: string]: [
                AllowedFileExtension,
                AllowedFileExtension?,
                AllowedFileExtension?,
                AllowedFileExtension?
            ]
        } = {}
        const ids = selectedRows
            .map((elem: any) => {
                if (elem.data.docx === true) {
                    options[elem.id] = ['docx']
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
    }

    return (
        <AdminLayout currentPage="Articles">
            <ArticlesActionModal selectedRowsState={[selectedRows, setSelectedRows]} />
            <Title level={1}>Articles</Title>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: 1 }}>
                    <Search
                        style={{ marginBottom: 20 }}
                        placeholder="Search by title"
                        loading={isTableLoading}
                        value={searchValue}
                        onChange={(event) => {
                            const text = event.target.value
                            setSearchValue(text)
                            setFilteredValue(null)
                            fetchArticles(
                                pagination,
                                text ? `keywords,contains,${text.toLowerCase()}` : undefined
                            )
                        }}
                        enterButton
                    />
                </div>
                <ArticlesTableControls
                    selectedRows={selectedRows}
                    deleteArticles={deleteArticles}
                    isDeleteBtnLoading={isDeleteBtnLoading}
                    actionSuccessCallback={() => {
                        fetchArticles(pagination)
                        setSelectedRows([])
                    }}
                    downloadArticles={downloadArticles}
                />
            </div>
            <Table
                dataSource={tableData}
                columns={[
                    {
                        title: 'Title',
                        dataIndex: 'title',
                        // width: 450,
                        fixed: 'left'
                    },
                    {
                        title: 'Tags',
                        dataIndex: 'tags',
                        width: 200,
                        render: (tags: string[], row: any) => {
                            tags = tags || []
                            return (
                                <Tags
                                    tags={tags}
                                    // onSave={(tags: string[]) => updateArticle(row.id, { tags })}
                                />
                            )
                        },
                        fixed: 'left'
                    },

                    {
                        title: 'Description',
                        dataIndex: 'description',
                        width: 300
                    },
                    {
                        title: 'ID',
                        dataIndex: 'id',
                        width: 200
                    },
                    {
                        title: 'Old ID',
                        dataIndex: 'oldId',
                        width: 90
                    },
                    {
                        title: 'Public timestamp',
                        dataIndex: 'publicTimestamp',
                        width: 110,
                        align: 'center',
                        render: (value: number) => value && new Date(value).toLocaleString(),
                        sorter: (row1: any, row2: any) =>
                            row1.publicTimestamp - row2.publicTimestamp,
                        sortDirections: ['ascend', 'descend']
                    },
                    {
                        title: 'Timestamp',
                        dataIndex: 'timestamp',
                        width: 110,
                        align: 'center',
                        render: (value: number) => value && new Date(value).toLocaleString(),
                        sorter: (row1: any, row2: any) => row1.timestamp - row2.timestamp,
                        sortDirections: ['descend']
                    },
                    {
                        title: 'Last update timestamp',
                        dataIndex: 'lastUpdateTimestamp',
                        width: 110,
                        align: 'center',
                        render: (value: number) => value && new Date(value).toLocaleString(),
                        sorter: (row1: any, row2: any) =>
                            row1.lastUpdateTimestamp - row2.lastUpdateTimestamp,
                        sortDirections: ['ascend', 'descend']
                    },
                    {
                        title: 'Data',
                        dataIndex: 'data',
                        width: 90,
                        render: (data?: ArticleData) => {
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
                        },
                        fixed: 'right'
                    }
                ]}
                rowSelection={{
                    type: 'checkbox',
                    selectedRowKeys: selectedRows.map((row: any) => row.id),
                    onChange: (_: any, selectedRows: any) => {
                        setSelectedRows(selectedRows)
                    }
                }}
                size="small"
                rowKey={(record: any) => record.id}
                pagination={pagination}
                loading={isTableLoading}
                scroll={{ x: 1500 }}
                onChange={(pagination: TablePaginationConfig, filters: any, sorter: any) => {
                    setFilteredValue(filters)
                    const f = filters?.status && `status,in,${filters.status.join('.')}`

                    const sortOrder =
                        sorter.order === 'ascend'
                            ? 'asc'
                            : sorter.order === 'descend'
                            ? 'desc'
                            : undefined
                    const order = sortOrder && `${sorter.field},${sortOrder}`

                    setSearchValue('')
                    fetchArticles(pagination, f, order)
                }}
            />
        </AdminLayout>
    )
}

export default Articles
