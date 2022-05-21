import Image from 'next/image'
import style from '../styles/Footer.module.scss'

function Footer() {
    return (
        <footer id={style['container']}>
            <div>
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <img src="/images/logo.png" alt="logo" />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <hr />
                                <p>вулиця Туполєва, 1</p>
                                <p>Кривий Ріг, 50045</p>
                                <p>067-824-14-14</p>
                                <p>pochta@kk.nau.edu.ua</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div>
                <div className={style['footer-social-block']}>
                    <div>Приєднуйся до нас:</div>
                    <div className={style['social-links']}>
                        <a href="https://www.instagram.com/kk_nau/">
                            <img src="/images/footer/instagram.png" alt="instagram" />
                        </a>
                        <a href="https://www.facebook.com/kknauofficial/?rf=1794013074244809">
                            <img src="/images/footer/facebook.png" alt="facebook" />
                        </a>
                        <a href="https://www.youtube.com/channel/UCLWVYkhjvjMsyAwofwPY_zQ">
                            <img src="/images/footer/youtube.png" alt="youtube" />
                        </a>
                        <a href="https://t.me/kk_nau">
                            <img src="/images/footer/telegram.png" alt="telegram" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
