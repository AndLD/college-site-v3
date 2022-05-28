import type { NextPage } from 'next'
import PublicLayout from '../components/PublicLayout'
import { menuService } from '../services/menu'
import { IMenuElement, IndexPageProps, INewsCombined, NewsListPageProps } from '../utils/types'
import style from '../styles/Index.module.scss'
import NewsList from '../components/NewsList'
import { newsService } from '../services/news'
import { useEffect, useState } from 'react'

const NewsListPage: NextPage<IndexPageProps> = ({ menu, newsMetadatas }: IndexPageProps) => {
    const [news, setNews] = useState<INewsCombined[]>([])

    useEffect(() => {
        document.title = 'Новини'

        let newsCombined = newsMetadatas.map(
            (metadata): INewsCombined => ({ metadata, image: null, content: null })
        )
        setNews(newsCombined)

        newsService.fetchNewsData(newsMetadatas, newsCombined, (newsCombined) =>
            setNews(newsCombined)
        )
    }, [])

    return (
        <PublicLayout menu={menu} news={news}>
            <div id={style['CONTENT']}>
                <NewsList />
            </div>
        </PublicLayout>
    )
}

export async function getServerSideProps() {
    const props: NewsListPageProps = {
        menu: [],
        newsMetadatas: []
    }

    const menu: IMenuElement[] = await menuService.fetchMenu()
    if (menu) {
        props.menu = menu
    }

    try {
        const newsMetadatas = await newsService.fetchNewsMetadatas(10)
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

export default NewsListPage
