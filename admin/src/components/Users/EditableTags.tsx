import { PlusOutlined } from '@ant-design/icons'
import { Input, Tag } from 'antd'
import { generateKey } from 'fast-key-generator'
import { useEffect, useState } from 'react'

function EditableTags({
    tags: initialTags,
    onSave,
    isNewTagBtnVisible
}: {
    tags: string[]
    onSave: (newTags: string[]) => void
    isNewTagBtnVisible?: boolean
}) {
    const [tags, setTags] = useState<string[]>(initialTags || [])
    const [newTag, setNewTag] = useState<string>('')
    const [editMode, setEditMode] = useState<boolean>(false)

    useEffect(() => {
        setTags(initialTags || [])
    }, [initialTags])

    return (
        <div className="users-tags-cell" style={{ minHeight: '15px' }}>
            {tags.map((tag: string) => (
                <Tag
                    closable
                    onClose={(event) => {
                        event.preventDefault()
                        const newTags = tags.filter((currentTag: string) => currentTag !== tag)
                        setTags(newTags)
                        onSave(newTags)
                    }}
                    key={generateKey({})}
                >
                    {tag}
                </Tag>
            ))}
            {editMode ? (
                <Input
                    size="small"
                    style={{ width: 78, marginRight: 8, verticalAlign: 'top' }}
                    value={newTag}
                    onChange={(event) => setNewTag(event.target.value)}
                    autoFocus
                    onKeyDown={(event) => {
                        if (event.code === 'Enter') {
                            const newTags = [...tags, newTag]
                            setTags(newTags)
                            onSave(newTags)
                            setNewTag('')
                            setEditMode(false)
                        } else if (event.code === 'Escape') {
                            setNewTag('')
                            setEditMode(false)
                        }
                    }}
                />
            ) : (
                <Tag
                    className={isNewTagBtnVisible ? '' : 'new-tags-btn'}
                    style={{ border: '1px dashed', background: '#fff', cursor: 'pointer' }}
                    onClick={() => setEditMode(true)}
                >
                    <PlusOutlined /> New Tag
                </Tag>
            )}
        </div>
    )
}

export default EditableTags
