import { CloseOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import Title from 'antd/lib/typography/Title'
import { ChangeEvent, SetStateAction, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

function MenuDescription({
    menuDescriotionState: [menuDescription, setMenuDescription]
}: {
    menuDescriotionState: [string, any]
}) {
    const userStatus = useSelector((state: any) => state.app.user.status)

    const [menuDescriptionEditMode, setMenuDescriptionEditMode] = useState<boolean>(false)
    const [newMenuDescription, setNewMenuDescription] = useState<string>('')

    function onSaveEvent() {
        setMenuDescriptionEditMode(false)
        setMenuDescription(newMenuDescription)
    }

    function onCloseEvent() {
        setMenuDescriptionEditMode(false)
        setNewMenuDescription(menuDescription)
    }

    useEffect(() => {
        setNewMenuDescription(menuDescription)
    }, [menuDescription])

    return (
        <Title
            level={4}
            className="menu-description"
            onClick={() => {
                if (!menuDescriptionEditMode && userStatus === 'admin') {
                    setMenuDescriptionEditMode(true)
                }
            }}
        >
            {menuDescriptionEditMode ? (
                <>
                    <Input
                        size="large"
                        placeholder="New description"
                        value={newMenuDescription}
                        autoFocus
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                            setNewMenuDescription(event.target.value)
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
                    {menuDescription ? (
                        menuDescription
                    ) : (
                        <span style={{ color: '#d4d4d4' }}>No description</span>
                    )}
                    {userStatus === 'admin' ? (
                        <EditOutlined
                            className="menu-description-action"
                            style={{
                                fontSize: '20px',
                                margin: '0 5px',
                                transform: 'translateY(20%)'
                            }}
                        />
                    ) : null}
                </>
            )}
        </Title>
    )
}

export default MenuDescription
