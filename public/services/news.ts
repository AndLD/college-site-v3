import axios, { AxiosResponse } from 'axios'
import JSZip from 'jszip'
import { publicRoutes } from '../utils/constants'
import { sortByTimestamp } from '../utils/functions'
import { newsUtils } from '../utils/news'
import { errorNotification } from '../utils/notifications'
import { INews, INewsCombined } from '../utils/types'

async function _fetchNewsMetadatas(count: number) {
    try {
        const response: any = await axios(publicRoutes.NEWS, {
            params: {
                page: 1,
                results: count,
                order: 'timestamp,desc'
            }
        })

        const newsMetadatas = response.data?.result

        return newsMetadatas as INews[]
    } catch (e) {
        console.error(`Error getting news metadatas: ${e}`)
    }

    return []
}

// Frontend only
async function _fetchNewsData(
    newsIds: string[],
    requestedExt: ('html' | 'png')[]
): Promise<{ [key: string]: string }> {
    const options: any = {}

    for (const id of newsIds) {
        options[id] = requestedExt
    }

    try {
        const response: AxiosResponse = await axios(`${publicRoutes.NEWS}/download`, {
            params: {
                ids: newsIds.join(',')
            },
            headers: {
                'download-options': JSON.stringify(options)
            },
            responseType: 'blob'
        })

        const contentDisposition = response.headers['content-disposition']

        if (!contentDisposition) {
            throw new Error('"content-disposition" response header missed')
        }

        const filename: string = contentDisposition.split('filename=')[1].replaceAll('"', '')
        const ext = filename.slice(filename.lastIndexOf('.') + 1)

        if (ext !== 'zip' && ext !== 'png' && ext !== 'html') {
            throw new Error(`Unsupported "${ext}" file obtained`)
        }

        const blob = new Blob([response.data as Blob])

        const data = await blob.arrayBuffer()

        const result: { [key: string]: string } = {}

        if (ext === 'zip') {
            const jszip = new JSZip()

            const zip = await jszip.loadAsync(data)

            for (const filename in zip.files) {
                const data = await zip.files[filename].async('arraybuffer')

                const ext = filename.slice(filename.lastIndexOf('.') + 1)

                if (ext === 'png') {
                    result[filename] = await newsUtils.arrayBufferToBase64(data)
                } else if (ext === 'html') {
                    result[filename] = await newsUtils.arrayBufferToString(data)
                }
            }
        } else if (ext === 'png') {
            result[filename] = await newsUtils.arrayBufferToBase64(data)
        } else if (ext === 'html') {
            result[filename] = await newsUtils.arrayBufferToString(data)
        }

        return result
    } catch (e) {
        console.error(`Error getting images for news: ${e}`)
    }

    return {}
}

function fetchNewsData(
    newsMetadatas: INews[],
    newsCombined: INewsCombined[],
    callback: (newsCombined: INewsCombined[]) => void
) {
    const newsIds = {
        requestsImage: newsMetadatas
            .filter(({ data, inlineMainImage }) => !inlineMainImage && data.png)
            .map(({ id }) => id),
        requestsInlineMainImage: newsMetadatas
            .filter(({ inlineMainImage }) => inlineMainImage)
            .map(({ id }) => id)
    }

    if (newsIds.requestsImage) {
        _fetchNewsData(newsIds.requestsImage, ['png'])
            .then((newsImages) => {
                const modifiedNewsImages: { [key: string]: string } = {}

                for (const filename in newsImages) {
                    modifiedNewsImages[filename.replace('.png', '')] = newsImages[filename]
                }

                newsCombined = newsUtils.attachNewsImages(newsCombined, modifiedNewsImages)

                callback(newsCombined)
            })
            .catch((e) => errorNotification(`Error getting news images: ${e}`))
    }

    if (newsIds.requestsInlineMainImage) {
        _fetchNewsData(newsIds.requestsInlineMainImage, ['html'])
            .then((newsContent) => {
                const newsImages: { [key: string]: string } = {}

                for (const filename in newsContent) {
                    const html = newsContent[filename]

                    const src = newsUtils.parseHtmlImgSrc(html)

                    newsImages[filename.replace('.html', '')] = src
                }

                newsCombined = newsUtils.attachNewsImages(newsCombined, newsImages)

                callback(newsCombined)
            })
            .catch((e) => errorNotification(`Error getting news images: ${e}`))
    }
}

async function _fetchPinnedNewsIds() {
    try {
        const response: any = await axios(`${publicRoutes.NEWS}/pinned`)

        const pinnedNewsIds = response.data?.result

        return pinnedNewsIds as string[]
    } catch (e) {
        console.error(`Error getting pinned news ids: ${e}`)
    }

    return []
}

async function _fetchNewsMetadatasByIds(ids: string[]) {
    try {
        const response: any = await axios(publicRoutes.NEWS, {
            params: {
                ids: ids.join(',')
            }
        })

        const newsMetadatas = response.data?.result

        return newsMetadatas as INews[]
    } catch (e) {
        console.error(`Error getting news metadatas by ids: ${e}`)
    }

    return []
}

// TODO: Refactor (namings at least)
async function fetchNewsMetadatas(count: number) {
    // Unpinned news
    let resultNewsMetadatas: INews[] = []
    let resultPinnedNewsMetadatas: INews[] = []

    const resultPinnedNewsIds: string[] = []
    // Get ids of all pinned news
    let pinnedNewsIds = await _fetchPinnedNewsIds()

    const newsMetadatas = await _fetchNewsMetadatas(count)

    for (const newsMetadata of newsMetadatas) {
        if (pinnedNewsIds.includes(newsMetadata.id)) {
            resultPinnedNewsMetadatas.push(newsMetadata)
            resultPinnedNewsIds.push(newsMetadata.id)
        } else {
            resultNewsMetadatas.push(newsMetadata)
        }
    }

    if (resultPinnedNewsMetadatas.length < count) {
        // Remove ids of pinned news we have already from all pinned news ids array
        pinnedNewsIds = pinnedNewsIds.filter((pinnedNewsId) => {
            return !resultPinnedNewsIds.includes(pinnedNewsId)
        })

        if (pinnedNewsIds.length) {
            const pinnedNewsMetadatas: INews[] = await _fetchNewsMetadatasByIds(pinnedNewsIds)

            resultPinnedNewsMetadatas.push(...pinnedNewsMetadatas)
        }
    }

    resultPinnedNewsMetadatas = resultPinnedNewsMetadatas.sort(sortByTimestamp).slice(0, count)

    // Mark pinned news
    resultPinnedNewsMetadatas = resultPinnedNewsMetadatas.map((metadata) => ({
        ...metadata,
        pinned: true
    }))

    const readyNewsMetadatas = [
        ...resultPinnedNewsMetadatas,
        ...resultNewsMetadatas.sort(sortByTimestamp)
    ].slice(0, count)

    return readyNewsMetadatas
}

export const newsService = {
    fetchNewsData,
    fetchNewsMetadatas
}
