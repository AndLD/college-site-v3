import { ArrowDownOutlined } from '@ant-design/icons'
import { Button, Popconfirm } from 'antd'
import { SetStateAction, useContext } from 'react'
import { useDispatch } from 'react-redux'
import { NewsContext } from '../../contexts'
import { setAction, setActionModalVisibility, setActionSuccessCallback } from '../../store/actions'
import { Action, INews } from '../../utils/types'

export default function NewsTableControls() {
    const dispatch = useDispatch()

    const [pagination, setPagination] = useContext(NewsContext).paginationState
    const [isDeleteBtnLoading, setIsDeleteBtnLoading] =
        useContext(NewsContext).isDeleteBtnLoadingState
    const [isDownloadBtnLoading, setIsDownloadBtnLoading] =
        useContext(NewsContext).isDownloadBtnLoadingState
    const [selectedRows, setSelectedRows] = useContext(NewsContext).selectedRowsState
    const fetchNews = useContext(NewsContext).fetchNews
    const deleteNews = useContext(NewsContext).deleteNews
    const downloadNews = useContext(NewsContext).downloadNews
    const [pinnedNewsIds, setPinnedNewsIds] = useContext(NewsContext).pinnedNewsIdsState

    function showActionModal(newAction: Action) {
        dispatch(setAction(newAction))
        dispatch(setActionModalVisibility(true))
        dispatch(
            setActionSuccessCallback(() => {
                fetchNews(pagination, undefined, 'publicTimestamp,desc')
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
                onConfirm={deleteNews}
                okText="Yes"
                cancelText="No"
            >
                <Button
                    style={{ margin: '0 0 0 5px' }}
                    type="primary"
                    disabled={
                        selectedRows.length === 0 ||
                        selectedRows.filter((selectedRow: INews) =>
                            pinnedNewsIds.includes(selectedRow.id)
                        ).length > 0
                    }
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
                onClick={() => downloadNews()}
            ></Button>
        </div>
    )
}
