import { useContext, useEffect } from 'react'
import { PublicLayoutContext } from '../contexts'
import { IMenuElement } from '../utils/types'
import style from '../styles/Menu.module.scss'
import { v4 as uuidv4 } from 'uuid'

function Menu() {
    const menu: IMenuElement[] | undefined = useContext(PublicLayoutContext).menu

    useEffect(() => {
        console.log('menu', menu)
    }, [])

    function convertMenuElement({ title, link, children }: IMenuElement, deepLevel: number) {
        return (
            <li key={uuidv4()}>
                <a href={link}>{deepLevel + ' ' + title}</a>
            </li>
        )
    }

    return (
        <ul id={style['MENU']}>
            {menu ? (
                <>
                    {menu.map((menuElement) => convertMenuElement(menuElement, 0))}
                    <div className={style['drop-menu']}></div>
                </>
            ) : (
                <li>
                    <a href="#">
                        ⚠️ Menu not found. If you see that message contact administrator ⚠️
                    </a>
                </li>
            )}
        </ul>
    )
}

export default Menu
