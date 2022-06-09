import { INewsCombined } from './types'

async function arrayBufferToBase64(data: ArrayBuffer): Promise<string> {
    return new Promise((resolve, _) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string).split('base64,')[1])
        reader.readAsDataURL(new Blob([data]))
    })
}

async function arrayBufferToString(data: ArrayBuffer): Promise<string> {
    return new Promise((resolve, _) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsText(new Blob([data]))
    })
}

// function combineNewsData(
//     newsMetadatas: INews[],
//     newsImages: { [key: string]: string },
//     newsContent: { [key: string]: string }
// ): INewsCombined[] {s
//     return newsMetadatas.map((newsMetadata) => ({
//         metadata: newsMetadata,
//         image: newsImages[newsMetadata.id] || null,
//         content: newsContent[newsMetadata.id] || null
//     }))
// }

function attachNewsImages(
    news: INewsCombined[],
    newsImages: { [key: string]: string }
): INewsCombined[] {
    return news.map((n) => {
        if (!n.image) {
            n.image = newsImages[n.metadata.id] || null
        }
        return n
    })
}

// function attachNewsContent(
//     news: INewsCombined[],
//     newsContent: { [key: string]: string }
// ): INewsCombined[] {
//     return news.map((n) => {
//         n.content = newsContent[n.metadata.id] || null
//         return n
//     })
// }

function parseHtmlImgSrc(html: string) {
    const imgBegin = '<img'
    const imgEnd = '" />'
    const indexOfImgBegin = html.indexOf(imgBegin)
    const indexOfImgEnd = html.indexOf(imgEnd) + imgEnd.length

    const img = html.slice(indexOfImgBegin, indexOfImgEnd)

    const srcBegin = 'src="'
    const srcEnd = '" alt'
    const indexOfSrcBegin = img.indexOf(srcBegin) + srcBegin.length
    let indexOfSrcEnd = img.indexOf(srcEnd)
    if (indexOfSrcEnd === -1) {
        indexOfSrcEnd = img.indexOf(imgEnd)
    }

    const src = img.slice(indexOfSrcBegin, indexOfSrcEnd)

    return src
}

export const newsUtils = {
    arrayBufferToBase64,
    arrayBufferToString,
    attachNewsImages,
    // attachNewsContent,
    parseHtmlImgSrc
}
