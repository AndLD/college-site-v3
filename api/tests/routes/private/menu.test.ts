import { testRequest } from '../../test-utils/test-request'
import { useState } from '../../test-utils/hooks'
import { menuRequests } from '../../test-utils/requests'

const route = '/api/private/menu'
const nonExistentId = '123'

describe(`Menu Private Router: ${route}`, () => {
    const idState = useState()

    describe('POST / --> menu', () => {
        it('default', async () => {
            await menuRequests.defaultPost(idState.setState)
        })

        it('Should response 400: Extraneous property', async () => {
            await testRequest({
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
            })
        })

        it('Should response 401', async () => {
            await menuRequests.unauthorizedPost()
        })
    })

    describe('GET / --> menu', () => {
        it('default', async () => {
            await testRequest({ route })
        })

        it('Should response 401', async () => {
            await testRequest({ route, auth: false, resCode: 401 })
        })
    })

    describe('GET /:id --> menu', () => {
        it('default', async () => {
            await testRequest({ route, id: idState.state })
        })

        it('Should response 404', async () => {
            await testRequest({ route, id: nonExistentId, resCode: 404 })
        })

        it('Should response 401', async () => {
            await testRequest({ route, id: idState.state, auth: false, resCode: 401 })
        })
    })

    describe('PUT /:id --> menu', () => {
        it('default', async () => {
            await menuRequests.defaultPut(idState.state)
        })

        it('Should response 400: Extraneous property', async () => {
            await testRequest({
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
            })
        })

        it('Should response 404', async () => {
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

            await testRequest({
                method: 'PUT',
                route,
                id: nonExistentId,
                body,
                resCode: 404
            })
        })

        it('Should response 401', async () => {
            await menuRequests.unauthorizedPut(idState.state)
        })
    })

    describe('DELETE ?ids=id --> menu', () => {
        it('default', async () => {
            await menuRequests.defaultDelete(idState.state)
        })

        it('Should response with empty array of ids: entity does not exist', async () => {
            await testRequest({
                method: 'DELETE',
                route,
                query: { ids: nonExistentId },
                resBody: { result: [] }
            }).then()
        })

        it('Should response 401', async () => {
            await menuRequests.unauthorizedDelete(idState.state)
        })
    })
})
