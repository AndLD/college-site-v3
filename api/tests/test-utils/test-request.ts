import supertest from 'supertest'
import jwt from 'jwt-simple'
import { getLogger } from '../../utils/logger'
import { Any, HttpMethod, SetStateFunction } from '../../utils/types'

const logger = getLogger('tests/test-utils/makeRequest')

const port = process.env.PORT || '8080'
const host = process.env.HOST || 'localhost'
const jwtSecret = process.env.JWT_SECRET || 'secret'

const token = jwt.encode(
    {
        email: 'test@test.com',
        name: 'Jest',
        status: 'admin'
    },
    jwtSecret
)

const url = `http://${host}:${port}`

const server: any = supertest(url)

export async function testRequest(
    {
        method = 'GET',
        route,
        id,
        query,
        body,
        resBody,
        resCode
    }: {
        method?: HttpMethod
        route: string
        id?: string | number
        query?: { [key: string]: string }
        body?: Any
        resBody?: Any
        resCode?: number
    },
    setId?: SetStateFunction
) {
    const url = `${route}${id ? `/${id}` : ''}${
        query && Object.keys(query).length
            ? `?${Object.keys(query)
                  .map((key) => `${key}=${query[key]}`)
                  .join('&')}`
            : ''
    }`

    try {
        const res: supertest.Response = await server[method.toLowerCase()](url)
            .set('Accept', /json/)
            .set('Authorization', `Bearer ${token}`)
            .send(body)
            .expect(resCode || 200)
            .expect('Content-Type', /json/)

        resBody && expect(res.body).toEqual(expect.objectContaining(resBody))

        setId && setId(res.body.result?.id)
    } catch (e) {
        throw e
    }
}
