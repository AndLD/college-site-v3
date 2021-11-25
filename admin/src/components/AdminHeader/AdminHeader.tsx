import React, { useEffect } from 'react'
import LogoutButton from './LogoutButton'
import { Layout, Badge, Avatar, Dropdown, Popover, Card, Tooltip, Menu } from 'antd'
import { MenuUnfoldOutlined, MenuFoldOutlined, BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import jwtDecode from 'jwt-decode'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setMenuCollapsed } from '../../store/actions'

const { Header } = Layout

interface ITokenData {
    name: string
    picture: string
    user_id: string
    email: string
    auth_time: number
}

export default function AdminHeader() {
    const dispatch = useDispatch()
    const token = useSelector((state: any) => state.app.token)
    const collapsed = useSelector((state: any) => state.app.menu.collapsed)

    return (
        <Header className="site-layout-background" style={{ padding: 0 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'trigger',
                onClick: () => dispatch(setMenuCollapsed(!collapsed))
            })}
            <span style={{ width: '1000px', textAlign: 'right' }}>
                <Popover
                    content={
                        <div>
                            <Card style={{ margin: '5px 0' }}>
                                <Tooltip placement="topLeft" title="Go to action...">
                                    <Link to="#">New article</Link>
                                </Tooltip>
                                <div></div>
                            </Card>
                            <Card style={{ margin: '5px 0' }}>
                                <Tooltip placement="topLeft" title="Go to action...">
                                    <Link to="#">New news</Link>
                                </Tooltip>
                            </Card>
                            <Card style={{ margin: '5px 0' }}>
                                <Tooltip placement="topLeft" title="Go to action...">
                                    <Link to="#">Article 'Адміністрація коледжу' updated</Link>
                                </Tooltip>
                            </Card>
                        </div>
                    }
                    title="Notifications"
                    trigger="click"
                >
                    <Badge count={1}>
                        <BellOutlined className="notifications" />
                    </Badge>
                </Popover>
                <Dropdown
                    overlay={
                        <Menu>
                            <Menu.Item key="1" icon={<UserOutlined />}>
                                <Link to="/admin/profile">Profile</Link>
                            </Menu.Item>
                            <Menu.Item key="2" icon={<LogoutOutlined />}>
                                <LogoutButton />
                            </Menu.Item>
                        </Menu>
                    }
                    placement="bottomCenter"
                    arrow
                    trigger={['click']}
                >
                    <Avatar
                        style={{ margin: '0 24px', cursor: 'pointer' }}
                        shape="square"
                        icon={<img src={(jwtDecode(token) as ITokenData).picture} alt="Avatar" />}
                    />
                </Dropdown>
            </span>
        </Header>
    )
}
