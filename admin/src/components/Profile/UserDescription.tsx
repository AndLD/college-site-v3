import { CloseOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import Title from 'antd/lib/typography/Title'
import { ChangeEvent, useEffect, useState } from 'react'

function UserDescription({
    userDescriotionState: [userDescription, setUserDescription],
    onSave
}: {
    userDescriotionState: [string, any]
    onSave: (data: { description?: string; tags?: string[] }) => void
}) {
    const [editMode, setEditMode] = useState<boolean>(false)
    const [newUserDescription, setNewUserDescription] = useState<string>('')

    function onSaveEvent() {
        setEditMode(false)
        setUserDescription(newUserDescription)
        onSave({ description: userDescription })
    }

    function onCloseEvent() {
        setEditMode(false)
        setNewUserDescription(userDescription)
    }

    useEffect(() => {
        setNewUserDescription(userDescription)
    }, [userDescription])
    return (
        <Title
            level={4}
            className="user-description"
            onClick={() => {
                if (!editMode) setEditMode(true)
            }}
        >
            {editMode ? (
                <>
                    <Input
                        size="large"
                        placeholder="New description"
                        value={newUserDescription}
                        autoFocus
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setNewUserDescription(event.target.value)
                        }
                        style={{
                            maxWidth: '400px',
                            marginRight: '10px'
                        }}
                        onKeyDown={(event) => {
                            if (event.code === 'Enter') {
                                onSaveEvent()
                            } else if (event.code === 'Escape') {
                                onCloseEvent()
                            }
                        }}
                    />
                    <SaveOutlined
                        style={{
                            fontSize: '20px',
                            margin: '0 5px'
                        }}
                        onClick={onSaveEvent}
                    />
                    <CloseOutlined
                        style={{
                            fontSize: '20px',
                            margin: '0 5px'
                        }}
                        onClick={onCloseEvent}
                    />
                </>
            ) : (
                <>
                    {userDescription ? (
                        userDescription
                    ) : (
                        <span style={{ color: '#d4d4d4' }}>No description</span>
                    )}
                    <EditOutlined
                        className="user-description-action"
                        style={{
                            fontSize: '20px',
                            margin: '0 5px',
                            transform: 'translateY(20%)'
                        }}
                    />
                </>
            )}
        </Title>
    )
}

export default UserDescription
