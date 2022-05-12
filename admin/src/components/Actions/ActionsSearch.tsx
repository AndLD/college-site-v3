import Search from 'antd/lib/input/Search'
import { useContext, useState } from 'react'
import { ActionsContext } from '../../contexts'
import { actionsUtils } from '../../utils/actions'

function ActionsSearch() {
    const [isTableLoading, setIsTableLoading] = useContext(ActionsContext).isTableLoadingState
    const [searchValue, setSearchValue] = useContext(ActionsContext).searchValueState
    const [dateRangeValue, setDateRangeValue] = useContext(ActionsContext).dateRangeValueState
    const [pagination, setPagination] = useContext(ActionsContext).paginationState
    const [statusFilter, setStatusFilter] = useContext(ActionsContext).statusFilterState
    const [sort, setSort] = useContext(ActionsContext).sortState
    const fetchActions = useContext(ActionsContext).fetchActions
    const [delayedSearch, setDeleyedSearch] = useState<NodeJS.Timeout>()

    return (
        <Search
            style={{ flex: 3 }}
            placeholder="Search by ID, payload ID"
            loading={isTableLoading}
            value={searchValue}
            onChange={(event) => {
                const text = event.target.value
                setSearchValue(text)

                if (delayedSearch) {
                    clearTimeout(delayedSearch)
                }

                setDeleyedSearch(
                    setTimeout(() => {
                        fetchActions(
                            pagination,
                            actionsUtils.combineFilters({
                                newSearchValue: text,
                                dateRangeValue,
                                searchValue,
                                statusFilterState: [statusFilter, setStatusFilter]
                            }),
                            sort || 'timestamp,desc'
                        )
                    }, 500)
                )
            }}
            enterButton
        />
    )
}

export default ActionsSearch
