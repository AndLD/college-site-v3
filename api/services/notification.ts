import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'
import { environment } from '../utils/constants'
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

const bot: Telegraf<Context<Update>> | null = environment === 'test' ? null : new Telegraf(token)
if (bot) {
    bot.launch().then(() => {
        logger.info('Telegram bot successfully connected.')
    })
}

function _sendMessage(message: string) {
    if (!bot) {
        return
    }

    if (!channelId) {
        const errorMsg = 'Telegram channelId not provided'
        logger.error(errorMsg)
        return
    }

    bot.telegram.sendMessage(channelId, message)
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

    message = `Action [${actionId}]: ${entityName}${
        actionMetadata.payloadIds.length > 1 ? 's' : ''
    } [${
        actionMetadata.action === 'add'
            ? actionMetadata.payload.title
            : actionMetadata.payloadIds.join(', ')
    }] requested to ${actionMetadata.action.toUpperCase()} by User [${actionMetadata.user}]`

    _sendMessage(message)
}

function sendNewUserNofication(name: string, email: string) {
    if (!bot) {
        return
    }

    const message = `New user [${name}, ${email}] registered in the system`

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

export const notificationService = {
    sendNewActionNotification,
    sendNewUserNofication,
    sendError,
    sendWarning
}
