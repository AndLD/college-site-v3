import { Spin, Switch, Tooltip, Typography } from 'antd'
import axios, { AxiosError, AxiosResponse } from 'axios'
import { useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { privateRoutes } from '../utils/constants'
import { errorNotification, successNotification } from '../utils/notifications'

const { Title } = Typography

function Settings() {
    const token = useSelector((state: any) => state.app.token)
    const user = useSelector((state: any) => state.app.user)

    const [isSettingsLoading, setIsSettingsLoading] = useState<boolean>(true)

    const [isActionAutoApproveEnabled, setIsActionAutoApproveEnabled] = useState<boolean>(false)
    const [isActionAutoApproveBtnLoading, setIsActionAutoApproveBtnLoading] =
        useState<boolean>(false)

    useEffect(() => {
        // let isMounted = true
        document.title = 'Admin Settings'

        fetchSettings()
        // return () => {
        //     isMounted = false
        // }
    }, [])

    function fetchSettings() {
        setIsSettingsLoading(true)
        axios(privateRoutes.APP_SETTINGS, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                const settings = res.data.result

                setIsActionAutoApproveEnabled(
                    settings.actionAutoApproveEnabledForAdmins.includes(user.email) &&
                        user.status === 'admin'
                )
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => setIsSettingsLoading(false))
    }

    function updateActionAutoApprove(checked: boolean) {
        setIsActionAutoApproveBtnLoading(true)
        axios(privateRoutes.APP_SETTINGS, {
            method: 'PUT',
            data: {
                actionAutoApproveEnabledForAdmins: user.email
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then((res: AxiosResponse) => {
                if (res.data.result === true) {
                    setIsActionAutoApproveEnabled(checked)
                    successNotification(
                        `Action auto approve successfully ${checked ? 'ENABLED' : 'DISABLED'}!`
                    )
                }
            })
            .catch((err: AxiosError) => errorNotification(err.message))
            .finally(() => setIsActionAutoApproveBtnLoading(false))
    }

    return (
        <AdminLayout currentPage="Settings">
            <Title level={1}>Settings</Title>
            <div>
                <Tooltip title="Personally for you">
                    <Switch
                        checked={isActionAutoApproveEnabled}
                        onChange={updateActionAutoApprove}
                        loading={isSettingsLoading || isActionAutoApproveBtnLoading}
                        style={{ marginRight: 20 }}
                    />

                    <Title level={5} style={{ display: 'inline' }}>
                        Action Auto Approve
                    </Title>
                </Tooltip>
            </div>
        </AdminLayout>
    )
}

export default Settings
