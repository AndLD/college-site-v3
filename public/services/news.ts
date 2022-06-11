import axios, { AxiosError, AxiosResponse } from 'axios'
import JSZip from 'jszip'
import { publicRoutes } from '../utils/constants-backend'
import { sortByPublicTimestamp } from '../utils/functions'
import { newsUtils } from '../utils/news'
import { errorNotification } from '../utils/notifications'
import { INews, INewsCombined } from '../utils/types'
import { encode as arrayBufferToBase64NodeJs } from 'base64-arraybuffer'
import { Blob as BlobNodeJs } from 'buffer'
import { nginxPublicRoutes } from '../utils/constants-frontend'

// TODO: Refactor hole file

async function _fetchNewsMetadatas(count: number, tags?: string[]) {
    try {
        const response: any = await axios(publicRoutes.NEWS, {
            params: {
                page: 1,
                results: count,
                order: 'publicTimestamp,desc',
                filters: tags?.length
                    ? tags.map((tag) => `tags,contains,${tag}`).join(';')
                    : undefined
            }
        })

        const newsMetadatas = response.data?.result

        return (newsMetadatas as INews[]) || []
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
        const response: AxiosResponse = await axios(`${nginxPublicRoutes.NEWS}/download`, {
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
        console.error(`Error getting data for news: ${e}`)
    }

    return {}
}

// Backend only
async function _fetchNewsDataNodeJs(
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

        const blob = new BlobNodeJs([response.data as BlobNodeJs])

        const data = await blob.arrayBuffer()

        const result: { [key: string]: string } = {}

        if (ext === 'zip') {
            const jszip = new JSZip()

            const zip = await jszip.loadAsync(data)

            for (const filename in zip.files) {
                const data = await zip.files[filename].async('arraybuffer')

                const ext = filename.slice(filename.lastIndexOf('.') + 1)

                if (ext === 'png') {
                    result[filename] = await arrayBufferToBase64NodeJs(data)
                } else if (ext === 'html') {
                    result[filename] = await blob.text()
                }
            }
        } else if (ext === 'png') {
            result[filename] = await arrayBufferToBase64NodeJs(data)
        } else if (ext === 'html') {
            result[filename] = await blob.text()
        }

        return result
    } catch (e) {
        console.error(`Error getting data for news: ${e}`)
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

    if (newsIds.requestsImage.length) {
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

    if (newsIds.requestsInlineMainImage.length) {
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

async function _fetchNewsMetadatasByIdsAndTags(ids: string[], tags?: string[]) {
    try {
        const response: any = await axios(publicRoutes.NEWS, {
            params: {
                ids: ids.join(','),
                filters: tags?.length
                    ? tags.map((tag) => `tags,contains,${tag}`).join(';')
                    : undefined,
                order: 'publicTimestamp,desc'
            }
        })

        const newsMetadatas = response.data?.result || []

        return newsMetadatas as INews[]
    } catch (e) {
        console.error(`Error getting news metadatas by ids: ${e}`)
    }

    return []
}

// TODO: Refactor (namings at least)
async function fetchNewsMetadatas(count: number, tags?: string[]) {
    // Unpinned news
    let resultNewsMetadatas: INews[] = []
    let resultPinnedNewsMetadatas: INews[] = []

    const resultPinnedNewsIds: string[] = []
    // Get ids of all pinned news
    let pinnedNewsIds = await _fetchPinnedNewsIds()

    const newsMetadatas = await _fetchNewsMetadatas(count, tags)

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
            const pinnedNewsMetadatas: INews[] = await _fetchNewsMetadatasByIdsAndTags(
                pinnedNewsIds,
                tags
            )

            resultPinnedNewsMetadatas.push(...pinnedNewsMetadatas)
        }
    }

    resultPinnedNewsMetadatas = resultPinnedNewsMetadatas
        .sort(sortByPublicTimestamp)
        .slice(0, count)

    // Mark pinned news
    resultPinnedNewsMetadatas = resultPinnedNewsMetadatas.map((metadata) => ({
        ...metadata,
        pinned: true
    }))

    const readyNewsMetadatas = [
        ...resultPinnedNewsMetadatas,
        ...resultNewsMetadatas.sort(sortByPublicTimestamp)
    ].slice(0, count)

    return readyNewsMetadatas
}

async function fetchNewsMetadataById(id: string) {
    try {
        const response: AxiosResponse = await axios(`${publicRoutes.NEWS}/${id}`)

        const newsMetadata = response.data?.result

        return [newsMetadata as INews | null, 200]
    } catch (e: any) {
        console.error(`Error getting news metadatas by ids: ${e}`)

        if (e.toString().includes('ECONNREFUSED')) {
            return [null, 503]
        } else {
            return [null, e.response.status]
        }
    }
}

async function fetchNewsContentById(id: string) {
    try {
        const newsContent = await _fetchNewsDataNodeJs([id], ['html'])

        return newsContent
    } catch (e) {
        console.error(`Error getting news content by id: ${e}`)
    }

    return null
}

export const newsService = {
    fetchNewsData,
    fetchNewsMetadatas,
    fetchNewsMetadataById,
    fetchNewsContentById
}
