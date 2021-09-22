export const postMenu = {
    bodySchema: {
        _allowedProps: ['title', 'link', 'parentId', 'footer'],
        title: {
            required: true,
            type: 'string'
        },
        link: {
            required: true,
            type: 'string'
        },
        parentId: {
            required: true,
            type: 'string'
        },
        footer: {
            required: true,
            type: 'boolean'
        }
    }
}
