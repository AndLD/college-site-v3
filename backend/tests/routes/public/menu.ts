import { makeRequest } from '../../makeRequest'

const route = '/api/public/menu'

export const menuPublicRouterTests = {
    index: () => {
        describe(`menuPublicRouter: ${route}`, () => {
            menuPublicRouterTests.getMenuTests()
        })
    },
    getMenuTests: () =>
        describe('GET / --> menu', () => {
            it('default get', () => makeRequest('GET', route))
        })
}
