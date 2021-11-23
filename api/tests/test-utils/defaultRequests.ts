import { SetStateFunction } from "../../utils/types"
import { makeRequest } from "./makeRequest"

const route = '/api/private/menu'

export const menuRequests = {
    defaultPost: async function (setState?: SetStateFunction) {
        const body = {
            menu: [
                {
                    title: 'some title',
                    link: 'some link',
                    hidden: false,
                    children: []
                }
            ],
            selected: true
        }
    
        const resBody = {
            result: {
                id: expect.any(String),
                timestamp: expect.any(Number),
                user: expect.any(String),
                ...body
            }
        }
        await makeRequest(
            {
                method: 'POST',
                route,
                body,
                resBody
            },
            setState
        )
    },

    defaultDelete: (id: string) => {
        makeRequest({ method: 'DELETE', route, id })
    }
}