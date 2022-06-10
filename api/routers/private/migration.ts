import { Router } from 'express'
import { privateMigrationControllers } from '../../controllers/private/migration'

export default Router()
    // Start migration process
    .post('/:entity', privateMigrationControllers.postMigration)
    // Get unmigrated oldIds
    .get('/:entity/unmigrated', privateMigrationControllers.getUnmigratedOldIds)
