import { Telegraf } from 'telegraf'
import { getLogger } from '../utils/logger'
import { Error, IAction } from '../utils/types'

const logger = getLogger('services/notification')

const token = process.env.TELEGRAM_BOT_TOKEN
const channelId = process.env.TELEGRAM_CHANNEL_ID

if (!token) {
    const errorMsg = 'Telegram bot token not provided'
    logger.error(errorMsg)
    process.exit(1)
}

const bot = new Telegraf(token)
bot.launch().then(() => {
    logger.info('Telegram bot successfully connected.')
})

function _sendMessage(message: string) {
    if (!channelId) {
        const errorMsg = 'Telegram channelId not provided'
        logger.error(errorMsg)
        return
    }

    bot.telegram.sendMessage(channelId, message)
}

function sendNewActionNotification(actionId: string, actionMetadata: IAction) {
    let message: string = `New action [${actionId}]`

    if (actionMetadata.entity === 'articles') {
        message = `Action [${actionId}]: Article${
            actionMetadata.payloadIds.length > 1 ? 's' : ''
        } [${
            actionMetadata.action === 'add'
                ? actionMetadata.payload.title
                : actionMetadata.payloadIds.join(', ')
        }] requested to ${actionMetadata.action.toUpperCase()} by User [${actionMetadata.user}]`
    }

    _sendMessage(message)
}

function sendNewUserNofication(name: string, email: string) {
    const message = `New user [${name}, ${email}] registered in the system`

    _sendMessage(message)
}

function sendError({ code, msg }: Error, payload: string) {
    const message = `🚨 ERROR [${code}]: ${msg}: ${payload}`

    _sendMessage(message)
}

function sendWarning(message: string) {
    message = `⚠️ WARNING: ${message}`

    _sendMessage(message)
}

export const notificationService = {
    sendNewActionNotification,
    sendNewUserNofication,
    sendError
}
