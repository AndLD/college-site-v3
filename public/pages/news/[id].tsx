import type { GetServerSidePropsContext, NextPage } from 'next'
import PublicLayout from '../../components/PublicLayout'
import { menuService } from '../../services/menu'
import { IMenuElement, INewsCombined, NewsPageProps } from '../../utils/types'
import indexStyle from '../../styles/Index.module.scss'
import pageStyle from '../../styles/Page.module.scss'
import { useEffect, useState } from 'react'
import { newsService } from '../../services/news'
import moment from 'moment'

const NewsPage: NextPage<NewsPageProps> = ({
    menu,
    newsMetadata,
    newsContent,
    statusCode
}: NewsPageProps) => {
    const [news, setNews] = useState<INewsCombined>()

    useEffect(() => {
        if (newsMetadata) {
            document.title = newsMetadata.title

            const newsCombined = { metadata: newsMetadata, image: null, content: newsContent }

            if (newsMetadata.data.png && !newsMetadata.inlineMainImage) {
                newsService.fetchNewsData([newsMetadata], [newsCombined], (newsCombined) => {
                    setNews(newsCombined[0])
                })
            } else {
                setNews(newsCombined)
            }
        }
    }, [])

    return (
        <PublicLayout menu={menu} statusCode={statusCode}>
            <div id={indexStyle['CONTENT']}>
                <div className={`${pageStyle['desk-wrapper']}`}>
                    <div className={`${indexStyle['desk']} ${pageStyle['desk']}`}>
                        <div className={`${indexStyle['desk-title']} ${pageStyle['desk-title']}`}>
                            {newsMetadata?.title}
                        </div>
                        <div className={`${indexStyle['desk-text']} ${pageStyle['desk-text']}`}>
                            <div className={`${pageStyle['add-date']}`}>
                                {moment(newsMetadata?.publicTimestamp).format('DD.MM.YYYY HH:mm')}
                            </div>
                            {/* // TODO: Refactor */}
                            {news?.image && !news.metadata.inlineMainImage ? (
                                <img src={`data:image/png;base64,` + news.image} alt="News Image" />
                            ) : !news?.metadata.inlineMainImage ? (
                                <img src="/images/logo.png" alt="News Image" />
                            ) : null}
                            {news?.content ? (
                                <div dangerouslySetInnerHTML={{ __html: news.content }}></div>
                            ) : null}
                        </div>
                        <div className={indexStyle['ribbon']}></div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    )
}

export async function getServerSideProps({ query }: GetServerSidePropsContext) {
    const props: NewsPageProps = {
        menu: [],
        newsMetadata: null,
        newsContent: null
    }

    const menu: IMenuElement[] = await menuService.fetchMenu()
    if (menu) {
        props.menu = menu
    }

    try {
        // TODO: Validate id before fetching
        const id: string = query?.id as string

        const [newsMetadata, statusCode] = await newsService.fetchNewsMetadataById(id)
        if (statusCode != 200) {
            props.statusCode = statusCode
            return { props }
        }
        if (!newsMetadata) {
            props.statusCode = 404
            return { props }
        }
        props.newsMetadata = newsMetadata

        const newsContent = await newsService.fetchNewsContentById(id)
        if (!newsContent) {
            props.statusCode = 404
            return { props }
        }
        props.newsContent = newsContent[Object.keys(newsContent)[0]] || null
    } catch (e) {
        console.error(`[getServerSideProps] Error getting news data: ${e}`)
    }

    return {
        props
    }
}

export default NewsPage
