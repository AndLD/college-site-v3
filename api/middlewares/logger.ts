import { Any } from '../utils/types'
import { getLogger } from '../utils/logger'

const logger = getLogger('middlewares/logger')

export function loggerMiddleware(req: Any, _: Any, next: any) {
    logger.info(`${req.method}, ${req.url}`)
    next()
}
