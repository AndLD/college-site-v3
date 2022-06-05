import Link from 'next/link'
import style from '../styles/Header.module.scss'

// TODO: Replace 'img' tag for 'Image' component from 'next/image'
function Header() {
    return (
        <header id={style['container']}>
            <div id={style['logo']}>
                <Link href="/">
                    <a>
                        <img src="/images/logo.png" alt="logo" />
                    </a>
                </Link>
            </div>
            <div id={style['title']}>
                <div id={style['td1']}>
                    Відокремлений структурний підрозділ "Криворізький фаховий коледж Національного
                    авіаційного університету"
                </div>
                <div>
                    SEPARATED STRUCTURAL SUBDIVISION "KRYVYI RIH PROFESSIONAL COLLEGE OF NATIONAL
                    AVIATION UNIVERSITY"
                </div>
            </div>
        </header>
    )
}

export default Header
