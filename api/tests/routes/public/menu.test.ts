import { useState } from '../../test-utils/hooks'
import { testRequest } from '../../test-utils/test-request'
import { menuRequests, settingsRequests } from '../../test-utils/requests'

const route = '/api/public/menu'

describe(`menuPublicRouter: ${route}`, () => {
    describe('GET / --> selected menu-block', () => {
        let idState = useState()

        beforeAll((done) => {
            menuRequests
                .defaultPost(idState.setState)
                .then(() => settingsRequests.putSelectedMenuId(idState.state))
                .then(done)
        })

        afterAll((done) => {
            menuRequests
                .defaultDelete(idState.state)
                .then(() => settingsRequests.putSelectedMenuId(null))
                .then(done)
        })

        it('default', (done) => {
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

            testRequest({ method: 'GET', route, resBody }, undefined).then(done)
        })
    })
})
