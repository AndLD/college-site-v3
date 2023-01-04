import { useEffect, useState } from 'react'

function NewsImage({ src }: { src: string | null }) {
    const [source, setSource] = useState<string | null>(null)

    useEffect(() => {
        if (src) {
            setSource(src.length > 500 && !src.startsWith('data:image/') ? 'data:image/png;base64,' + src : src)
        }
    }, [src])

    return <img src={source || '/images/logo.png'} alt="News Image" />
}

export default NewsImage
