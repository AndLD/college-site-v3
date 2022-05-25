import { IJob, JobStatus, JobStep, JobUpdateBody } from '../utils/types'
import EventEmitter from 'events'
import { v4 as uuidv4 } from 'uuid'

// const timestamp = Date.now()

const jobs: { [key: string]: IJob } = {}

const jobsEventEmitter = new EventEmitter()

function add(user: string, title: string, steps: JobStep[]) {
    const id = uuidv4()

    const timestamp = Date.now()

    steps[0].duration = performance.now()

    const job = {
        title,
        steps,
        currentStep: 0,
        timestamp,
        duration: performance.now(),
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

function updateStepTitle(id: string, title: string) {
    jobs[id].steps[jobs[id].currentStep].title = title

    _emitJobUpdate(id)
}

function updateStepDescription(id: string, description: string) {
    jobs[id].steps[jobs[id].currentStep].description = description

    _emitJobUpdate(id)
}

function _nextStep(id: string) {
    jobs[id].steps[jobs[id].currentStep].duration =
        performance.now() - (jobs[id].steps[jobs[id].currentStep].duration as number)
    jobs[id].currentStep++
    jobs[id].steps[jobs[id].currentStep].duration = performance.now()
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
        description: stepDescription,
        duration: performance.now()
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

function error(id: string) {
    jobs[id].status = 'exception'

    const lastStepDurationValue = jobs[id].steps[jobs[id].currentStep].duration

    if (lastStepDurationValue) {
        jobs[id].steps[jobs[id].currentStep].duration = performance.now() - lastStepDurationValue
    }
    jobs[id].duration = performance.now() - (jobs[id].duration || 0)

    _emitJobUpdate(id)
}

function success(id: string) {
    jobs[id].status = 'success'

    const lastStepDurationValue = jobs[id].steps[jobs[id].steps.length - 1].duration

    const now = performance.now()

    if (lastStepDurationValue) {
        jobs[id].steps[jobs[id].steps.length - 1].duration = now - lastStepDurationValue
    }
    jobs[id].duration = now - (jobs[id].duration || 0)

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

function _emitJobUpdate(id: string) {
    jobsEventEmitter.emit('update', id, jobs[id])
}

export const jobsService = {
    jobsEventEmitter,
    add,
    update,
    updateTitle,
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
