import type { GetServerSidePropsContext, NextPage } from 'next'
import PublicLayout from '../../components/PublicLayout'
import { menuService } from '../../services/menu'
import { ArticlePageProps, IMenuElement } from '../../utils/types'
import indexStyle from '../../styles/Index.module.scss'
import pageStyle from '../../styles/Page.module.scss'
import { useEffect, useState } from 'react'
import { articlesService } from '../../services/articles'
import moment from 'moment'

const ArticlePage: NextPage<ArticlePageProps> = ({
    menu,
    articleMetadata,
    articleContent,
    statusCode
}: ArticlePageProps) => {
    const [source, setSource] = useState<string>()

    useEffect(() => {
        if (articleMetadata) {
            document.title = articleMetadata.title

            if (articleMetadata.data.pdf) {
                base64ToBlob('data:application/pdf;base64,' + articleContent)
            }
        }
    }, [])

    async function base64ToBlob(base64: string) {
        const res = await fetch(base64)

        const blob = await res.blob()

        setSource(URL.createObjectURL(blob))
    }

    return (
        <PublicLayout menu={menu} statusCode={statusCode}>
            <div id={indexStyle['CONTENT']}>
                <div className={`${pageStyle['desk-wrapper']}`}>
                    <div className={`${indexStyle['desk']} ${pageStyle['desk']}`}>
                        <div className={`${indexStyle['desk-title']} ${pageStyle['desk-title']}`}>
                            {articleMetadata?.title}
                        </div>
                        <div className={`${indexStyle['desk-text']} ${pageStyle['desk-text']}`}>
                            <div className={`${pageStyle['add-date']}`}>
                                {moment(articleMetadata?.publicTimestamp).format(
                                    'DD.MM.YYYY HH:mm'
                                )}
                            </div>

                            {articleMetadata && articleContent ? (
                                articleMetadata.data.html ? (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: articleContent
                                        }}
                                    ></div>
                                ) : articleMetadata.data.pdf ? (
                                    <iframe width="100%" style={{ height: '90vh' }} src={source} />
                                ) : (
                                    'Something went wrong'
                                )
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
    const props: ArticlePageProps = {
        menu: [],
        articleMetadata: null,
        articleContent: null
    }

    const menu: IMenuElement[] = await menuService.fetchMenu()
    if (menu) {
        props.menu = menu
    }

    try {
        // TODO: Validate id before fetching
        const id: string = query?.id as string

        const [articleMetadata, statusCode] = await articlesService.fetchArticleMetadataById(id)
        if (statusCode !== 200) {
            props.statusCode = statusCode
            return { props }
        }
        if (!articleMetadata) {
            props.statusCode = 404
            return { props }
        }
        props.articleMetadata = articleMetadata

        const ext = articleMetadata.data.html ? 'html' : 'pdf'

        const articleContent = await articlesService.fetchArticleContentById(id, ext)
        if (!articleContent || !Object.keys(articleContent).length) {
            props.statusCode = 404
            return { props }
        }

        props.articleContent = articleContent[Object.keys(articleContent)[0]] || null
    } catch (e) {
        console.error(`[getServerSideProps] Error getting article data: ${e}`)
    }

    return {
        props
    }
}

export default ArticlePage
