import { INews } from './types'

export function sortByPublicTimestamp(a: INews, b: INews) {
    if (a.publicTimestamp > b.publicTimestamp) {
        return -1
    }

    if (a.publicTimestamp < b.publicTimestamp) {
        return 1
    }

    return 0
}
