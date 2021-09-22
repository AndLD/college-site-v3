import { Layout, Typography } from 'antd'
import { Content, Footer, Header } from 'antd/lib/layout/layout'

const { Title } = Typography

function MainPage() {
    return (
        <Layout>
            <Header style={{ height: 'auto', backgroundColor: '#002766' }}>
                <Title style={{ color: 'white' }}>Main Page</Title>
            </Header>
            <Content>
                <a href="/auth">Auth Page</a>
                <br />
                <a href="/profile">Profile Page</a>
            </Content>
            <Footer>© ВСП “КРФК НАУ” 2021</Footer>
        </Layout>
    )
}

export default MainPage
