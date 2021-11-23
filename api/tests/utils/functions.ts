import { parseHtmlToJson } from '../../utils/functions'

export const utilFunctionTests = {
    index: () =>
        describe('utils/functions', () => {
            utilFunctionTests.parseHtmlToJson()
        }),
    parseHtmlToJson: () =>
        it('parseHtmlToJson', () => {
            expect(
                parseHtmlToJson(
                    `<p><a href="http://kk.nau.edu.ua/article/1590">Електротехнічна компанія Ertanz</a></p><p><a href="http://kk.nau.edu.ua/article/1594">Комунальне підприємство "Херсонські авіалінії"</a></p>`
                )
            ).toEqual([
                {
                    tag: 'p',
                    attributes: {},
                    children: [
                        {
                            tag: 'a',
                            attributes: { href: 'http://kk.nau.edu.ua/article/1590' },
                            children: [
                                {
                                    textContent: 'Електротехнічна компанія Ertanz',
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    tag: 'p',
                    attributes: {},
                    children: [
                        {
                            tag: 'a',
                            attributes: { href: 'http://kk.nau.edu.ua/article/1594' },
                            children: [
                                {
                                    textContent: 'Комунальне підприємство "Херсонські авіалінії"',
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ])
        })
}
