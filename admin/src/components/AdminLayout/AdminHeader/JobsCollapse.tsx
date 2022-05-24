import { Collapse, Progress, Steps } from 'antd'
import { jobsUtils } from '../../../utils/jobs'
import { IJob } from '../../../utils/types'

function JobsCollapse({ jobs }: { jobs: { [id: string]: IJob } }) {
    return (
        <Collapse style={{ maxHeight: '80vh', overflowY: 'scroll' }}>
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
                                <div style={{ color: '#1890ff' }}>{jobs[id].user}</div>
                                <div style={{ maxWidth: 350 }}>{jobs[id].title}</div>
                                <Progress
                                    style={{ width: 350 }}
                                    percent={percent}
                                    status={jobs[id].status}
                                />
                                <div>
                                    {jobs[id].status !== 'success'
                                        ? jobs[id].steps[jobs[id].currentStep].title
                                        : null}
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
                                return (
                                    <Steps.Step
                                        key={i}
                                        title={step.title}
                                        subTitle={step.duration ? step.duration : null}
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
