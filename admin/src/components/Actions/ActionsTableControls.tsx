import { Button, Popconfirm } from 'antd'
import { useContext } from 'react'
import { ActionsContext } from '../../contexts'
import { IAction } from '../../utils/types'

export default function ActionsTableControls() {
    const [isApproveBtnLoading, setIsApproveBtnLoading] =
        useContext(ActionsContext).isApproveBtnLoadingState
    const [isDeclineBtnLoading, setIsDeclineBtnLoading] =
        useContext(ActionsContext).isDeclineBtnLoadingState
    const [selectedRows, setSelectedRows] = useContext(ActionsContext).selectedRowsState
    const updateActions = useContext(ActionsContext).updateActions

    return (
        <div style={{ textAlign: 'right', marginBottom: 15 }}>
            <Button
                disabled={
                    selectedRows.length === 0 ||
                    selectedRows.filter((selectedRow: IAction) => selectedRow.status !== 'pending')
                        .length > 0
                }
                style={{ margin: '0 5px 0 10px' }}
                type="primary"
                loading={isApproveBtnLoading}
                onClick={() => updateActions('approve')}
            >
                Approve
            </Button>
            <Popconfirm
                // disabled={selectedRows.length === 0}
                title="Are you sure to decline?"
                onConfirm={() => updateActions('decline')}
                okText="Yes"
                okButtonProps={{ danger: true }}
                cancelText="No"
            >
                <Button
                    style={{ margin: '0 0 0 5px' }}
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
