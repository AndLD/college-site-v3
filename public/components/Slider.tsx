import { MutableRefObject, useEffect, useRef, useState } from 'react'
import style from '../styles/Slider.module.scss'
import { Slide } from '../utils/types'

function Slider() {
    const sliderWrapperRef: MutableRefObject<any> = useRef(null)
    const pointsWrapperRef: MutableRefObject<any> = useRef(null)
    const [slideWidth, setSlideWidth] = useState<number>(0)

    const [slides, setSlides] = useState<Slide[]>([
        { src: '/images/index/slider/1.jpeg', left: 0 },
        { src: '/images/index/slider/2.jpeg', left: 0 },
        { src: '/images/index/slider/3.jpeg', left: 0 },
        { src: '/images/index/slider/4.jpeg', left: 0 }
    ])

    const [step, setStep] = useState(0)

    // Индекс (позиция) точки, на которую нажал пользователь
    const [orderPosition, setOrderPosition] = useState<number>(0)

    // TODO: Remove
    const [pointsLeft, setPointsLeft] = useState<number>(0)

    useEffect(() => {
        setPointsLeft(
            parseInt(sliderWrapperRef.current.offsetWidth) / 2 -
                parseInt(pointsWrapperRef.current.offsetWidth) / 2
        )

        // Получаем ширину одного слайда
        setSlideWidth(parseInt(sliderWrapperRef.current.offsetWidth))

        // Определяем начальную позицию (первый шаг)
        // setStep(0)

        // setInterval(() => {
        //     start(-1)
        // }, 3000)
    }, [])

    useEffect(() => {
        if (orderPosition && slides) {
            // Повторяем функцию проворота (старта) до тех пор, пока шаг не будет равняться заказанной позиции
            if (step !== orderPosition) {
                const repeat = setInterval(() => {
                    if (step === orderPosition) {
                        clearInterval(repeat)
                        return
                    } else if (step > orderPosition) {
                        start(1)
                    } else if (step < orderPosition) {
                        start(-1)
                    }
                }, 100)
            }
        }
    }, [orderPosition])

    useEffect(() => {
        if (!slideWidth) {
            return
        }

        const newSlides = [...slides]

        // Первичная расстановка слайдов
        for (let i = 0, j = -1; i < newSlides.length; i++) {
            newSlides[i].left = j * slideWidth
            j++
        }

        setSlides(newSlides)
    }, [slideWidth])

    // Перерисовка элемента: удаления с одного края и добавление к другому.
    function redraw(side: number, newSlides: Slide[]) {
        // Если "сторона" (направление) прокрутки - лево (1)
        if (side == 1) {
            // Присваиваем ему позицию на шаг раньше первого
            newSlides[newSlides.length - 1].left = newSlides[0].left - slideWidth

            newSlides.unshift(newSlides[newSlides.length - 1])
            newSlides.pop()

            // Иначе если "сторона" прокрутки - право (-1)
        } else if (side == -1) {
            // Присваиваем ему позицию на шаг дальше последнего
            newSlides[0].left = newSlides[newSlides.length - 1].left + slideWidth

            newSlides.push(newSlides[0])
            newSlides.shift()
        }

        setSlides(newSlides)
    }

    // Главная функция
    function start(side: number) {
        console.log('start', side)
        const newSlides = [...slides]
        // Сдвигаем их на один шаг (на ширину одного слайда) по выбранному направлению
        for (let i = 0; i < newSlides.length; i++) {
            newSlides[i].left += side * slideWidth
        }

        // Перерисовываем края дорожки
        redraw(side, newSlides)

        // Смещаем шаг
        let newStep = step - side
        // Если он не входит в границы массива, исправляем это
        if (newStep >= slides.length) {
            newStep = 0
        } else if (newStep < 0) {
            newStep = slides.length - 1
        }

        setStep(newStep)
    }

    useEffect(() => console.log(slides), [slides])

    // При нажатии на одну из точек управления
    function onPointClick(orderPosition: number) {
        setOrderPosition(orderPosition)
    }

    return (
        <div className={style['slider-wrapper']} ref={sliderWrapperRef}>
            <div className={style['slider']}>
                {slides.map(({ src, left }, i) => (
                    <img
                        key={'slide' + i}
                        src={src}
                        alt="Slider Image"
                        className={style['slide']}
                        style={{
                            left,
                            transition: 'all ease 0.5s'
                        }}
                    />
                ))}
            </div>

            <div
                className={`${style['slider-button']} ${style['slider-button-left']}`}
                onClick={() => {
                    start(1)
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <img src="/images/index/slider/left-btn.png" />
            </div>
            <div
                className={`${style['slider-button']} ${style['slider-button-right']}`}
                onClick={() => {
                    start(-1)
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <img src="/images/index/slider/right-btn.png" />
            </div>

            <div
                className={style['points']}
                style={{
                    left: pointsLeft
                }}
                ref={pointsWrapperRef}
            >
                {slides.map((_, i) => (
                    <div
                        key={'point' + i}
                        className={`${style['point']}${
                            step === i ? ` ${style['active-point']}` : ''
                        }`}
                        onClick={() => onPointClick(i)}
                    ></div>
                ))}
            </div>
        </div>
    )
}

export default Slider
