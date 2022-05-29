import { Layout } from 'antd'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import logo from '../assets/images/Auth/logo.png'

import '../styles/AdminLayout.scss'

import AdminHeader from './AdminLayout/AdminHeader'
import AdminMenu from './AdminLayout/AdminMenu'

const { Sider, Content } = Layout

function AdminLayout({ children, currentPage }: any) {
    const publicUrl = useSelector((state: any) => state.app.env.publicUrl)
    const collapsed = useSelector((state: any) => state.app.menu.collapsed)

    useEffect(() => {
        localStorage.setItem(
            'currentPage',
            currentPage
                ? !currentPage.includes('preview')
                    ? currentPage.toLowerCase()
                    : currentPage
                : 'Dashboard'
        )
    }, [])

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider trigger={null} collapsible collapsed={collapsed}>
                <div className="logo">
                    <img
                        src={logo}
                        alt="Admin Page Logo"
                        onClick={() => {
                            console.log(process.env.REACT_APP_DEV_PUBLIC_URL)
                            window.location.href = publicUrl || '#'
                        }}
                    />
                    <div
                        style={{
                            opacity: collapsed ? 0 : 1,
                            transition: 'opacity ease 0.5s'
                        }}
                    >
                        {collapsed ? '' : 'ВСП «КРФК НАУ»'}
                    </div>
                </div>
                <AdminMenu currentPage={currentPage || 'Dashboard'} />
            </Sider>
            <Layout className="site-layout">
                <AdminHeader />
                <Content
                    className="site-layout-background"
                    style={{
                        margin: '24px 16px',
                        padding: 24,
                        minHeight: 280
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    )
}

export default AdminLayout
