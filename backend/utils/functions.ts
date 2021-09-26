import { parse as parseHtml, HTMLElement, NodeType } from 'node-html-parser'
import { Any, PageChild } from './types'

// Получить значение строки между указанными строками begin и end
export function parse(str: string, begin: string, end: string) {
    const bI: number = str.indexOf(begin) + begin.length
    const eI: number = str.indexOf(end, bI)

    return str.slice(bI, eI)
}

function getChildren(elem: HTMLElement): PageChild[] {
    const children = []

    for (const child of elem.childNodes as HTMLElement[]) {
        const convertedChild: PageChild = {
            children: getChildren(child)
        }

        if (child.nodeType === NodeType.ELEMENT_NODE) {
            convertedChild.tag = child.rawTagName
            convertedChild.attributes = child.attributes
        } else if (child.nodeType === NodeType.TEXT_NODE) convertedChild.textContent = child.textContent

        children.push(convertedChild)
    }
    return children
}

// Конвертировать HTML-строку в JSON, валидный для отображения
export function parseHtmlToJson(htmlStr: string) {
    const html = parseHtml(htmlStr, {
        lowerCaseTagName: true,
        comment: false
    })

    const result = getChildren(html)

    return result
}
