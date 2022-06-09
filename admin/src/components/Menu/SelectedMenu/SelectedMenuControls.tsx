import { Button, Popconfirm } from 'antd'

function SelectedMenuControls({
    selectedMenuControlsEnabled,
    saveSelectedMenuChanges,
    resetSelectedMenuChanges
}: {
    selectedMenuControlsEnabled: boolean
    saveSelectedMenuChanges: () => void
    resetSelectedMenuChanges: () => void
}) {
    return (
        <div style={{ textAlign: 'right', margin: '0 0 16px 0' }}>
            <Popconfirm
                disabled={!selectedMenuControlsEnabled}
                title="Are you sure to reset changes?"
                onConfirm={resetSelectedMenuChanges}
                okText="Yes"
                okButtonProps={{
                    danger: true
                }}
                cancelText="No"
            >
                <Button danger disabled={!selectedMenuControlsEnabled}>
                    Reset
                </Button>
            </Popconfirm>
            <Popconfirm
                disabled={!selectedMenuControlsEnabled}
                title="Are you sure to update selected menu?"
                onConfirm={saveSelectedMenuChanges}
                okText="Yes"
                cancelText="No"
            >
                <Button
                    style={{ margin: '0 0 0 5px' }}
                    type="primary"
                    disabled={!selectedMenuControlsEnabled}
                >
                    Save
                </Button>
            </Popconfirm>
        </div>
    )
}

export default SelectedMenuControls
