import { useContext, useEffect } from 'react'
import { PublicLayoutContext } from '../contexts'
import { INewsCombined } from '../utils/types'
import style from '../styles/Index.module.scss'
import News from './News'
import Link from 'next/link'

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
                                    <span style={{ fontSize: 22 }}>Більше новин</span>
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
