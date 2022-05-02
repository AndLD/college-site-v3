import { Button, Popconfirm } from 'antd'
import { IAction } from '../../utils/types'

export default function ActionsTableControls({
    selectedRows,
    isApproveBtnLoading,
    isDeclineBtnLoading,
    approveActions,
    declineActions
}: {
    selectedRows: IAction[]
    isApproveBtnLoading: boolean
    isDeclineBtnLoading: boolean
    approveActions: () => void
    declineActions: () => void
}) {
    return (
        <div style={{ textAlign: 'right' }}>
            <Button
                disabled={
                    selectedRows.length === 0 ||
                    selectedRows.filter((selectedRow: IAction) => selectedRow.status !== 'pending')
                        .length > 0
                }
                style={{ margin: '0 5px 0 10px' }}
                type="primary"
                loading={isApproveBtnLoading}
                onClick={approveActions}
            >
                Approve
            </Button>
            <Popconfirm
                // disabled={selectedRows.length === 0}
                title="Are you sure to decline?"
                onConfirm={declineActions}
                okText="Yes"
                cancelText="No"
            >
                <Button
                    style={{ margin: '0 0 0 5px' }}
                    type="primary"
                    danger
                    disabled={
                        selectedRows.length === 0 ||
                        selectedRows.filter(
                            (selectedRow: IAction) => selectedRow.status !== 'pending'
                        ).length > 0
                    }
                    loading={isDeclineBtnLoading}
                >
                    Decline
                </Button>
            </Popconfirm>
        </div>
    )
}
