import dotenv from 'dotenv'
import supertest from 'supertest'
import { getLogger } from '../../utils/logger'
import { Any, HttpMethod, SetStateFunction } from '../../utils/types'

dotenv.config()

const logger = getLogger('tests/test-utils/makeRequest')

const token = process.env.GOOGLE_AUTH_TOKEN
const port = process.env.PORT
const host = process.env.HOST || '127.0.0.1'
if (!token || !port) {
    logger.error('Unable to start tests: GOOGLE_AUTH_TOKEN or server PORT is not specified!')
    process.exit(1)
}

const server: any = supertest(`http://${host}:${port}`)

export async function makeRequest(
    {
        method,
        route,
        id,
        body,
        resBody,
        resCode
    }: {
        method?: HttpMethod
        route: string
        id?: string | number
        body?: Any
        resBody?: Any
        resCode?: number
    },
    setId?: SetStateFunction,
    done?: jest.DoneCallback
) {
    const url = `${route}${id ? `/${id}` : ''}`

    const res: supertest.Response = await server[method ? method.toLowerCase() : 'get'](url)
        .set('Accept', /json/)
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(resCode || 200)
        .expect('Content-Type', /json/)

    resBody && expect(res.body).toEqual(expect.objectContaining(resBody))

    setId && setId(res.body.result?.id)

    done && done()
}
