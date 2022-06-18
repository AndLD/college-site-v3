import { testRequest } from '../../test-utils/test-request'
import { useState } from '../../test-utils/hooks'
import { menuRequests } from '../../test-utils/requests'

const route = '/api/private/menu'

describe(`menuPrivateRouter: ${route}`, () => {
    let idState = useState()

    describe('GET / --> menu', () => {
        it('default', (done) => {
            testRequest({ route }).then(done)
        })
    })

    describe('GET /:id --> menu', () => {
        beforeAll((done) => {
            menuRequests.defaultPost(idState.setState).then(done)
        })

        afterAll((done) => {
            menuRequests.defaultDelete(idState.state).then(done)
        })

        it('default', (done) => {
            testRequest({ route, id: idState.state }).then(done)
        })
    })

    describe('POST / --> menu', () => {
        it('default', (done) => {
            const idState = useState()
            menuRequests
                .defaultPost(idState.setState)
                .then(() => menuRequests.defaultDelete(idState.state))
                .then(done)
        })

        it('validation: extraneous property', (done) => {
            testRequest({
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
            }).then(done)
        })
    })

    describe('PUT /:id --> menu', () => {
        let idState = useState()

        beforeAll((done) => {
            menuRequests.defaultPost(idState.setState).then(done)
        })

        afterAll((done) => {
            menuRequests.defaultDelete(idState.state).then(done)
        })

        it('default', (done) => {
            const body = {
                menu: [
                    {
                        title: 'some title',
                        link: 'some link',
                        hidden: false,
                        children: []
                    }
                ]
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
                    timestamp: expect.any(Number),
                    lastUpdateTimestamp: expect.any(Number),
                    user: expect.any(String)
                }
            }

            testRequest({
                method: 'PUT',
                route,
                id: idState.state,
                body,
                resBody
            }).then(done)
        })

        it('validation: extraneous property', (done) => {
            testRequest({
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
            }).then(done)
        })
    })

    describe('DELETE /:id --> menu', () => {
        let idState = useState()

        beforeAll((done) => {
            menuRequests.defaultPost(idState.setState).then(done)
        })

        it('default', (done) => {
            menuRequests.defaultDelete(idState.state).then(done)
        })
    })
})
