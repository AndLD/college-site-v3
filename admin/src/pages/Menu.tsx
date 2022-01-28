import { Typography, Table, Tree, Button, Empty, Spin, Popconfirm, Divider, Badge, Tabs } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { generateKey } from 'fast-key-generator'
import { errorNotification, successNotification, warningNotification } from '../utils/notifications'
import { IMenuBlock, IMenuElementOfTree } from '../utils/types'
import { privateRoutes } from '../utils/constants'
import '../styles/Menu.scss'
import MenuTreeElement from '../components/Menu/MenuTreeElement'
import MenuTableControls from '../components/Menu/MenuTable/MenuTableControls'

const { Title } = Typography

const { TabPane } = Tabs

function Menu() {
    const [isMounted, setIsMounted] = useState(true)

    const token = useSelector((state: any) => state.app.token)

    const [tableData, setTableData] = useState([])
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 5
    })
    const [loading, setLoading] = useState({
        tree: false,
        table: false
    })
    const [selectedRows, setSelectedRows] = useState([])
    const [selectedMenu, setSelectedMenu] = useState<IMenuBlock | undefined>()

    // const [checkedTreeKeys, setCheckedTreeKeys] = useState<any>([])
    const [treeData, setTreeData] = useState<IMenuElementOfTree[]>([])

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id'
        },
        {
            title: 'Description',
            dataIndex: 'description'
        },
        {
            title: 'Timestamp',
            dataIndex: 'timestamp',
            render: (value: number) => value && new Date(value).toLocaleString()
        },
        {
            title: 'Last Update Timestamp',
            dataIndex: 'lastUpdateTimestamp',
            render: (value: number) => value && new Date(value).toLocaleString()
        },
        {
            title: 'Status',
            dataIndex: 'status',
            render: (value: string, row: any, index: any) => (
                <div className="menu-table-status-cell">
                    <div className="menu-table-status-cell-hide-on-parent-hover">
                        <Badge status={value === 'Selected' ? 'success' : 'error'} /> {value}
                    </div>
                    <Button
                        className="menu-table-status-cell-show-on-parent-hover"
                        type="default"
                        danger={value === 'Selected' ? true : false}
                        size="small"
                        onClick={value === 'Selected' ? deselectMenu : () => selectMenu(row.id)}
                    >
                        {value === 'Selected' ? 'deselect' : 'select'}
                    </Button>
                </div>
            )
        }
    ]

    function selectMenu(id: string) {
        axios(privateRoutes.APP_SETTINGS, {
            method: 'PUT',
            data: {
                selectedMenuId: id
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                if (res.data.result === true) {
                    fetchSelectedMenu()
                    fetchMenu(pagination)
                    successNotification('Menu block successfully selected!')
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function deselectMenu() {
        axios(privateRoutes.APP_SETTINGS, {
            method: 'PUT',
            data: {
                selectedMenuId: null
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                if (res.data.result === true) {
                    fetchSelectedMenu()
                    fetchMenu(pagination)
                    successNotification('Menu block successfully deselected!')
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function deleteMenu() {
        let isSelectedMenuUpdateNeeds = false
        axios(privateRoutes.MENU, {
            method: 'DELETE',
            params: {
                ids: selectedRows
                    .map((elem: any) => {
                        if (selectedMenu && elem.id === selectedMenu.id) isSelectedMenuUpdateNeeds = true
                        return elem.id
                    })
                    .toString()
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(() => {
                if (isSelectedMenuUpdateNeeds) fetchSelectedMenu()
                // if (!isMounted) return
                fetchMenu(pagination)
                successNotification('Menu block was successfully deleted!')
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function fetchMenu(pagination: any) {
        setLoading({
            ...loading,
            table: true
        })
        axios(privateRoutes.MENU, {
            params: {
                page: pagination.current,
                results: pagination.pageSize,
                select: 'id,description,timestamp,lastUpdateTimestamp'
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                // if (!isMounted) return
                if (!res.data.meta?.pagination) throw new Error('No pagination obtained')
                setTableData(res.data.result)
                setLoading({
                    ...loading,
                    table: false
                })
                setPagination({
                    ...pagination,
                    total: res.data.meta.pagination.total
                })
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function configMenu() {
        const menu = selectedMenu?.menu

        if (!menu) return

        for (const elem of menu as IMenuElementOfTree[]) {
            configElem(elem)
        }

        setTreeData(menu as IMenuElementOfTree[])

        function configElem(elem: IMenuElementOfTree) {
            elem.key = generateKey({})
            elem.title = (
                <MenuTreeElement
                    elem={{ title: elem.title, hidden: elem.hidden || false, link: elem.link, key: elem.key }}
                />
            )
            for (const child of elem.children as IMenuElementOfTree[]) {
                configElem(child)
            }
        }
    }

    function fetchSelectedMenu() {
        setLoading({
            ...loading,
            tree: true
        })
        axios('http://localhost:8080/api/public/menu')
            .then((res) => {
                if (isMounted) {
                    const menu = res.data.result
                    setLoading({
                        ...loading,
                        tree: false
                    })

                    if (!menu) {
                        warningNotification('No selected menu found!')
                        setSelectedMenu(undefined)
                        setTreeData([])
                    }
                    setSelectedMenu(menu)
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }

    function updateSelectedMenu() {}

    useEffect(() => {
        if (selectedMenu) configMenu()
    }, [selectedMenu])

    useEffect(() => {
        console.log('treeData', treeData)
    }, [treeData])

    useEffect(() => {
        setIsMounted(true)
        document.title = 'Admin Menu'

        fetchSelectedMenu()

        fetchMenu(pagination)

        return () => {
            setIsMounted(false)
        }
    }, [])

    return (
        <AdminLayout currentPage="Menu">
            <Title level={1}>Menu</Title>
            <Tabs>
                <TabPane tab="Selected menu" key={1}>
                    <div style={{ textAlign: 'right', margin: '0 0 16px 0' }}>
                        <Popconfirm
                            disabled
                            title="Are you sure to update current menu?"
                            onConfirm={updateSelectedMenu}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button style={{ margin: '0 0 0 5px' }} type="primary" disabled>
                                Save
                            </Button>
                        </Popconfirm>
                    </div>
                    <div>
                        <Title level={4}>{selectedMenu?.description}</Title>
                        <p>{selectedMenu?.id}</p>
                        {loading.tree ? (
                            <div style={{ textAlign: 'center' }}>
                                <Spin size="large" />
                            </div>
                        ) : treeData.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            <Tree
                                // checkedKeys={checkedTreeKeys}
                                // checkable
                                // checkStrictly
                                selectable={false}
                                showLine
                                // onCheck={(checkedKeys, info) => {
                                // setCheckedTreeKeys(checkedKeys)
                                // console.log('checked', checkedKeys, info)
                                // }}
                                onSelect={(selectedKeys, info) => {
                                    console.log('selected', selectedKeys, info)
                                }}
                                treeData={treeData}
                            />
                        )}
                    </div>
                    <Divider />
                </TabPane>
                <TabPane tab="Menu table" key={2}>
                    <div>
                        <MenuTableControls deleteMenu={deleteMenu} selectedRows={selectedRows} />
                        <Table
                            rowSelection={{
                                type: 'checkbox',
                                onChange: (_: any, selectedRows: any) => {
                                    setSelectedRows(selectedRows)
                                }
                            }}
                            columns={columns}
                            rowKey={(record: any) => record.id}
                            dataSource={
                                tableData &&
                                tableData.map((row: any) => ({
                                    ...row,
                                    status: selectedMenu && row.id === selectedMenu.id ? 'Selected' : 'Not selected'
                                }))
                            }
                            pagination={pagination}
                            loading={loading.table}
                            onChange={(pagination: any) => fetchMenu(pagination)}
                        />
                    </div>
                </TabPane>
            </Tabs>
        </AdminLayout>
    )
}

export default Menu
