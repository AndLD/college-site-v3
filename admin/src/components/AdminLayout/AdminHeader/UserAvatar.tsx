import { UserOutlined } from '@ant-design/icons'
import { Avatar } from 'antd'
import jwtDecode from 'jwt-decode'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { ITokenData } from '../../../utils/types'

function UserAvatar() {
    const token = useSelector((state: any) => state.app.token)
    const [avatarLoaded, setAvatarLoaded] = useState(false)
    const [src, setState] = useState<string>()

    useEffect(() => {
        getAvatarSrc()
    }, [])

    function getAvatarSrc() {
        try {
            const src = (jwtDecode(token) as ITokenData).picture
            setState(src)
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <Avatar
            style={{ cursor: 'pointer' }}
            shape="square"
            icon={
                <>
                    <img
                        src={src}
                        onLoad={() => setAvatarLoaded(true)}
                        alt="Avatar"
                        style={{ display: avatarLoaded ? 'inline' : 'none' }}
                    />
                    {!avatarLoaded && <UserOutlined />}
                </>
            }
        />
    )
}

export default UserAvatar
