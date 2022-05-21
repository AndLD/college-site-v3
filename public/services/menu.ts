import axios from 'axios'
import { menuUtils } from '../utils/menu'
import { IMenuElement } from '../utils/types'

async function fetchMenu() {
    const response: any = await axios
        .get(`http://localhost:8080/api/public/menu`)
        .catch((err) => console.log(err))

    const menu = response.data?.result?.menu

    return menuUtils.removeHiddenElements(menu) as IMenuElement[]
}

export const menuService = {
    fetchMenu
}
