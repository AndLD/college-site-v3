import { INews, INewsCombined } from './types'

async function arrayBufferToBase64(data: ArrayBuffer): Promise<string> {
    return new Promise((resolve, _) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string).split('base64,')[1])
        reader.readAsDataURL(new Blob([data]))
    })
}

function combineNewsData(
    newsMetadatas: INews[],
    newsImages: { [key: string]: string }
): INewsCombined[] {
    return newsMetadatas.map((newsMetadata) => ({
        metadata: newsMetadata,
        image: newsImages[newsMetadata.id] || null
    }))
}

export const newsUtils = {
    arrayBufferToBase64,
    combineNewsData
}
