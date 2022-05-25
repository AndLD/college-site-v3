import { DeploymentUnitOutlined } from '@ant-design/icons'
import { Badge, Checkbox, Empty, Popover, Skeleton, Tooltip } from 'antd'
import { useEffect, useReducer, useState } from 'react'
import { useSelector } from 'react-redux'
import { io, Socket } from 'socket.io-client'
import { useImmer } from 'use-immer'
import { IJob } from '../../../utils/types'
import JobsCollapse from './JobsCollapse'

function Jobs() {
    const [jobs, setJobs] = useImmer<{ [id: string]: IJob }>({})
    const [isJobsLoading, setIsJobsLoading] = useState<boolean>(false)
    const [isKeepJobsVisibleEnabled, setIsKeepJobsVisibleEnabled] = useState<boolean>(false)
    const [isJobsVisible, setIsJobsVisible] = useState<boolean>(false)
    const socket: Socket = useSelector((state: any) => state.app.socket)

    useEffect(() => {
        socket.once('connect', () => {
            setIsJobsLoading(false)
        })

        socket.once('disconnect', () => {
            setIsJobsLoading(true)
        })

        console.log(0)
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
        console.log(jobs)

        if (socket) {
            console.log(1)
            setupJobsEvents(socket)
        }
    }, [jobs])

    function setupJobsEvents(socket: Socket) {
        console.log('setupSocketJobsEvents')

        socket.once('update-jobs', (jobs: { [id: string]: IJob }) => setJobs(jobs))
        socket.once('update-job', (id: string, job: IJob) => {
            setJobs({ ...jobs, [id]: job })
        })
        socket.once('remove-job', (id: string) => {
            const newJobs = jobs
            delete newJobs[id]
            setJobs(newJobs)
        })
    }

    return (
        <span className="trigger">
            <Popover
                title={
                    <div>
                        Jobs{' '}
                        <Tooltip title="Keep jobs window open">
                            <Checkbox
                                checked={isKeepJobsVisibleEnabled}
                                onChange={(e) => setIsKeepJobsVisibleEnabled(e.target.checked)}
                            />
                        </Tooltip>
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
