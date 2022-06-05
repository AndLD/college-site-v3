import axios, { AxiosResponse } from 'axios'
import { Blob as BlobNodeJs } from 'buffer'
import { encode as arrayBufferToBase64NodeJs } from 'base64-arraybuffer'
import { publicRoutes } from '../utils/constants'
import { IArticle } from '../utils/types'

async function fetchArticleMetadataById(id: string) {
    try {
        const response: AxiosResponse = await axios(`${publicRoutes.ARTICLE}/${id}`)

        const articleMetadata = response.data?.result

        return [articleMetadata as IArticle | null, 200]
    } catch (e: any) {
        console.error(`Error getting news metadatas by ids: ${e}`)

        if (e.toString().includes('ECONNREFUSED')) {
            return [null, 503]
        } else {
            return [null, e.response.status]
        }
    }
}

// Backend only
async function _fetchArticleDataNodeJs(
    id: string,
    requiredExt: 'html' | 'pdf'
): Promise<{ [key: string]: string }> {
    const options: any = {
        [id]: [requiredExt]
    }

    try {
        const response: AxiosResponse = await axios(`${publicRoutes.ARTICLE}/download`, {
            params: {
                ids: id
            },
            headers: {
                'download-options': JSON.stringify(options)
            },
            responseType: 'arraybuffer'
        })

        const contentDisposition = response.headers['content-disposition']

        if (!contentDisposition) {
            throw new Error('"content-disposition" response header missed')
        }

        const filename: string = contentDisposition.split('filename=')[1].replaceAll('"', '')
        const ext = filename.slice(filename.lastIndexOf('.') + 1)

        if (ext !== 'pdf' && ext !== 'html') {
            throw new Error(`Unsupported "${ext}" file obtained`)
        }

        const blob = new BlobNodeJs([response.data as BlobNodeJs])

        const data = response.data as ArrayBuffer

        const result: { [key: string]: string } = {}

        if (ext === 'pdf') {
            result[filename] = arrayBufferToBase64NodeJs(data)
        } else if (ext === 'html') {
            result[filename] = await blob.text()
        }

        return result
    } catch (e) {
        console.error(`Error getting data for article: ${e}`)
    }

    return {}
}

async function fetchArticleContentById(id: string, requiredExt: 'html' | 'pdf') {
    try {
        const newsContent = await _fetchArticleDataNodeJs(id, requiredExt)

        return newsContent
    } catch (e) {
        console.error(`Error getting article content by id: ${e}`)
    }

    return null
}

export const articlesService = {
    fetchArticleMetadataById,
    fetchArticleContentById
}
