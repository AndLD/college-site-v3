import { generateKey } from 'fast-key-generator'
import MenuTreeElement from '../components/Menu/SelectedMenu/MenuTreeElement'
import { errorNotification } from './notifications'
import { IMenuBlockUpdate, IMenuElement, IMenuElementOfTree } from './types'

export function configMenu(
    specifiedMenu: IMenuElement[],
    treeDataUpdatesState: [IMenuBlockUpdate[], any],
    errorCallback?: () => void
) {
    try {
        const menu = JSON.parse(JSON.stringify(specifiedMenu))

        if (!menu) return

        for (const elem of menu as IMenuElementOfTree[]) {
            configElem(elem)
        }

        return menu as IMenuElementOfTree[]
    } catch {
        errorCallback && errorCallback()
    }

    function configElem(elem: IMenuElementOfTree) {
        if (!elem.title || !elem.children) {
            throw 1
        }
        elem.key = generateKey({})
        elem.title = (
            <MenuTreeElement
                elem={{
                    title: elem.title,
                    hidden: elem.hidden || false,
                    link: elem.link,
                    key: elem.key
                }}
                treeDataUpdatesState={treeDataUpdatesState}
            />
        )

        for (const child of elem.children as IMenuElementOfTree[]) {
            configElem(child)
        }
    }
}

export function deconfigMenu(treeData: IMenuElementOfTree[]) {
    const menu = treeData

    if (!menu) return

    const deconfiguredMenu = []

    for (const elem of menu as IMenuElement[]) {
        deconfiguredMenu.push(deconfigElem(elem))
    }

    return deconfiguredMenu

    function deconfigElem(elem: IMenuElement) {
        const title = (elem.title as any).props.elem.title
        const deconfiguredElem = {
            title,
            link: elem.link,
            hidden: elem.hidden,
            children: []
        } as IMenuElement

        for (const child of elem.children as IMenuElement[]) {
            deconfiguredElem.children.push(deconfigElem(child))
        }

        return deconfiguredElem
    }
}
