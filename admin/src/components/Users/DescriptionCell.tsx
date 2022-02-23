import { Input } from 'antd'
import { useState } from 'react'
import { AnyIfEmpty } from 'react-redux'

function DescriptionCell({ description }: any) {
    const [editMode, setEditMode] = useState<boolean>(false)
    return editMode ? <Input /> : <div>{description}</div>
}

export default DescriptionCell
