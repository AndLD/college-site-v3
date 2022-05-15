import { Badge, Table, Tag } from 'antd'
import { Dispatch, SetStateAction } from 'react'
import { ArticleData, IColumn, NewsData } from './types'

function defineStatus(value: string) {
    switch (value) {
        case 'pending':
            return 'processing'
        case 'approved':
            return 'success'
        case 'declined':
            return 'error'
        default:
            return 'warning'
    }
}

function convertDateRangeValueToFilters(dateRangeValue: [number, number]) {
    const result: string[] = []

    if (dateRangeValue) {
        const [startTimestamp, endTimestamp] = dateRangeValue
        result.push(`timestamp,>=,${startTimestamp}`, `timestamp,<=,${endTimestamp}`)
    }

    return result
}

function getActionPayloadTable(
    {
        payload,
        payloadIds
    }: {
        payload: {
            [key: string]: any
        }
        payloadIds: string[]
    },
    entity: 'articles' | 'news'
) {
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
            column.render = (data?: ArticleData | NewsData) => {
                if (data)
                    return (
                        <div>
                            <div>
                                <Badge color={data.html ? 'green' : 'red'} /> html
                            </div>
                            <div>
                                <Badge color={data.docx ? 'green' : 'red'} /> docx
                            </div>
                            {entity === 'articles' ? (
                                <div>
                                    <Badge color={(data as ArticleData).pdf ? 'green' : 'red'} />{' '}
                                    pdf
                                </div>
                            ) : null}
                            {/* TODO: Remove everything binded with 'json' filetype in articles and news */}
                            {/* <div>
                                <Badge color={data.json ? 'green' : 'red'} /> json
                            </div> */}
                            {entity === 'news' ? (
                                <div>
                                    <Badge color={(data as NewsData).png ? 'green' : 'red'} /> png
                                </div>
                            ) : null}
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
            bordered
        />
    )
}

function combineFilters(params: {
    newStatus?: string[] | null
    newSearchValue?: string | null
    dateRangeValue: [number, number] | null
    searchValue: string
    statusFilterState: [string | null, Dispatch<SetStateAction<string | null>>]
}) {
    const [statusFilter, setStatusFilter] = params.statusFilterState

    let filtersString: string | undefined

    const filterComponents = []

    if (params.dateRangeValue) {
        filterComponents.push(...actionsUtils.convertDateRangeValueToFilters(params.dateRangeValue))
    }

    let tableFilter = statusFilter
    if (params.newStatus && params?.newStatus.join('.') !== tableFilter) {
        const newStatusFilter = `status,in,${params?.newStatus.join('.')}`

        setStatusFilter(newStatusFilter)
        filterComponents.push(newStatusFilter)
    } else if (tableFilter) {
        if (params.newStatus === null) {
            setStatusFilter(null)
        } else {
            filterComponents.push(tableFilter)
        }
    }

    const search =
        params.newSearchValue === '' || (params.newSearchValue && params.newSearchValue.length >= 0)
            ? params.newSearchValue
            : params.searchValue
    if (search) {
        filterComponents.push(`keywords,contains,${search.toLowerCase()}`)
    }

    if (filterComponents.length) {
        filtersString = filterComponents.join(':')
    }

    return filtersString
}

export const actionsUtils = {
    defineStatus,
    convertDateRangeValueToFilters,
    getActionPayloadTable,
    combineFilters
}
