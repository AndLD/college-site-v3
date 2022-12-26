import { Router } from 'express'
import { appSettingsPrivateControllers } from '../../controllers/private/app-settings-controller'
import { validateBody } from '../../middlewares/validation'

export default Router()
    // Settings getting
    .get('/', appSettingsPrivateControllers.getSettings)
    // Settings editing
    .put('/', validateBody, appSettingsPrivateControllers.putSettings)
