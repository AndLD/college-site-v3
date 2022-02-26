import { PlusOutlined } from '@ant-design/icons'
import { Input, Tag } from 'antd'
import { generateKey } from 'fast-key-generator'
import { useState } from 'react'

function TagsCell({
    tags: initialTags,
    onSave
}: {
    tags: string[]
    onSave: (newTags: string[]) => void
}) {
    const [tags, setTags] = useState<string[]>(initialTags)
    const [newTag, setNewTag] = useState<string>('')
    const [editMode, setEditMode] = useState<boolean>(false)

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
                    className="new-tags-btn"
                    style={{ border: '1px dashed', background: '#fff', cursor: 'pointer' }}
                    onClick={() => setEditMode(true)}
                >
                    <PlusOutlined /> New Tag
                </Tag>
            )}
        </div>
    )
}

export default TagsCell
