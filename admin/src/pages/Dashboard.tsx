import { Spin, Statistic, Tooltip, Typography } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { errorNotification } from '../utils/notifications'
import { privateRoute } from '../utils/constants'
import {
    BranchesOutlined,
    ClockCircleOutlined,
    FileImageOutlined,
    FileTextOutlined,
    FolderOutlined,
    ProfileOutlined,
    TeamOutlined
} from '@ant-design/icons'
import moment from 'moment'

const { Title } = Typography

interface IStatistics {
    actionsTotal: number
    articlesTotal: number
    bufferServiceSizeTotal: number
    menuTotal: number
    newsTotal: number
    startTimestamp: number
    usersTotal: number
}

function Dashboard() {
    const token = useSelector((state: any) => state.app.token)
    const [statistics, setStatistics] = useState<IStatistics>()

    useEffect(() => {
        document.title = 'Admin Dashboard'

        axios(`${privateRoute}/statistics`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                setStatistics(res.data)
            })
            .catch((err: AxiosError) => errorNotification(err.message))
    }, [])

    return (
        <AdminLayout>
            <Title level={1}>Dashboard</Title>

            {statistics ? (
                <>
                    <div style={{ display: 'flex', textAlign: 'center', margin: '50px 0' }}>
                        <Tooltip title="Menu">
                            <div style={{ flex: 1 }}>
                                <Title level={2}>
                                    <div>{statistics.menuTotal}</div>
                                    <ProfileOutlined style={{ fontSize: '60px', marginTop: 10 }} />
                                </Title>
                            </div>
                        </Tooltip>
                        <div style={{ flex: 1 }}>
                            <Tooltip title="Articles">
                                <Title level={2}>
                                    <div>{statistics.articlesTotal}</div>
                                    <FileTextOutlined style={{ fontSize: '60px', marginTop: 10 }} />
                                </Title>
                            </Tooltip>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Tooltip title="News">
                                <Title level={2}>
                                    <div>{statistics.newsTotal}</div>
                                    <FileImageOutlined
                                        style={{ fontSize: '60px', marginTop: 10 }}
                                    />
                                </Title>
                            </Tooltip>
                        </div>
                    </div>

                    <div style={{ display: 'flex', textAlign: 'center', margin: '50px 0' }}>
                        <div style={{ flex: 1 }}>
                            <Tooltip title="Users">
                                <Title level={2}>
                                    <div>{statistics.usersTotal}</div>
                                    <TeamOutlined style={{ fontSize: '60px', marginTop: 10 }} />
                                </Title>
                            </Tooltip>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Tooltip title="Actions">
                                <Title level={2}>
                                    <div>{statistics.actionsTotal}</div>
                                    <BranchesOutlined style={{ fontSize: '60px', marginTop: 10 }} />
                                </Title>
                            </Tooltip>
                        </div>
                    </div>

                    <div style={{ display: 'flex', textAlign: 'center', margin: '50px 0' }}>
                        <div style={{ flex: 1 }}>
                            <Tooltip title="Server buffer folder size total">
                                <Title level={2}>
                                    <div>{statistics.bufferServiceSizeTotal} (MB)</div>
                                    <FolderOutlined style={{ fontSize: '60px', marginTop: 10 }} />
                                </Title>
                            </Tooltip>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Tooltip title="Start time">
                                <Title level={2}>
                                    <div>
                                        {moment(statistics.startTimestamp).format(
                                            'DD.MM.YYYY HH:mm:ss'
                                        )}
                                    </div>
                                    <ClockCircleOutlined
                                        style={{ fontSize: '60px', marginTop: 10 }}
                                    />
                                </Title>
                            </Tooltip>
                        </div>
                    </div>
                </>
            ) : null}

            {/* <div style={{ textAlign: 'center', padding: 10 }}>
                <button onClick={() => navigator.clipboard.writeText(token)}>Copy token</button>
            </div> */}
        </AdminLayout>
    )
}

export default Dashboard
