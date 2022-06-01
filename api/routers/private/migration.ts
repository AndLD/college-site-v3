import { Router } from 'express'
import { privateMigrationControllers } from '../../controllers/private/migration'
import { getLogger } from '../../utils/logger'

export default Router()
    // Start migration process
    .post('/:entity', privateMigrationControllers.postMigration)
