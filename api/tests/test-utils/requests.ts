import { SetStateFunction } from '../../utils/types'
import { testRequest } from './test-request'

export const menuRequests = {
    route: '/api/private/menu',
    defaultPost: function (setState?: SetStateFunction) {
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

    defaultDelete: function (id: string) {
        return testRequest({ method: 'DELETE', route: this.route, query: { ids: id } })
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
