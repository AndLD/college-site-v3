import { Layout, Typography } from 'antd'
import { Content, Footer, Header } from 'antd/lib/layout/layout'
import { RootStateOrAny, useSelector } from 'react-redux'

const { Title } = Typography

function MainPage() {
    const token = useSelector((state: RootStateOrAny) => state.app.token)

    return (
        <Layout>
            <Header style={{ height: 'auto', backgroundColor: '#002766' }}>
                <Title style={{ color: 'white' }}>Main Page</Title>
            </Header>
            <Content>
                <div style={{ textAlign: 'center', padding: 10 }}>
                    <button onClick={() => navigator.clipboard.writeText(token)}>Copy token</button>
                </div>
                <a href="/auth">Auth Page</a>
                <br />
                <a href="/profile">Profile Page</a>
            </Content>
            <Footer>© ВСП “КРФК НАУ” 2021</Footer>
        </Layout>
    )
}

export default MainPage
