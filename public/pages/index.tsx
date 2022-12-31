import type { NextPage } from 'next'
import PublicLayout from '../components/PublicLayout'
import { menuService } from '../services/menu'
import { IMenuElement, IndexPageProps, INewsCombined } from '../utils/types'
import style from '../styles/Index.module.scss'
import Slider from '../components/Slider'
import NewsList from '../components/NewsList'
import { newsService } from '../services/news'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const MainPage: NextPage<IndexPageProps> = ({ menu, newsMetadatas }: IndexPageProps) => {
    const [news, setNews] = useState<INewsCombined[]>([])

    useEffect(() => {
        if (newsMetadatas.length) {
            let newsCombined = newsMetadatas.map(
                (metadata): INewsCombined => ({ metadata, image: null, content: null })
            )
            setNews(newsCombined)

            newsService.fetchNewsData(newsMetadatas, newsCombined, (newsCombined) => setNews(newsCombined))
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
                        <div id={style['offer']}>Підготовчі курси!</div>
                        {/* // TODO: Refactor (move to a new component) */}
                        {/* // TODO: Load info block data (link:string, color?: 'red', title:string)[] from API */}
                        <div className={style['desk-wrapper-info-block']}>
                            <div className={style['desk']}>
                                <div className={style['desk-title']}>
                                    Для запису на підготовчі курси для вступників 2023 року телефонуйте
                                </div>
                                <div className={style['desk-title']} style={{ color: 'red' }}>
                                    067-296-71-75
                                </div>
                                <div className={style['desk-title']}>
                                    або заповніть{' '}
                                    <Link href="https://docs.google.com/forms/d/e/1FAIpQLSeXMQWzIGzprMef2ROEGEeXRz-lOlnDqA74ESmuX2MOJcon_Q/viewform?vc=0&amp;c=0&amp;w=1&amp;flr=0&amp;usp=mail_form_link">
                                        електронну форму
                                    </Link>
                                </div>
                                <div className={style['desk-title']}>
                                    Увага! Запис на підготовчі курси триває постійно
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id={style['CONTENT']}>
                <table className={style['phrase-in-table']}>
                    <tbody>
                        <tr>
                            <td>
                                <Link href="/article/3037">На які спеціальності я можу поступити?</Link>
                            </td>
                        </tr>
                    </tbody>
                </table>

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
