import { IJob, JobStatus, JobStep, JobUpdateBody } from '../utils/types'
import EventEmitter from 'events'
import { v4 as uuidv4 } from 'uuid'
import { jobsUtils } from '../utils/jobs'

// const timestamp = Date.now()

const jobs: { [key: string]: IJob } = {}

const jobsEventEmitter = new EventEmitter()

function _emitJobUpdate(id: string) {
    jobsEventEmitter.emit('update', id, jobs[id])
}

function add(user: string, title: string, steps: JobStep[]) {
    const id = uuidv4()

    const timestamp = Date.now()

    performance.mark(`job:${id}:step:0 start`)
    performance.mark(`job:${id} start`)

    const job = {
        title,
        steps,
        currentStep: 0,
        timestamp,
        status: 'active' as JobStatus,
        user
    }

    jobs[id] = job

    _emitJobUpdate(id)

    return id
}

function update(id: string, body: JobUpdateBody) {
    if (!body.currentStep && !body.status) {
        return
    }

    const newJob = jobs[id]

    if (body.currentStep) {
        newJob.currentStep = body.currentStep
    }
    if (body.status) {
        newJob.status = body.status
    }

    jobs[id] = newJob

    _emitJobUpdate(id)
}

function updateTitle(id: string, title: string) {
    jobs[id].title = title

    _emitJobUpdate(id)
}

function updatePercent(id: string, percent: number) {
    jobs[id].percent = percent

    _emitJobUpdate(id)
}

function updateStepTitle(id: string, title: string) {
    jobs[id].steps[jobs[id].currentStep].title = title

    _emitJobUpdate(id)
}

function updateStepDescription(id: string, description: string) {
    jobs[id].steps[jobs[id].currentStep].description = description

    _emitJobUpdate(id)
}

function _nextStep(id: string) {
    const measureName = `job:${id}:step:${jobs[id].currentStep}`

    performance.mark(`${measureName} end`)

    performance.measure(measureName, `${measureName} start`, `${measureName} end`)

    jobs[id].steps[jobs[id].currentStep].duration =
        performance.getEntriesByName(measureName)[0].duration
    jobs[id].currentStep++

    performance.mark(`job:${id}:step:${jobs[id].currentStep} start`)

    // Clear marks and measures
    performance.clearMeasures(measureName)
    performance.clearMarks(`${measureName} end`)
}

function nextStep(id: string) {
    _nextStep(id)

    _emitJobUpdate(id)
}

function _addStep(id: string, stepTitle: string, stepDescription?: string) {
    const newStep = {
        title: stepTitle,
        description: stepDescription
    }
    jobs[id].steps.push(newStep)
}

function addStep(id: string, stepTitle: string, stepDescription?: string) {
    _addStep(id, stepTitle, stepDescription)

    _emitJobUpdate(id)
}

function addNextStep(id: string, stepTitle: string, stepDescription?: string) {
    // Create next step
    const newStep = {
        title: stepTitle,
        description: stepDescription
    }
    jobs[id].steps.push(newStep)

    _nextStep(id)

    _emitJobUpdate(id)
}

function insertStep(id: string, stepTitle: string, stepDescription?: string) {
    // Create step
    const newStep: JobStep = {
        title: stepTitle,
        description: stepDescription
    }
    // Insert step
    const steps = [
        ...jobs[id].steps.slice(0, jobs[id].currentStep),
        newStep,
        ...jobs[id].steps.slice(jobs[id].currentStep + 1)
    ]
    jobs[id].steps = steps

    _emitJobUpdate(id)
}

// Deprecated
function removeStep(id: string) {
    if (jobs[id].currentStep === 0) {
        jobs[id].steps.shift()
    } else if (jobs[id].currentStep === jobs[id].steps.length - 1) {
        jobs[id].steps.pop()
    } else {
        jobs[id].steps = [
            ...jobs[id].steps.slice(0, jobs[id].currentStep - 1),
            ...jobs[id].steps.slice(jobs[id].currentStep + 1)
        ]
    }

    _emitJobUpdate(id)
}

function removeNextSteps(id: string) {
    jobs[id].steps = jobs[id].steps.slice(0, jobs[id].currentStep + 1)

    _emitJobUpdate(id)
}

function _finish(id: string) {
    const step = jobs[id].currentStep

    const stepMeasureName = `job:${id}:step:${step}`
    performance.mark(`${stepMeasureName} end`)
    performance.measure(stepMeasureName, `${stepMeasureName} start`, `${stepMeasureName} end`)

    jobs[id].steps[step].duration = performance.getEntriesByName(stepMeasureName)[0].duration

    const jobMeasureName = `job:${id}`
    performance.mark(`${jobMeasureName} end`)
    performance.measure(jobMeasureName, `${jobMeasureName} start`, `${jobMeasureName} end`)

    jobs[id].duration = performance.getEntriesByName(jobMeasureName)[0].duration

    // Clear marks and measures
    jobsUtils.clearPerformanceResources(
        [stepMeasureName, jobMeasureName],
        [
            `${stepMeasureName} start`,
            `${stepMeasureName} end`,
            `${jobMeasureName} start`,
            `${jobMeasureName} end`
        ]
    )
}

function error(id: string) {
    jobs[id].status = 'exception'

    _finish(id)

    _emitJobUpdate(id)
}

function success(id: string) {
    jobs[id].status = 'success'

    _finish(id)

    _emitJobUpdate(id)

    remove(id)
}

function remove(id: string) {
    delete jobs[id]

    // jobsEventEmitter.emit('remove', id)
}

function get() {
    return jobs
}

export const jobsService = {
    jobsEventEmitter,
    add,
    update,
    updateTitle,
    updatePercent,
    updateStepTitle,
    updateStepDescription,
    nextStep,
    addStep,
    addNextStep,
    insertStep,
    removeStep,
    removeNextSteps,
    error,
    success,
    remove,
    get
}
