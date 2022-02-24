import React, { useEffect, useState } from 'react'
import LogoutButton from './LogoutButton'
import { Layout, Avatar, Dropdown, Menu } from 'antd'
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UserOutlined,
    LogoutOutlined
} from '@ant-design/icons'
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
    const [avatarLoaded, setAvatarLoaded] = useState(false)
    const collapsed = useSelector((state: any) => state.app.menu.collapsed)

    function getAvatarSrc() {
        try {
            const src = (jwtDecode(token) as ITokenData).picture
            return src
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <Header className="site-layout-background" style={{ padding: 0 }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
                className: 'trigger',
                onClick: () => dispatch(setMenuCollapsed(!collapsed))
            })}
            <span style={{ width: '1000px', textAlign: 'right' }}>
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
                        style={{ cursor: 'pointer' }}
                        shape="square"
                        icon={
                            <>
                                <img
                                    src={getAvatarSrc()}
                                    onLoad={() => setAvatarLoaded(true)}
                                    alt="Avatar"
                                    style={{ display: avatarLoaded ? 'inline' : 'none' }}
                                />
                                {!avatarLoaded && <UserOutlined />}
                            </>
                        }
                    />
                </Dropdown>
            </span>
        </Header>
    )
}
