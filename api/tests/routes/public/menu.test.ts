import { useState } from '../../test-utils/hooks'
import { testRequest } from '../../test-utils/test-request'
import { menuRequests, settingsRequests } from '../../test-utils/requests'

const route = '/api/public/menu'

describe(`Menu Public Router: ${route}`, () => {
    describe('GET / --> selected menu-block', () => {
        let idState = useState()

        beforeAll(async () => {
            await menuRequests.defaultPost(idState.setState)
            await settingsRequests.putSelectedMenuId(idState.state)
        })

        afterAll(async () => {
            await menuRequests.defaultDelete(idState.state)
            await settingsRequests.putSelectedMenuId(null)
        })

        it('default', async () => {
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
                    timestamp: expect.any(Number),
                    user: expect.any(String)
                }
            }

            await testRequest({ method: 'GET', route, resBody, auth: false })
        })
    })
})
