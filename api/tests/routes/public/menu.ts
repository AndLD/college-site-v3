import { SetStateFunction } from '../../../utils/types'
import { menuRequests } from '../../test-utils/defaultRequests'
import { useState } from '../../test-utils/hooks'
import { makeRequest } from '../../test-utils/makeRequest'


const route = '/api/public/menu'

export const menuPublicRouterTests = {
    index() {
        describe(`menuPublicRouter: ${route}`, () => {
            this.get()
        })
    },
    get() {
        describe('GET / --> selected menu-block', () => {
            let idState: { state: string, setState: SetStateFunction } = useState()
            
            beforeAll(() => menuRequests.defaultPost(idState.setState))

            afterAll(() => menuRequests.defaultDelete(idState.state))

            it('default', () => {
                const resBody = {
                    result: {
                        id: idState.state,
                        menu: [
                            {
                                children: [],
                                title: 'some title',
                                link: 'some link',
                                hidden: false
                            }
                        ],
                        selected: true,
                        timestamp: expect.any(Number),
                        lastUpdateTimestamp: expect.any(Number),
                        user: expect.any(String)
                    }
                }

                makeRequest({ method: 'GET', route, resBody })
            })
        })
    }
}
