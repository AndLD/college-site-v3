import type { NextPage } from 'next'
import PublicLayout from '../components/PublicLayout'
import Slider from 'react-simple-image-slider'
import { menuService } from '../services/menu'
import { IMenuElement } from '../utils/types'
import style from '../styles/Index.module.scss'
import { useEffect, useRef, useState } from 'react'

const MainPage: NextPage = ({ menu }: any) => {
    const [slides, setSlides] = useState([
        '/images/index/slider/1.jpeg',
        '/images/index/slider/2.jpeg',
        '/images/index/slider/3.jpeg',
        '/images/index/slider/4.jpeg'
    ])

    const sliderWrapperRef = useRef<any>(null)
    const [sliderWidth, setSliderWidth] = useState(0)

    useEffect(() => {
        setSliderWidth(sliderWrapperRef.current.offsetWidth)
    }, [])

    return (
        <PublicLayout menu={menu}>
            <div id={style['sky-section']}>
                <div className={style['flex']}>
                    <section ref={sliderWrapperRef} className={style['flex-child-2']}>
                        <Slider
                            width={sliderWidth}
                            height={'30vw'}
                            images={slides}
                            showBullets={true}
                            showNavs={true}
                            autoPlay={true}
                            autoPlayDelay={3}
                            // useGPURender={true}
                        />
                    </section>
                    <div className={`${style['flex-child-1']} ${style['info-block']}`}>
                        <div id={style['offer']}>Запрошуємо на навчання!</div>
                        <div className={style['desk-wrapper-info-block']}>
                            <div className={style['desk']}>
                                <div className={style['desk-title']}>
                                    <a href="/article/2446">
                                        <h3 className={style['red-link']}>
                                            ОСОБЛИВОСТІ ВСТУПУ 2022
                                        </h3>
                                    </a>
                                </div>
                                <div className={style['desk-title']}>
                                    <a href="/article/541">ПРЕЗЕНТАЦІЯ КОЛЕДЖУ ТА СПЕЦІАЛЬНОСТЕЙ</a>
                                </div>
                                <div className={style['ribbon']}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id={style['CONTENT']}>
                <table className={style['phrase-in-table']}>
                    <tbody>
                        <tr>
                            <td>На які спеціальності я можу поступити?</td>
                        </tr>
                    </tbody>
                </table>

                <div className={style['desk-wrapper']}>
                    <div className={style['desk']}>
                        <div className={style['desk-title']}>Денна форма навчання</div>
                        <div className={style['desk-text']}>
                            <div>
                                <p>Фаховий молодший бакалавр:</p>
                                <ul>
                                    <li>
                                        <a href="/article/1981">
                                            121 Інженерія програмного забезпечення
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1983">123 Комп'ютерна інженерія</a>
                                    </li>
                                    <li>
                                        <a href="/article/1971">
                                            141 Електроенергетика, електротехніка та електромеханіка
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1985">
                                            151 Автоматизація та комп`ютерно-інтегровані технології
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1977">
                                            172 Телекомунікації та радіотехніка
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1972">173 Авіоніка</a>
                                    </li>
                                    <li>
                                        <a href="/article/1976">
                                            275 Транспортні технології (повітряний транспорт)
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1973">272 Авіаційний транспорт</a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p>Бакалавр:</p>
                                <ul>
                                    <li>
                                        <a href="/article/247">123 Комп'ютерна інженерія</a>
                                    </li>
                                    <li>
                                        <a href="/article/251">
                                            141 Електроенергетика, електротехніка та електромеханіка
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/255">
                                            172 Телекомунікації та радіотехніка
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/259">272 Авіаційний транспорт</a>
                                    </li>
                                    <li>
                                        <a href="/article/170">073 Менеджмент</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className={style['ribbon']}></div>
                    </div>

                    <div className={style['desk']}>
                        <div className={style['desk-title']}>Заочна форма навчання</div>
                        <div className={style['desk-text']}>
                            <div>
                                <p>Фаховий молодший бакалавр:</p>
                                <ul>
                                    <li>
                                        <a href="/article/1983">123 Комп'ютерна інженерія</a>
                                    </li>
                                    <li>
                                        <a href="/article/1971">
                                            141 Електроенергетика, електротехніка та електромеханіка
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1985">
                                            151 Автоматизація та комп'ютерно-інтегровані технології
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1977">
                                            172 Телекомунікації та радіотехніка
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1972">173 Авіоніка</a>
                                    </li>
                                    <li>
                                        <a href="/article/1976">
                                            275 Транспортні технології (повітряний транспорт)
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/1973">272 Авіаційний транспорт</a>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <p>Бакалавр:</p>
                                <ul>
                                    <li>
                                        <a href="/article/247">123 Комп'ютерна інженерія</a>
                                    </li>
                                    <li>
                                        <a href="/article/251">
                                            141 Електроенергетика, електротехніка та електромеханіка
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/255">
                                            172 Телекомунікації та радіотехніка
                                        </a>
                                    </li>
                                    <li>
                                        <a href="/article/259">272 Авіаційний транспорт</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className={style['ribbon']}></div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
}

export async function getServerSideProps() {
    const props: {
        menu?: IMenuElement[]
    } = {}

    const menu = await menuService.fetchMenu()

    if (menu) {
        props.menu = menu
    }

    return {
        props
    }
}

export default MainPage
