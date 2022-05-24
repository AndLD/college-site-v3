const templates = {
    articles: {
        post: {
            title: 'Article adding',
            steps: [
                { title: 'Parse request body' },
                { title: 'Check OldId usage', description: 'OldId dublicate is forbidden' },
                { title: 'Process article file' },
                { title: 'Build article metadata object' },
                { title: 'Build action metadata object' },
                { title: 'Check action auto approve availability' },
                { title: 'Store action' },
                {
                    title: 'Store article'
                }
            ]
        }
    }
}

export const jobsUtils = {
    templates
}
