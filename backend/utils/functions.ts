// Получить значение строки между указанными строками begin и end
export const parse = (str: string, begin: string, end: string) => {
    const bI: number = str.indexOf(begin) + begin.length
    const eI: number = str.indexOf(end, bI)

    return str.slice(bI, eI)
}
