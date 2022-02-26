import { PlusOutlined } from '@ant-design/icons'
import { Input, Tag } from 'antd'
import { generateKey } from 'fast-key-generator'
import { useState } from 'react'

function Tags({ tags }: { tags: string[] }) {
    return (
        <div className="users-tags-cell">
            {tags.map((tag: string) => (
                <Tag key={generateKey({})}>{tag}</Tag>
            ))}
        </div>
    )
}

export default Tags
