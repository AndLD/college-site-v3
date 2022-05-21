import { PublicLayoutContext } from '../contexts'
import { IMenuBlock } from '../utils/types'
import Footer from './Footer'
import Header from './Header'
import Menu from './Menu-v2'
import UsefulLinks from './UsefulLinks'

function PublicLayout({ children, menu }: { children: any; menu?: IMenuBlock }) {
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
            <div>{children}</div>
            <Footer />
        </div>
    )
}

export default PublicLayout
