// function arrayBufferToBase64(data: ArrayBuffer): string {
//     return Buffer.from(data as ArrayBuffer).toString('base64')
// }

async function arrayBufferToBase64(data: ArrayBuffer): Promise<string> {
    return new Promise((resolve, _) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve((reader.result as string).split('base64,')[1])
        reader.readAsDataURL(new Blob([data]))
    })
}

export const newsUtils = {
    arrayBufferToBase64
}
