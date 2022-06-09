import axios from 'axios'
import { publicRoutes } from '../utils/constants-backend'
import { menuUtils } from '../utils/menu'
import { IMenuElement } from '../utils/types'

async function fetchMenu() {
    try {
        const response: any = await axios(publicRoutes.MENU)

        const menu = response.data?.result?.menu

        return menuUtils.removeHiddenElements(menu) as IMenuElement[]
    } catch (e) {
        console.error(`Error getting menu: ${e}`)
    }

    return []
}

export const menuService = {
    fetchMenu
}
