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
        console.error(`Error getting news metadata: ${e}`)
    }

    return []
}

// Frontend only
async function fetchNewsImages(newsIds: string[]): Promise<{ [key: string]: string }> {
    const options: any = {}

    for (const id of newsIds) {
        options[id] = ['png']
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
        const name = filename.slice(0, filename.lastIndexOf('.'))
        const ext = filename.slice(filename.lastIndexOf('.') + 1)

        if (ext !== 'zip' && ext !== 'png') {
            throw new Error(`Unsupported "${ext}" file obtained`)
        }

        const blob = new Blob([response.data as Blob])

        const data = await blob.arrayBuffer()

        const result: { [key: string]: string } = {}

        if (ext === 'zip') {
            const jszip = new JSZip()

            const zip = await jszip.loadAsync(data)

            for (const filename in zip.files) {
                const name = filename.slice(0, filename.lastIndexOf('.'))
                result[name] = await newsUtils.arrayBufferToBase64(
                    await zip.files[filename].async('arraybuffer')
                )
            }
        } else if (ext === 'png') {
            result[name] = await newsUtils.arrayBufferToBase64(data)
        }

        return result
    } catch (e) {
        console.error(`Error getting images for news: ${e}`)
    }

    return {}
}

async function fetchNews(count: number): Promise<INewsCombined[]> {
    const newsMetadatas = await fetchNewsMetadatas(count)
    const newsIds = newsMetadatas.filter(({ data }) => data.png).map(({ id }) => id)

    const newsImages = await fetchNewsImages(newsIds)

    const news = newsMetadatas.map((newsMetadata) => ({
        metadata: newsMetadata,
        image: newsImages[newsMetadata.id] || null
    }))

    return news
}

export const newsService = {
    fetchNewsMetadatas,
    fetchNewsImages
}
