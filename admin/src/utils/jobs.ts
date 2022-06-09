import { JobStatus } from './types'

function convertJobStatusToStepsStatus(jobStatus: JobStatus) {
    switch (jobStatus) {
        case 'active':
            return 'process'
        case 'exception':
            return 'error'
        case 'success':
            return 'finish'
        case 'normal':
            return 'wait'
    }
}

export const jobsUtils = {
    convertJobStatusToStepsStatus
}
