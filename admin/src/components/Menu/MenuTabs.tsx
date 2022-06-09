import { Tabs } from 'antd'
import MenuTable from './MenuTable'
import SelectedMenu from './SelectedMenu'

function MenuTabs() {
    return (
        <Tabs
            onChange={(activeKey: string) => localStorage.setItem('defaultActiveKey', activeKey)}
            defaultActiveKey={localStorage.getItem('defaultActiveKey') || undefined}
        >
            <Tabs.TabPane tab="Selected menu" key={1}>
                <SelectedMenu />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Menu table" key={2}>
                <MenuTable />
            </Tabs.TabPane>
        </Tabs>
    )
}

export default MenuTabs
