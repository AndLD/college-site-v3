import { notification } from 'antd'

export const errorNotification = (description: string, message?: string) =>
    notification.error({
        message: message || 'Error',
        description
    })

export const successNotification = (description: string, message?: string) =>
    notification.success({
        message: message || 'Success',
        description
    })

export const warningNotification = (description: string, message?: string) =>
    notification.warning({
        message: message || 'Warning',
        description
    })
