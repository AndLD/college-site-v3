import { Collapse, Progress, Steps } from 'antd'
import moment from 'moment'
import { jobsUtils } from '../../../utils/jobs'
import { IJob } from '../../../utils/types'

function JobsCollapse({ jobs }: { jobs: { [id: string]: IJob } }) {
    return (
        <Collapse accordion style={{ maxHeight: '80vh', overflowY: 'scroll' }}>
            {Object.keys(jobs).map((id, i) => {
                const percent =
                    jobs[id].status === 'success'
                        ? 100
                        : Math.round((100 * jobs[id].currentStep) / jobs[id].steps.length)

                return (
                    <Collapse.Panel
                        forceRender
                        key={i}
                        style={{ minWidth: 400 }}
                        header={
                            <div>
                                <div>
                                    {moment(jobs[id].timestamp).format('DD.MM.YYYY HH:mm:ss')}
                                </div>
                                <div style={{ color: '#1890ff' }}>{jobs[id].user}</div>
                                <div style={{ maxWidth: 350 }}>{jobs[id].title}</div>
                                <Progress
                                    style={{ width: 350 }}
                                    percent={percent}
                                    status={jobs[id].status}
                                />
                                <div>
                                    {jobs[id].status !== 'success' ? (
                                        <span
                                            style={{
                                                color:
                                                    jobs[id].status === 'exception'
                                                        ? 'rgb(255, 68, 70)'
                                                        : ''
                                            }}
                                        >
                                            {jobs[id].steps[jobs[id].currentStep].title}
                                        </span>
                                    ) : jobs[id].duration ? (
                                        <span
                                            style={{
                                                color: 'rgb(72, 188, 25)'
                                            }}
                                        >
                                            {Number(jobs[id].duration / 1000).toFixed(2)} s
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        }
                    >
                        <Steps
                            current={jobs[id].currentStep}
                            status={jobsUtils.convertJobStatusToStepsStatus(jobs[id].status)}
                            responsive
                            size="small"
                            direction="vertical"
                            percent={percent}
                        >
                            {jobs[id].steps.map((step, i) => {
                                const preparedDuration =
                                    (step.duration && Number(step.duration / 1000).toFixed(2)) || 0
                                const stepDuration =
                                    preparedDuration > 0 ? preparedDuration + 's' : null

                                return (
                                    <Steps.Step
                                        key={i}
                                        title={step.title}
                                        subTitle={stepDuration}
                                        description={step.description}
                                    />
                                )
                            })}
                        </Steps>
                    </Collapse.Panel>
                )
            })}
        </Collapse>
    )
}

export default JobsCollapse
