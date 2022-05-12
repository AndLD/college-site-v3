function blobToBase64(blob: Blob) {
    return new Promise((resolve, _) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
    })
}

function showDownloadDialog(filename: string, objectUrl: string) {
    const url = objectUrl
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
}

export const previewUtils = {
    blobToBase64,
    showDownloadDialog
}
