import { Layout, Spin, Typography } from 'antd'
import { Content, Footer, Header } from 'antd/lib/layout/layout'
import LogoutButton from '../components/LogoutButton'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'

const { Title } = Typography

function AdminPage() {
    const token = useSelector((state: any) => state.app.token)
    const [statistics, setStatistics] = useState(null)

    useEffect(() => {
        setTimeout(() => {
            axios('http://localhost:8080/api/private/statistics', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
                .then((resp) => setStatistics(resp.data))
                .catch((e) => console.log(e))
        }, 3000)
    }, [])

    return (
        <Layout>
            <Header style={{ height: 'auto', backgroundColor: '#002766' }}>
                <Title style={{ color: 'white' }}>Admin Page</Title>
            </Header>
            <Content>
                <h2>Statistics</h2>
                <h4 style={{ textAlign: 'center' }}>
                    {statistics ? (
                        <div>
                            {Object.keys(statistics).map((key: string) => (
                                <Title level={3} key={key}>
                                    {key}: {statistics[key]}
                                </Title>
                            ))}
                        </div>
                    ) : (
                        <Spin size="large" />
                    )}
                </h4>

                <div>
                    <LogoutButton />
                    <br />
                    <a
                        href={
                            process.env.NODE_ENV === 'production'
                                ? process.env.REACT_APP_PROD_PUBLIC_DOMAIN
                                : process.env.REACT_APP_DEV_PUBLIC_DOMAIN || '#'
                        }
                    >
                        Main Page
                    </a>
                    <br />
                    <div style={{ textAlign: 'center', padding: 10 }}>
                        <button onClick={() => navigator.clipboard.writeText(token)}>Copy token</button>
                    </div>
                </div>
            </Content>
            <Footer>© ВСП “КРФК НАУ” 2021</Footer>
        </Layout>
    )
}

export default AdminPage
