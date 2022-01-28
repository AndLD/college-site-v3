import { Button, Popconfirm } from 'antd'
import { useDispatch } from 'react-redux'
import { setAction, setActionModalVisibility } from '../../../store/actions'
import { Action } from '../../../utils/types'

export default function MenuTableControls({ selectedRows, deleteMenu }: { selectedRows: any; deleteMenu: any }) {
    const dispatch = useDispatch()

    function showActionModal(newAction: Action) {
        dispatch(setAction(newAction))
        dispatch(setActionModalVisibility(true))
    }

    return (
        <div style={{ textAlign: 'right', margin: '0 0 16px 0' }}>
            <Button style={{ margin: '0 5px' }} type="primary" onClick={() => showActionModal('Add')}>
                Add
            </Button>
            <Button
                style={{ margin: '0 5px' }}
                type="primary"
                disabled={selectedRows.length !== 1}
                onClick={() => showActionModal('Update')}
            >
                Update
            </Button>
            <Popconfirm
                disabled={selectedRows.length === 0}
                title="Are you sure to delete?"
                onConfirm={deleteMenu}
                okText="Yes"
                cancelText="No"
            >
                <Button style={{ margin: '0 0 0 5px' }} type="primary" disabled={selectedRows.length === 0}>
                    Delete
                </Button>
            </Popconfirm>
        </div>
    )
}
