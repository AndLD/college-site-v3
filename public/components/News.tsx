import Link from 'next/link'
import moment from 'moment'
import { PushpinOutlined } from '@ant-design/icons'
import { INewsCombined } from '../utils/types'
import style from '../styles/Index.module.scss'
import NewsImage from './NewsImage'

function News({ news }: { news: INewsCombined }) {
    return (
        <Link href={`/news/${news.metadata.id}`}>
            <a>
                <div className={style['single-new']}>
                    <div className={style['single-new-image']}>
                        <NewsImage src={news.image} />
                    </div>
                    <div className={style['single-new-description']}>
                        <p className={style['single-new-title']}>
                            {news.metadata.pinned ? <PushpinOutlined /> : null}
                            {news.metadata.title}
                        </p>
                        <p className={style['single-new-date-mobile']}>
                            {moment(news.metadata.publicTimestamp).format('DD.MM.YYYY')}
                        </p>
                        <p className={style['single-new-text']}>{news.metadata.description}</p>
                        <p className={style['single-new-date']}>
                            {moment(news.metadata.publicTimestamp).format('DD.MM.YYYY')}
                        </p>
                    </div>
                </div>
            </a>
        </Link>
    )
}

export default News
