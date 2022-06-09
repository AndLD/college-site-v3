import { Router } from 'express'
import { privateStatisticsControllers } from '../../controllers/private/statistics'
import { hasModeratorStatus } from '../../middlewares/auth'

export default Router()
    // Get statistics
    .get('/', hasModeratorStatus, privateStatisticsControllers.getStatistics)
