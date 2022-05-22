import { PublicLayoutContext } from '../contexts'
import { IMenuElement, INewsCombined } from '../utils/types'
import Footer from './Footer'
import Header from './Header'
import Menu from './Menu-v2'
import UsefulLinks from './UsefulLinks'

function PublicLayout({
    children,
    menu,
    news
}: {
    children: any
    menu?: IMenuElement[]
    news?: INewsCombined[]
}) {
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
                    news
                }}
            >
                <div>{children}</div>
            </PublicLayoutContext.Provider>

            <Footer />
        </div>
    )
}

export default PublicLayout
