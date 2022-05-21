import { useContext } from 'react'
import { PublicLayoutContext } from '../contexts'
import { IMenuElement } from '../utils/types'
import style from '../styles/Menu-v2.module.scss'
import { menuUtils } from '../utils/menu'

function Menu() {
    const menu: IMenuElement[] | undefined = useContext(PublicLayoutContext).menu

    return (
        <>
            <div className={style['small-menu-button']}>Меню</div>
            <section className={style['menu-wrapper']}>
                <div className={style['small-menu-close-button']}></div>
                <ul id={style['MENU']}>
                    {menu ? (
                        menu.map((menuElement) => menuUtils.convertMenuElement(menuElement, 0))
                    ) : (
                        <li>
                            <a href="#">
                                ⚠️ Menu not found. If you see that message contact administrator ⚠️
                            </a>
                        </li>
                    )}
                </ul>
            </section>
        </>
    )
}

export default Menu
