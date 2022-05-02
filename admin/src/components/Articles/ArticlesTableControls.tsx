import { DownloadOutlined } from '@ant-design/icons'
import { Button, Popconfirm } from 'antd'
import { useDispatch } from 'react-redux'
import { setAction, setActionModalVisibility, setActionSuccessCallback } from '../../store/actions'
import { Action } from '../../utils/types'

export default function ArticlesTableControls({
    selectedRows,
    deleteArticles,
    isDeleteBtnLoading,
    actionSuccessCallback,
    downloadArticles
}: {
    selectedRows: any
    deleteArticles: () => void
    isDeleteBtnLoading: boolean
    actionSuccessCallback: () => void
    downloadArticles: () => void
}) {
    const dispatch = useDispatch()

    function showActionModal(newAction: Action) {
        dispatch(setAction(newAction))
        dispatch(setActionModalVisibility(true))
        dispatch(setActionSuccessCallback(actionSuccessCallback))
    }

    return (
        <div style={{ textAlign: 'right' }}>
            <Button
                disabled={selectedRows.length}
                style={{ margin: '0 5px 0 10px' }}
                type="primary"
                onClick={() => showActionModal('Add')}
            >
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
                onConfirm={deleteArticles}
                okText="Yes"
                cancelText="No"
            >
                <Button
                    style={{ margin: '0 0 0 5px' }}
                    type="primary"
                    disabled={selectedRows.length === 0}
                    loading={isDeleteBtnLoading}
                >
                    Delete
                </Button>
            </Popconfirm>
            <Button
                style={{ margin: '0 0 0 10px' }}
                type="primary"
                disabled={selectedRows.length === 0}
                icon={<DownloadOutlined />}
                // loading={}
                onClick={() => downloadArticles()}
            ></Button>
        </div>
    )
}