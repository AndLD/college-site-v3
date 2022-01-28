import { Spin, Typography } from 'antd'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'

const { Title } = Typography

function Dashboard() {
    const token = useSelector((state: any) => state.app.token)
    const [statistics, setStatistics] = useState(null)

    useEffect(() => {
        let isMounted = true
        document.title = 'Admin Dashboard'

        axios('http://localhost:8080/api/private/statistics', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((resp) => {
                if (isMounted) {
                    setStatistics(resp.data)
                }
            })
            .catch((e) => console.log(e))
        return () => {
            isMounted = false
        }
    }, [])

    return (
        <AdminLayout>
            <Title level={1}>Dashboard</Title>

            <div style={{ textAlign: 'center' }}>
                {statistics ? (
                    Object.keys(statistics).map((key: string) => (
                        <Title level={2} key={key}>
                            {key}: {statistics[key]}
                        </Title>
                    ))
                ) : (
                    <Spin size="large" />
                )}
            </div>

            <div style={{ textAlign: 'center', padding: 10 }}>
                <button onClick={() => navigator.clipboard.writeText(token)}>Copy token</button>
            </div>
        </AdminLayout>
    )
}

export default Dashboard
