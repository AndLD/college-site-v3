function NewsImage({ src }: { src: string | null }) {
    return (
        <img src={(src && `data:image/png;base64,${src}`) || '/images/logo.png'} alt="News Image" />
    )
}

export default NewsImage
