import { SetStateFunction, State } from '../../utils/types'
import { testRequest } from './test-request'

export const menuRequests = {
    route: '/api/private/menu',

    defaultBody: {
        menu: [
            {
                title: 'some title',
                link: 'some link',
                hidden: false,
                children: []
            }
        ]
    },

    defaultPost: function (setState?: SetStateFunction) {
        const body = this.defaultBody

        const resBody = {
            result: {
                id: expect.any(String),
                timestamp: expect.any(Number),
                user: expect.any(String),
                ...body
            }
        }

        return testRequest(
            {
                method: 'POST',
                route: this.route,
                body,
                resBody
            },
            setState
        )
    },

    unauthorizedPost: function () {
        const body = this.defaultBody

        return testRequest({
            method: 'POST',
            route: this.route,
            body,
            auth: false,
            resCode: 401
        })
    },

    defaultPut: function (id: string) {
        const body = this.defaultBody

        const resBody = {
            result: {
                id,
                ...this.defaultBody,
                timestamp: expect.any(Number),
                lastUpdateTimestamp: expect.any(Number),
                user: expect.any(String)
            }
        }

        return testRequest({
            method: 'PUT',
            route: this.route,
            id,
            body,
            resBody
        })
    },

    unauthorizedPut: function (id: string) {
        const body = this.defaultBody

        return testRequest({
            method: 'PUT',
            route: this.route,
            id,
            body,
            auth: false,
            resCode: 401
        })
    },

    defaultDelete: function (id: string) {
        return testRequest({
            method: 'DELETE',
            route: this.route,
            query: { ids: id },
            resBody: {
                result: [id]
            }
        })
    },

    unauthorizedDelete: function (id: string) {
        return testRequest({
            method: 'DELETE',
            route: this.route,
            query: { ids: id },
            auth: false,
            resCode: 401
        })
    }
}

export const settingsRequests = {
    route: '/api/private/settings',
    putSelectedMenuId: function (id: string | null) {
        const body = {
            selectedMenuId: id
        }

        const resBody = {
            result: true
        }

        return testRequest({
            method: 'PUT',
            route: this.route,
            body,
            resBody
        })
    }
}
