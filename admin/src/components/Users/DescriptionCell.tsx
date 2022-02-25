import { Input } from 'antd'
import { useState } from 'react'

function DescriptionCell({
    description: initialDescription,
    onSave
}: {
    description: string
    onSave: (description: string) => void
}) {
    const [description, setDescription] = useState<string>(initialDescription)
    const [newDescription, setNewDescription] = useState<string>(initialDescription)
    const [editMode, setEditMode] = useState<boolean>(false)

    return (
        <div
            style={{ height: 30 }}
            onClick={() => {
                setEditMode(true)
            }}
        >
            {editMode ? (
                <Input
                    autoFocus
                    value={newDescription}
                    onChange={(event) => {
                        setNewDescription(event.target.value)
                    }}
                    onKeyDown={(event) => {
                        if (event.code === 'Enter') {
                            if (description !== newDescription) {
                                onSave(newDescription)
                                setDescription(newDescription)
                                setEditMode(false)
                            } else {
                                setEditMode(false)
                            }
                        } else if (event.code === 'Escape') {
                            setNewDescription(description)
                            setEditMode(false)
                        }
                    }}
                />
            ) : (
                <div>{description}</div>
            )}
        </div>
    )
}

export default DescriptionCell
