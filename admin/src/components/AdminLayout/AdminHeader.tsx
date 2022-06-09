import React from 'react'
import LogoutButton from './LogoutButton'
import { Layout, Dropdown, Menu } from 'antd'
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setMenuCollapsed } from '../../store/actions'
import UserAvatar from './AdminHeader/UserAvatar'
import Jobs from './AdminHeader/Jobs'

const { Header } = Layout

export default function AdminHeader() {
    const dispatch = useDispatch()

    const collapsed = useSelector((state: any) => state.app.menu.collapsed)

    return (
        <Header className="site-layout-background" style={{ padding: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', width: '180px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                        className: 'trigger',
                        onClick: () => dispatch(setMenuCollapsed(!collapsed))
                    })}
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
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
                        // TODO: Investigate why during the build this required to be 'bottomCenter', but after 'npm run dev' Ant-Design says we should use 'bottom'
                        placement="bottomCenter"
                        arrow
                        trigger={['click']}
                    >
                        <span>
                            <UserAvatar />
                        </span>
                    </Dropdown>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                    <Jobs />
                </div>
            </div>
        </Header>
    )
}
