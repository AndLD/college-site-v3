import { Any } from '../utils/types'
import logger from '../utils/logger'

export default (req: Any, _: Any, next: any) => {
    logger.info(`${req.method}, ${req.url}`)
    next()
}