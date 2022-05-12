import { ArrowDownOutlined } from '@ant-design/icons'
import { Button, Popconfirm } from 'antd'
import { useContext } from 'react'
import { useDispatch } from 'react-redux'
import { ArticlesContext } from '../../contexts'
import { setAction, setActionModalVisibility, setActionSuccessCallback } from '../../store/actions'
import { Action } from '../../utils/types'

export default function ArticlesTableControls() {
    const dispatch = useDispatch()

    const [pagination, setPagination] = useContext(ArticlesContext).paginationState
    const [isDeleteBtnLoading, setIsDeleteBtnLoading] =
        useContext(ArticlesContext).isDeleteBtnLoadingState
    const [isDownloadBtnLoading, setIsDownloadBtnLoading] =
        useContext(ArticlesContext).isDownloadBtnLoadingState
    const [selectedRows, setSelectedRows] = useContext(ArticlesContext).selectedRowsState
    const fetchArticles = useContext(ArticlesContext).fetchArticles
    const deleteArticles = useContext(ArticlesContext).deleteArticles
    const downloadArticles = useContext(ArticlesContext).downloadArticles

    function showActionModal(newAction: Action) {
        dispatch(setAction(newAction))
        dispatch(setActionModalVisibility(true))
        dispatch(
            setActionSuccessCallback(() => {
                fetchArticles(pagination)
                setSelectedRows([])
            })
        )
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
                icon={<ArrowDownOutlined />}
                loading={isDownloadBtnLoading}
                onClick={() => downloadArticles()}
            ></Button>
        </div>
    )
}
