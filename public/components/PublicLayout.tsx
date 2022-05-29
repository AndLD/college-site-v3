import { PublicLayoutContext } from '../contexts'
import { IMenuElement, INewsCombined } from '../utils/types'
import Footer from './Footer'
import Header from './Header'
import Menu from './Menu-v2'
import UsefulLinks from './UsefulLinks'
import DefaultErrorPage from 'next/error'

function PublicLayout({
    children,
    menu,
    news,
    singleNews,
    statusCode
}: {
    children: any
    menu?: IMenuElement[]
    news?: INewsCombined[]
    singleNews?: INewsCombined
    statusCode?: number
}) {
    if (statusCode && statusCode > 299) {
        return <DefaultErrorPage statusCode={statusCode} />
    }

    return (
        <div id="public-layout-container">
            <Header />
            <PublicLayoutContext.Provider
                value={{
                    menu
                }}
            >
                <Menu />
            </PublicLayoutContext.Provider>
            <UsefulLinks />
            <PublicLayoutContext.Provider
                value={{
                    news,
                    singleNews
                }}
            >
                <div>{children}</div>
            </PublicLayoutContext.Provider>

            <Footer />
        </div>
    )
}

export default PublicLayout
