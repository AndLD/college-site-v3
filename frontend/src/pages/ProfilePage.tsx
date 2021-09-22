import { Layout, Typography } from 'antd'
import { Content, Footer, Header } from 'antd/lib/layout/layout'
import LogoutButton from '../components/LogoutButton'

const { Title } = Typography

function ProfilePage() {
    return (
        <Layout>
            <Header style={{ height: 'auto', backgroundColor: '#002766' }}>
                <Title style={{ color: 'white' }}>Profile Page</Title>
            </Header>
            <Content>
                <h2>Statistic</h2>

                <LogoutButton />
                <br />
                <a href="/auth">Auth Page</a>
                <br />
                <a href="/">Main Page</a>
            </Content>
            <Footer>© ВСП “КРФК НАУ” 2021</Footer>
        </Layout>
    )
}

export default ProfilePage
