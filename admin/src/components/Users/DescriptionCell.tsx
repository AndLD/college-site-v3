import { Input } from 'antd'
import { useState } from 'react'
import { AnyIfEmpty } from 'react-redux'
import { warningNotification } from '../../utils/notifications'

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
            onClick={() => {
                setEditMode(true)
            }}
        >
            {editMode ? (
                <Input
                    autoFocus={true}
                    value={newDescription}
                    onChange={(event: any) => {
                        setNewDescription(event.target.value)
                    }}
                    onKeyDown={(event: any) => {
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
