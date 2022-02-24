import { CloseOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { Input } from 'antd'
import Title from 'antd/lib/typography/Title'
import { ChangeEvent, SetStateAction, useEffect, useState } from 'react'

function MenuDescription({
    menuDescriotionState: [menuDescription, setMenuDescription]
}: {
    menuDescriotionState: [string, any]
}) {
    const [menuDescriptionEditMode, setMenuDescriptionEditMode] = useState<boolean>(false)
    const [newMenuDescription, setNewMenuDescription] = useState<string>('')

    useEffect(() => {
        setNewMenuDescription(menuDescription)
    }, [menuDescription])
    return (
        <Title
            level={4}
            className="menu-description"
            onClick={() => {
                if (!menuDescriptionEditMode) setMenuDescriptionEditMode(true)
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
                    />
                    <SaveOutlined
                        style={{
                            fontSize: '20px',
                            margin: '0 5px'
                        }}
                        onClick={() => {
                            setMenuDescriptionEditMode(false)
                            setMenuDescription(newMenuDescription)
                        }}
                    />
                    <CloseOutlined
                        style={{
                            fontSize: '20px',
                            margin: '0 5px'
                        }}
                        onClick={() => {
                            setMenuDescriptionEditMode(false)
                            setNewMenuDescription(menuDescription)
                        }}
                    />
                </>
            ) : (
                <>
                    {menuDescription ? (
                        menuDescription
                    ) : (
                        <span style={{ color: '#d4d4d4' }}>No description</span>
                    )}
                    <EditOutlined
                        className="menu-description-action"
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

export default MenuDescription
