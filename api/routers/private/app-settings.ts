import { Router } from 'express'
import { appSettingsController } from '../../controller/app-settings-controller'
import { validateBody } from '../../middlewares/validation'

export default Router()
    // Получение настроек
    .get('/', appSettingsController)
    // Изменение настроек
    .put('/', validateBody, appSettingsController)
