import { Menu } from 'antd'
import {
    DashboardOutlined,
    ProfileOutlined,
    FileTextOutlined,
    FileImageOutlined,
    TeamOutlined,
    BranchesOutlined,
    RocketOutlined,
    SettingOutlined
} from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'

export default function AdminMenu({ currentPage }: { currentPage?: string }) {
    const collapsed = useSelector((state: any) => state.app.menu.collapsed)

    useEffect(() => {}, [])

    return (
        <Menu
            style={{ fontSize: '15px' }}
            theme="dark"
            mode="inline"
            defaultSelectedKeys={[currentPage || 'Dashboard']}
        >
            <Menu.Item
                key="Dashboard"
                icon={
                    <DashboardOutlined style={{ fontSize: '25px', transform: collapsed ? 'translateX(-25%)' : '' }} />
                }
            >
                <Link to={'/admin'}>Dashboard</Link>
            </Menu.Item>
            <Menu.Item
                key="Settings"
                icon={<SettingOutlined style={{ fontSize: '25px', transform: collapsed ? 'translateX(-25%)' : '' }} />}
            >
                <Link to={'/admin/settings'}>Settings</Link>
            </Menu.Item>
            <Menu.Item
                key="Menu"
                icon={<ProfileOutlined style={{ fontSize: '25px', transform: collapsed ? 'translateX(-25%)' : '' }} />}
            >
                <Link to={'/admin/menu'}>Menu</Link>
            </Menu.Item>
            <Menu.Item
                key="Articles"
                icon={<FileTextOutlined style={{ fontSize: '25px', transform: collapsed ? 'translateX(-25%)' : '' }} />}
            >
                <Link to={'/admin/articles'}>Articles</Link>
            </Menu.Item>
            <Menu.Item
                key="News"
                icon={
                    <FileImageOutlined style={{ fontSize: '25px', transform: collapsed ? 'translateX(-25%)' : '' }} />
                }
            >
                <Link to={'/admin/news'}>News</Link>
            </Menu.Item>
            <Menu.Item
                key="Users"
                icon={<TeamOutlined style={{ fontSize: '25px', transform: collapsed ? 'translateX(-25%)' : '' }} />}
            >
                <Link to={'/admin/users'}>Users</Link>
            </Menu.Item>
            <Menu.Item
                key="Actions"
                icon={<BranchesOutlined style={{ fontSize: '25px', transform: collapsed ? 'translateX(-25%)' : '' }} />}
            >
                <Link to={'/admin/actions'}>Actions</Link>
            </Menu.Item>
            <Menu.Item
                key="Guide"
                icon={<RocketOutlined style={{ fontSize: '25px', transform: collapsed ? 'translateX(-25%)' : '' }} />}
            >
                <Link to={'/admin/guide'}>Guide</Link>
            </Menu.Item>
        </Menu>
    )
}
