import type { NextPage } from 'next'
import PublicLayout from '../components/PublicLayout'
import { menuService } from '../services/menu'
import { IMenuElement, IndexPageProps, INews, INewsCombined } from '../utils/types'
import style from '../styles/Index.module.scss'
import Slider from '../components/Slider'
import NewsList from '../components/NewsList'
import { newsService } from '../services/news'
import { useEffect, useState } from 'react'
import { errorNotification } from '../utils/notifications'
import { newsUtils } from '../utils/news'
import { sortByTimestamp } from '../utils/functions'

const MainPage: NextPage<IndexPageProps> = ({ menu, newsMetadatas }: IndexPageProps) => {
    const [news, setNews] = useState<INewsCombined[]>(
        newsMetadatas.map((metadata) => ({ metadata, image: null }))
    )

    useEffect(() => {
        const newsIds = newsMetadatas.filter(({ data }) => data.png).map(({ id }) => id)

        newsService
            .fetchNewsImages(newsIds)
            .then((newsImages) => {
                const news = newsUtils.combineNewsData(newsMetadatas, newsImages)

                setNews(news)
            })
            .catch((e) => errorNotification(`Error getting news images: ${e}`))
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

    // TODO: Refactor (namings at least)
    try {
        // Unpinned news
        let resultNewsMetadatas: INews[] = []
        let resultPinnedNewsMetadatas: INews[] = []

        const resultPinnedNewsIds: string[] = []
        // Get ids of all pinned news
        let pinnedNewsIds = await newsService.fetchPinnedNewsIds()

        const newsMetadatas = await newsService.fetchNewsMetadatas(3)

        for (const newsMetadata of newsMetadatas) {
            if (pinnedNewsIds.includes(newsMetadata.id)) {
                resultPinnedNewsMetadatas.push(newsMetadata)
                resultPinnedNewsIds.push(newsMetadata.id)
            } else {
                resultNewsMetadatas.push(newsMetadata)
            }
        }

        if (resultPinnedNewsMetadatas.length < 3) {
            // Remove ids of pinned news we have already from all pinned news ids array
            pinnedNewsIds = pinnedNewsIds.filter((pinnedNewsId) => {
                return !resultPinnedNewsIds.includes(pinnedNewsId)
            })

            if (pinnedNewsIds.length) {
                const pinnedNewsMetadatas: INews[] = await newsService.fetchNewsMetadatasByIds(
                    pinnedNewsIds
                )

                resultPinnedNewsMetadatas.push(...pinnedNewsMetadatas)
            }
        }

        resultPinnedNewsMetadatas = resultPinnedNewsMetadatas.sort(sortByTimestamp).slice(0, 3)

        // Mark pinned news
        resultPinnedNewsMetadatas = resultPinnedNewsMetadatas.map((metadata) => ({
            ...metadata,
            pinned: true
        }))

        const readyNewsMetadatas = [
            ...resultPinnedNewsMetadatas,
            ...resultNewsMetadatas.sort(sortByTimestamp)
        ].slice(0, 3)

        if (readyNewsMetadatas) {
            props.newsMetadatas = readyNewsMetadatas
        }
    } catch (e) {
        console.error(`[getServerSideProps] Error getting news metadatas: ${e}`)
    }

    return {
        props
    }
}

export default MainPage
