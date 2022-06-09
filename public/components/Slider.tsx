import { useEffect, useRef, useState } from 'react'
import Slider from 'react-simple-image-slider'
import { isMobile } from 'react-device-detect'

function MySlider() {
    const [slides, setSlides] = useState([
        '/images/index/slider/1.jpeg',
        '/images/index/slider/2.jpeg',
        '/images/index/slider/3.jpeg',
        '/images/index/slider/4.jpeg'
    ])

    const sliderWrapperRef = useRef<any>(null)
    const [sliderWidth, setSliderWidth] = useState(0)

    useEffect(() => {
        setSliderWidth(sliderWrapperRef.current.offsetWidth)
    }, [])

    return (
        <div ref={sliderWrapperRef}>
            <Slider
                width={sliderWidth}
                height={isMobile ? '50vw' : '30vw'}
                images={slides}
                showBullets={true}
                showNavs={true}
                autoPlay={true}
                autoPlayDelay={3}
            />
        </div>
    )
}

export default MySlider
