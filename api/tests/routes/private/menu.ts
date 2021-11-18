import { SetStateFunction } from '../../../utils/types'
import { makeRequest } from '../../test-utils/makeRequest'
import { useState } from '../../test-utils/hooks'
import { menuRequests } from '../../test-utils/defaultRequests'

const route = '/api/private/menu'

export const menuPrivateRouterTests = {
    index() {
        describe(`menuPrivateRouter: ${route}`, () => {
            this.get()
            this.post()
            this.put()
            this.delete()
        })
    },
    get: () => {
        let idState: { state: string, setState: SetStateFunction } = useState()

        describe('GET / --> menu', () => {
            it('default', () => makeRequest({ route }))
        })

        describe('GET /:id --> menu', () => {
            beforeAll(() => menuRequests.defaultPost(idState.setState))

            afterAll(() => menuRequests.defaultDelete(idState.state))

            it('default', () => makeRequest({ route, id: idState.state }))
        })
    },
    post: () => {
        describe('POST / --> menu', () => {
            it('default', async () => {
                const idState = useState()
                await menuRequests.defaultPost(idState.setState)
                await menuRequests.defaultDelete(idState.state)
            })

            it('validation: extraneous property', async () =>
                await makeRequest({
                    method: 'POST',
                    route,
                    body: {
                        menu: [],
                        a: 1
                    },
                    resBody: {
                        msg: 'Error: value.a is extraneous'
                    },
                    resCode: 400
                }))
        })
    },
    put() {
        describe('PUT /:id --> menu', () => {
            let idState: { state: string, setState: SetStateFunction } = useState()

            beforeAll(() => menuRequests.defaultPost(idState.setState))

            afterAll(() => menuRequests.defaultDelete(idState.state))

            it('default', async () => {
                const body = {
                    menu: [
                        {
                            title: 'some title',
                            link: 'some link',
                            hidden: false,
                            children: []
                        }
                    ],
                    selected: false
                }

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
                        selected: false,
                        timestamp: expect.any(Number),
                        lastUpdateTimestamp: expect.any(Number),
                        user: expect.any(String)
                    }
                }

                await makeRequest({
                    method: 'PUT',
                    route,
                    id: idState.state,
                    body,
                    resBody
                })
            })

            it('validation: extraneous property', async () =>
                await makeRequest({
                    method: 'PUT',
                    route,
                    id: idState.state,
                    body: {
                        menu: [],
                        a: 1
                    },
                    resBody: {
                        msg: 'Error: value.a is extraneous'
                    },
                    resCode: 400
                }))
        })
    },
    delete() {
        describe('DELETE /:id --> menu', () => {
            let idState: { state: string, setState: SetStateFunction } = useState()

            beforeAll(() => menuRequests.defaultPost(idState.setState))

            it('default', () => menuRequests.defaultDelete(idState.state))
        })
    }
}