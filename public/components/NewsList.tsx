import Link from 'next/link'
import { useContext } from 'react'
import { PublicLayoutContext } from '../contexts'
import style from '../styles/Index.module.scss'
import { INewsCombined } from '../utils/types'
import News from './News'

function NewsList() {
    const news: INewsCombined[] = useContext(PublicLayoutContext).news

    return (
        <section id={style['NEWS']}>
            <div className={`${style['desk']} ${style['reset-margin']}`}>
                <div className={style['desk-title']}>Останні новини</div>
                <div className={style['desk-text']}>
                    {news.length ? (
                        <>
                            {news.map((n, i) => (
                                <News news={n} key={'News' + i} />
                            ))}
                            {news.length <= 3 && (
                                <Link href="/news">
                                    <span style={{ fontSize: 22, color: '#0600FF', cursor: 'pointer' }}>
                                        Більше новин
                                    </span>
                                </Link>
                            )}
                        </>
                    ) : (
                        <span>Новин поки що немає</span>
                    )}
                </div>
                <div className={style['ribbon']}></div>
            </div>
        </section>
    )
}

export default NewsList
