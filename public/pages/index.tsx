import type { NextPage, NextPageContext } from 'next'
import { Layout, Typography } from 'antd'
import { Content, Footer, Header } from 'antd/lib/layout/layout'
import axios from 'axios'
import { useEffect } from 'react'
import Head from 'next/head'

const { Title } = Typography

const MainPage: NextPage = ({ menu }: any) => {
    useEffect(() => {
        console.log('menu', menu)
    }, [])

    return (
        <Layout
            style={{
                height: '100vh'
            }}
        >
            <Head>
                <title>ВСП «КРФК НАУ»</title>
            </Head>
            <Header style={{ height: 'auto', backgroundColor: '#002766' }}>
                <Title style={{ color: 'white' }}>Main Page</Title>
            </Header>
            <Content>
                <h1>College Site v3</h1>
            </Content>
            <Footer>© ВСП “КРФК НАУ” 2021</Footer>
        </Layout>
    )
}

export async function getServerSideProps() {
    const response: any = await axios.get(`http://localhost:8080/api/public/menu`).catch((err) => console.log(err))

    const menu = response.data

    if (!menu)
        return {
            props: {}
        }

    return {
        props: { menu }
    }
}

export default MainPage
