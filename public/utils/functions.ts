import { INews } from './types'

export function sortByTimestamp(a: INews, b: INews) {
    if (a.timestamp > b.timestamp) {
        return -1
    }

    if (a.timestamp < b.timestamp) {
        return 1
    }

    return 0
}
