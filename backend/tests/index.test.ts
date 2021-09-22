import dotenv from 'dotenv'
import request from 'supertest'
import logger from '../utils/logger'
import { Any, HttpMethod } from '../utils/types'

dotenv.config()

export const token = process.env.GOOGLE_AUTH_TOKEN
if (!token) {
    logger.error('GOOGLE_AUTH_TOKEN not found!')
    process.exit(1)
}

const port = process.env.PORT
const host = process.env.HOST
if (!host || !port) {
    logger.error('HOST or PORT not found!')
    process.exit(1)
}

const server = request(`http://${host}:${port}`)

const makeRequest = (server: any, method: HttpMethod, route: string, body?: Any) =>
    server[method.toLowerCase()](route)
        .set('Accept', /json/)
        .set('Auth', `Bearer ${token}`)
        .send(body)
        .expect(200)
        .expect('Content-Type', /json/)
        .then((res: any) => {
            expect(res.body).toEqual(
                expect.objectContaining({
                    result: expect.any(Object)
                })
            )
            logger.debug(res.body)
        })

// describe('menuRouter: /api/finance/menu', () => {
//     describe('POST / --> add new menu', () => {
//         it('default post', () =>
//             makeRequest(server, 'POST', '/api/protected/menu', {

//             }))
//     })
// })
