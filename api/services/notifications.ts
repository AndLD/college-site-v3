import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'
import { environment } from '../utils/constants'
import { getLogger } from '../utils/logger'
import { Error, IAction } from '../utils/types'
import { appSettingsService } from './app-settings'

const logger = getLogger('services/notifications')

let token: string | undefined
let channelId: string | undefined
let bot: Telegraf<Context<Update>> | undefined
let _isReady = false

function init() {
    if (_isReady) {
        return
    }

    appSettingsService.get('notificationsService').then((notificationsService) => {
        if (!notificationsService) {
            _isReady = false
            return
        }

        if (environment !== 'test') {
            token = process.env.TELEGRAM_BOT_TOKEN
            channelId = process.env.TELEGRAM_CHANNEL_ID

            if (!token) {
                const errorMsg = 'Telegram bot token not provided'
                logger.error(errorMsg)
                return
            }

            if (!channelId) {
                const errorMsg = 'Telegram channelId not provided'
                logger.error(errorMsg)
                return
            }

            bot = new Telegraf(token)
        }

        if (bot) {
            bot.launch()
                .then(() => {
                    logger.info('Telegram bot successfully connected.')
                    _isReady = true
                })
                .catch((error) => {
                    logger.error(`TELEGRAM BOT CONNECTION ERROR: ${error}`)
                })
        }
    })
}

function _sendMessage(message: string) {
    if (!bot || !channelId) {
        return
    }

    bot.telegram.sendMessage(channelId, message)
}

function sendNewUserNofication(name: string, email: string) {
    if (!bot) {
        return
    }

    const message = `😀 New user [${name}, ${email}] registered in the system`

    _sendMessage(message)
}

function sendError({ code, msg }: Error, payload: string) {
    if (!bot) {
        return
    }

    const message = `🚨 ERROR [${code}]: ${msg}: ${payload}`

    _sendMessage(message)
}

function sendWarning(message: string) {
    if (!bot) {
        return
    }

    message = `⚠️ WARNING: ${message}`

    _sendMessage(message)
}

function sendBugReport(user: string, description: string) {
    if (!bot) {
        return
    }

    const message = `🪲 BUG REPORT: \n\n${description}\n\nReporter: ${user}`

    _sendMessage(message)
}

function sendNewActionNotification(actionId: string, actionMetadata: IAction) {
    if (!bot) {
        return
    }
    let message: string = `New action [${actionId}]`

    let entityName: string = '⚠️ UNKNOWN ENTITY'

    switch (actionMetadata.entity) {
        case 'articles':
            entityName = '📄 Article'
            break
        case 'news':
            entityName = '📅 News'
            break
    }

    message = `Action [${actionId}]: ${entityName}${actionMetadata.payloadIds.length > 1 ? 's' : ''} [${
        actionMetadata.action === 'add' ? actionMetadata.payload.title : actionMetadata.payloadIds.join(', ')
    }] requested to ${actionMetadata.action.toUpperCase()} by User [${actionMetadata.user}]`

    _sendMessage(message)
}

function stop() {
    if (bot) {
        bot.stop()
        _isReady = false
        logger.info('Telegram bot successfully stoped.')
    }
}

function isReady() {
    return _isReady
}

export const notificationsService = {
    init,
    sendNewUserNofication,
    sendNewActionNotification,
    sendError,
    sendWarning,
    sendBugReport,
    stop,
    isReady
}
