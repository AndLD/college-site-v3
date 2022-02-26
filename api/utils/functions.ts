import { parse as parseHtml, HTMLElement, NodeType } from 'node-html-parser'
import { ElementChild } from './types'

// Получить значение строки между указанными строками begin и end
export function parse(str: string, begin: string, end: string) {
    const bI: number = str.indexOf(begin) + begin.length
    const eI: number = str.indexOf(end, bI)

    return str.slice(bI, eI)
}

// Конвертировать HTML-строку в JSON, валидный для отображения
export function parseHtmlToJson(htmlStr: string) {
    const html = parseHtml(htmlStr, {
        lowerCaseTagName: true,
        comment: false
    })

    const result = getChildren(html)

    return result

    function getChildren(elem: HTMLElement): ElementChild[] {
        const children = []

        for (const child of elem.childNodes as HTMLElement[]) {
            const convertedChild: ElementChild = {
                children: getChildren(child)
            }

            if (child.nodeType === NodeType.ELEMENT_NODE) {
                convertedChild.tag = child.rawTagName
                convertedChild.attributes = child.attributes
            } else if (child.nodeType === NodeType.TEXT_NODE)
                convertedChild.textContent = child.textContent

            children.push(convertedChild)
        }
        return children
    }
}

// Получить все вводные подстроки строки
export function getAllCompatibleInputForString(str: string) {
    const keywords = []

    const words = str.toLowerCase().split(' ')

    const phrases = []

    for (let i = 0; i < words.length; i++) {
        keywords.push(generateKeywords(words[i]))
        if (i > 0) {
            phrases.push(appendPreviousWord(words.slice(0, i).join(' '), keywords[i]))
        }
    }

    for (let i = words.length - 1; i >= 0; i--) {
        if (i < words.length && i > 0) {
            phrases.push(appendPreviousWord(words.slice(i - 1, i).join(' '), keywords[i]))
        }
    }

    const result = Array.from(new Set([...keywords, ...phrases].flat()))

    return result

    function generateKeywords(word: string) {
        const keywords = []

        for (let i = 0; i < word.length; i++) {
            const localStr = []
            for (let j = 0; j <= i; j++) {
                localStr.push(word[j])
            }
            keywords.push(localStr.join(''))
        }

        return keywords
    }

    function appendPreviousWord(prevWord: string, currentKeyword: string[]) {
        const newKeyword = []
        for (let i = 0; i < currentKeyword.length; i++) {
            newKeyword.push(prevWord + ' ' + currentKeyword[i])
        }
        return newKeyword
    }
}
