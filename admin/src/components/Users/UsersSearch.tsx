import Search from 'antd/lib/input/Search'
import { useContext } from 'react'
import { UsersContext } from '../../contexts'

function UsersSearch() {
    const [pagination, setPagination] = useContext(UsersContext).paginationState
    const [isTableLoading, setIsTableLoading] = useContext(UsersContext).isTableLoadingState
    const [searchValue, setSearchValue] = useContext(UsersContext).searchValueState
    const [statusFilter, setStatusFilter] = useContext(UsersContext).statusFilterState
    const fetchUsers = useContext(UsersContext).fetchUsers

    return (
        <Search
            style={{ marginBottom: 20 }}
            placeholder="Search by name"
            loading={isTableLoading}
            value={searchValue}
            onChange={(event) => {
                const text = event.target.value
                setSearchValue(text)
                setStatusFilter(null)
                fetchUsers(pagination, text ? `keywords,contains,${text.toLowerCase()}` : undefined)
            }}
            enterButton
        />
    )
}

export default UsersSearch
