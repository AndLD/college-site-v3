import { Router } from 'express'
import { appSettingsController } from '../../controllers/private/app-settings-controller'
import { validateBody } from '../../middlewares/validation'

export default Router()
    // Settings getting
    .get('/', appSettingsController)
    // Settings editing
    .put('/', validateBody, appSettingsController)
