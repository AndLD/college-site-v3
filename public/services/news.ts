import axios, { AxiosResponse } from 'axios'
import JSZip from 'jszip'
import { publicRoutes } from '../utils/constants'
import { newsUtils } from '../utils/news'
import { INews, INewsCombined } from '../utils/types'

async function fetchNewsMetadatas(count: number) {
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
async function fetchNewsData(
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

async function fetchPinnedNewsIds() {
    try {
        const response: any = await axios(`${publicRoutes.NEWS}/pinned`)

        const pinnedNewsIds = response.data?.result

        return pinnedNewsIds as string[]
    } catch (e) {
        console.error(`Error getting pinned news ids: ${e}`)
    }

    return []
}

async function fetchNewsMetadatasByIds(ids: string[]) {
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

export const newsService = {
    fetchNewsMetadatas,
    fetchNewsData,
    fetchPinnedNewsIds,
    fetchNewsMetadatasByIds
}
