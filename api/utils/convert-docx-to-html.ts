import mammoth from 'mammoth'

export async function convertDocxToHtml(docxBuffer: Buffer) {
    try {
        return await mammoth.convertToHtml({ buffer: docxBuffer })
    } catch (e) {
        throw new Error(`Failed to convert DOCX to HTML with error: ${e}`)
    }
}
