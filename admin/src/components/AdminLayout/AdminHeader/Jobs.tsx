import { DeploymentUnitOutlined } from '@ant-design/icons'
import { Badge, Checkbox, Empty, Popover, Skeleton, Tooltip } from 'antd'
import { useEffect, useReducer, useState } from 'react'
import { io } from 'socket.io-client'
import { IJob } from '../../../utils/types'
import JobsCollapse from './JobsCollapse'

let jobs: { [id: string]: IJob } = {}

function Jobs() {
    // const token = useSelector((state: any) => state.app.token)
    // const [jobs, setJobs] = useState<{ [id: string]: IJob }>({})
    const [isJobsLoading, setIsJobsLoading] = useState<boolean>(false)
    const [isKeepJobsVisibleEnabled, setIsKeepJobsVisibleEnabled] = useState<boolean>(false)
    const [isJobsVisible, setIsJobsVisible] = useState<boolean>(false)
    // const [socket, setSocket] = useState<Socket | null>(null)

    const [, forceUpdate] = useReducer((x) => x + 1, 0)

    function setJobs(newJobs: { [id: string]: IJob }) {
        jobs = newJobs
        forceUpdate()
    }

    useEffect(() => {
        const socket = io('http://localhost:8080', {
            withCredentials: true,
            reconnectionDelay: 1000
            // extraHeaders: {
            //     Authorization: `Bearer ${token}`
            // }
        })

        console.log('render')
        socket.on('connect', () => {
            setIsJobsLoading(false)
        })

        socket.on('disconnect', () => {
            setIsJobsLoading(true)
        })

        socket.on('update-jobs', (jobs: { [id: string]: IJob }) => setJobs(jobs))
        socket.on('update-job', (id: string, job: IJob) => {
            setJobs({ ...jobs, [id]: job })
            // jobs[id] = job
        })

        socket.on('remove-job', (id: string) => {
            const newJobs = jobs
            delete newJobs[id]
            setJobs(newJobs)
        })

        // setSocket(socket)

        const setIsKeepJobsVisibleEnabledFromLocalStorage = localStorage.getItem(
            'isKeepJobsVisibleEnabled'
        )
        if (setIsKeepJobsVisibleEnabledFromLocalStorage === 'true') {
            setIsKeepJobsVisibleEnabled(true)
        } else {
            setIsKeepJobsVisibleEnabled(false)
        }
    }, [])

    useEffect(() => {
        localStorage.setItem(
            'isKeepJobsVisibleEnabled',
            isKeepJobsVisibleEnabled ? 'true' : 'false'
        )
    }, [isKeepJobsVisibleEnabled])

    useEffect(() => console.log(jobs), [jobs])

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
