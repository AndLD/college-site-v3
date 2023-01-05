import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import style from '../styles/Menu-v2.module.scss'
import { IMenuElement } from './types'

// TODO: Implement advanced 'drop-menu' component to allow increase max deep level (current deep level is 2)
function convertMenuElement({ title, link, children }: IMenuElement, deepLevel: number) {
    return (
        <li key={uuidv4()}>
            <Link href={link || '#'}>
                <a>
                    {title}
                    {deepLevel && children?.length ? (
                        <img
                            className={style['deep-drop-menu-pointer']}
                            src="/images/menu/deep-drop-menu-pointer.png"
                            alt="deep drop menu"
                        />
                    ) : null}
                </a>
            </Link>
            <div
                className={style[deepLevel === 0 ? 'drop-menu' : 'deep-drop-menu']}
                style={{ left: `${deepLevel * 100}%` }}
            >
                <ul>{children.map((menuElement) => convertMenuElement(menuElement, deepLevel + 1))}</ul>
            </div>
        </li>
    )
}

function removeHiddenElements(menuElements: IMenuElement[]) {
    return menuElements?.filter((menuElement) => {
        if (!menuElement.hidden) {
            menuElement.children = removeHiddenElements(menuElement.children)
            return true
        }
    })
}

export const menuUtils = {
    convertMenuElement,
    removeHiddenElements
}
