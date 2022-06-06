import log4js from 'log4js'
import moment from 'moment'

// Настройки логирования
log4js.configure({
    appenders: {
        file: {
            type: 'file',
            filename: `logs/${moment(Date.now()).format('DD.MM.YYYY_HH-mm-ss')}.log`
        },
        con: { type: 'console' }
    },

    categories: {
        // Логирование в консоль
        // default: { appenders: ['con'], level: 'info' },
        // Логирование в файл
        // file: { appenders: ['file'], level: 'info' }
        // Логирование в файл и в консоль
        default: { appenders: ['file', 'con'], level: 'info' }
    }
})

// Примеры использования:

// logger.trace("Entering cheese testing");
// logger.debug("Got cheese");
// logger.info("Cheese is Comte");

export function getLogger(module: string) {
    // Берем логер по категории (указанной нами в конфигурациях)
    const logger = log4js.getLogger(module)

    // Значение level указывает, начиная с какого уровня важности будут отображаться логи
    // level можно изменять в любой необходимый момент
    logger.level = 'info'

    return logger
}
