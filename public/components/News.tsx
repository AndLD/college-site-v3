import { INewsCombined } from '../utils/types'
import style from '../styles/Index.module.scss'
import NewsImage from './NewsImage'
import moment from 'moment'

function News({ news }: { news: INewsCombined }) {
    return (
        <a href={`/news/${news.metadata.id}`}>
            <div className={style['single-new']}>
                <div className={style['single-new-image']}>
                    <NewsImage src={news.image} />
                </div>
                <div className={style['single-new-description']}>
                    <p className={style['single-new-title']}>{news.metadata.title}</p>
                    <p className={style['single-new-date-mobile']}>
                        {moment(news.metadata.publicTimestamp).format('DD.MM.YYYY HH:mm')}
                    </p>
                    <p className={style['single-new-text']}>{news.metadata.description}</p>
                    <p className={style['single-new-date']}>
                        {moment(news.metadata.publicTimestamp).format('DD.MM.YYYY HH:mm')}
                    </p>
                </div>
            </div>
        </a>
    )
}

export default News
