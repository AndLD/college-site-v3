import Search from 'antd/lib/input/Search'
import { useContext } from 'react'
import { ArticlesContext } from '../../contexts'

function ArticlesSearch() {
    const [isTableLoading, setIsTableLoading] = useContext(ArticlesContext).isTableLoadingState
    const [pagination, setPagination] = useContext(ArticlesContext).paginationState
    const [searchValue, setSearchValue] = useContext(ArticlesContext).searchValueState
    const fetchArticles = useContext(ArticlesContext).fetchArticles

    return (
        <Search
            style={{ marginBottom: 20, flex: 1 }}
            placeholder="Search by title, description, tags, ID, old ID"
            loading={isTableLoading}
            value={searchValue}
            onChange={(event) => {
                const text = event.target.value
                setSearchValue(text)
                fetchArticles(
                    pagination,
                    text ? `keywords,contains,${text.toLowerCase()}` : undefined
                )
            }}
            enterButton
        />
    )
}

export default ArticlesSearch
