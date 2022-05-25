import { DeploymentUnitOutlined } from '@ant-design/icons'
import { Badge, Checkbox, Empty, Popover, Skeleton, Tooltip } from 'antd'
import { useEffect, useReducer, useState } from 'react'
import { useSelector } from 'react-redux'
import { io, Socket } from 'socket.io-client'
import { IJob } from '../../../utils/types'
import JobsCollapse from './JobsCollapse'

function Jobs() {
    const [jobs, setJobs] = useState<{ [id: string]: IJob }>({})
    const [isJobsLoading, setIsJobsLoading] = useState<boolean>(false)
    const [isKeepJobsVisibleEnabled, setIsKeepJobsVisibleEnabled] = useState<boolean>(false)
    const [isJobsVisible, setIsJobsVisible] = useState<boolean>(false)
    const socket: Socket = useSelector((state: any) => state.app.socket)

    useEffect(() => {
        socket.on('connect', () => {
            setIsJobsLoading(false)
        })

        socket.on('disconnect', () => {
            setIsJobsLoading(true)
        })

        setupJobsEvents(socket)

        const setIsKeepJobsVisibleEnabledFromLocalStorage = localStorage.getItem(
            'isKeepJobsVisibleEnabled'
        )
        if (setIsKeepJobsVisibleEnabledFromLocalStorage === 'true') {
            setIsKeepJobsVisibleEnabled(true)
        } else {
            setIsKeepJobsVisibleEnabled(false)
        }

        return () => {
            socket.removeAllListeners()
        }
    }, [])

    useEffect(() => {
        localStorage.setItem(
            'isKeepJobsVisibleEnabled',
            isKeepJobsVisibleEnabled ? 'true' : 'false'
        )
    }, [isKeepJobsVisibleEnabled])

    useEffect(() => {
        if (socket) {
            setupJobsEvents(socket)
        }
    }, [jobs])

    function setupJobsEvents(socket: Socket) {
        socket.once('update-jobs', (newJobs: { [id: string]: IJob }) => {
            const successJobs: { [id: string]: IJob } = {}
            for (const id in jobs) {
                if (jobs[id].status === 'success' || jobs[id].status === 'exception') {
                    successJobs[id] = jobs[id]
                }
            }
            setJobs({ ...successJobs, ...newJobs })
        })
        socket.once('update-job', (id: string, job: IJob) => {
            setJobs({ ...jobs, [id]: job })
        })
        socket.once('remove-job', (id: string) => {
            const newJobs = jobs
            delete newJobs[id]
            setJobs(newJobs)
        })
    }

    function dropSuccessedJobs() {
        const filtered: { [id: string]: IJob } = {}

        for (const id in jobs) {
            if (jobs[id].status !== 'success') {
                filtered[id] = jobs[id]
            }
        }

        setJobs(filtered)
    }

    return (
        <span className="trigger">
            <Popover
                title={
                    <div>
                        <div>
                            Jobs{' '}
                            <Tooltip title="Keep jobs window open">
                                <Checkbox
                                    checked={isKeepJobsVisibleEnabled}
                                    onChange={(e) => setIsKeepJobsVisibleEnabled(e.target.checked)}
                                />
                            </Tooltip>
                        </div>
                        <div>
                            {Object.keys(jobs).filter((id) => jobs[id].status === 'success')
                                .length > 0 ? (
                                <span
                                    style={{
                                        color: '#1890ff',
                                        width: '100%',
                                        textAlign: 'right',
                                        cursor: 'pointer'
                                    }}
                                    onClick={dropSuccessedJobs}
                                >
                                    Drop successed
                                </span>
                            ) : null}
                        </div>
                    </div>
                }
                placement="bottom"
                visible={isKeepJobsVisibleEnabled || isJobsVisible}
                onVisibleChange={(visible) => setIsJobsVisible(visible)}
                content={
                    <div>
                        {isJobsLoading ? (
                            <Skeleton active />
                        ) : Object.keys(jobs).length ? (
                            <JobsCollapse jobs={jobs} />
                        ) : (
                            <Empty />
                        )}
                    </div>
                }
            >
                <Badge
                    count={Object.keys(jobs).filter((id) => jobs[id].status === 'active').length}
                >
                    <DeploymentUnitOutlined
                        className="blue-color-on-hover"
                        style={{
                            fontSize: 30,
                            color: isJobsVisible || isKeepJobsVisibleEnabled ? '#1890ff' : ''
                        }}
                    />
                </Badge>
            </Popover>
        </span>
    )
}

export default Jobs
