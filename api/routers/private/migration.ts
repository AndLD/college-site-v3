import { Router } from 'express'
import { privateMigrationControllers } from '../../controllers/private/migration'

export default Router()
    // Start migration process
    .post('/:entity', privateMigrationControllers.postMigration)
