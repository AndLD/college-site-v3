import type { NextPage } from 'next'
import PublicLayout from '../components/PublicLayout'
import { menuService } from '../services/menu'
import { IMenuElement, IndexPageProps, INews, INewsCombined } from '../utils/types'
import style from '../styles/Index.module.scss'
import Slider from '../components/Slider'
import NewsList from '../components/NewsList'
import { newsService } from '../services/news'
import { useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'

const MainPage: NextPage<IndexPageProps> = ({ menu, newsMetadatas }: IndexPageProps) => {
    const [news, setNews] = useState<INewsCombined[]>([])

    useEffect(() => {
        if (newsMetadatas.length) {
            let newsCombined = newsMetadatas.map(
                (metadata): INewsCombined => ({ metadata, image: null, content: null })
            )
            setNews(newsCombined)

            newsService.fetchNewsData(newsMetadatas, newsCombined, (newsCombined) =>
                setNews(newsCombined)
            )
        }
    }, [])

    return (
        <PublicLayout menu={menu} news={news}>
            <div id={style['sky-section']}>
                <div className={style['flex']}>
                    <section className={style['flex-child-2']}>
                        <Slider />
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
                                <div
                                    className={style['ribbon']}
                                    // TODO: Refactor
                                    style={{ visibility: isMobile ? 'hidden' : 'visible' }}
                                ></div>
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
                    <div className={`${style['desk']} ${style['desk-left']}`}>
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

                    <div className={`${style['desk']} ${style['desk-right']}`}>
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

                <NewsList />
            </div>
        </PublicLayout>
    )
}

export async function getServerSideProps() {
    const props: IndexPageProps = {
        menu: [],
        newsMetadatas: []
    }

    const menu: IMenuElement[] = await menuService.fetchMenu()
    if (menu) {
        props.menu = menu
    }

    try {
        const newsMetadatas = await newsService.fetchNewsMetadatas(3)
        if (newsMetadatas) {
            props.newsMetadatas = newsMetadatas
        }
    } catch (e) {
        console.error(`[getServerSideProps] Error getting news metadatas: ${e}`)
    }

    return {
        props
    }
}

export default MainPage
