import Search from 'antd/lib/input/Search'
import { useContext, useState } from 'react'
import { UsersContext } from '../../contexts'

function UsersSearch() {
    const [pagination, setPagination] = useContext(UsersContext).paginationState
    const [isTableLoading, setIsTableLoading] = useContext(UsersContext).isTableLoadingState
    const [searchValue, setSearchValue] = useContext(UsersContext).searchValueState
    const [statusFilter, setStatusFilter] = useContext(UsersContext).statusFilterState
    const fetchUsers = useContext(UsersContext).fetchUsers
    const [delayedSearch, setDeleyedSearch] = useState<NodeJS.Timeout>()

    return (
        <Search
            style={{ marginBottom: 20 }}
            placeholder="Search by name"
            loading={isTableLoading}
            value={searchValue}
            onChange={(event) => {
                // TODO: Do not set status filter to 'null', instead of that create 'combineFilters' function to combine 'statusFilter' and 'searchValue' values
                setStatusFilter(null)

                const text = event.target.value
                setSearchValue(text)

                if (delayedSearch) {
                    clearTimeout(delayedSearch)
                }

                setDeleyedSearch(
                    setTimeout(() => {
                        fetchUsers(
                            pagination,
                            text ? `keywords,contains,${text.toLowerCase()}` : undefined
                        )
                    }, 500)
                )
            }}
            enterButton
        />
    )
}

export default UsersSearch
