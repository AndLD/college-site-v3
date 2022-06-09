import { useEffect, useState } from 'react'
import Link from 'next/link'

const defaultWidth = '70px'

const usefulLinkStyle = { width: '70%', marginBottom: '10px' }

function UsefulLinks() {
    const [width, setWidth] = useState<string>(defaultWidth)
    const [isHover, setIsHover] = useState(false)

    useEffect(() => {
        if (isHover) {
            setWidth('250px')
        } else {
            setWidth(defaultWidth)
        }
    }, [isHover])

    return (
        <div
            onMouseEnter={() => setIsHover(true)}
            onMouseLeave={() => setIsHover(false)}
            style={{
                // transition: 'all ease 0.3s',
                position: 'fixed',
                top: 0,
                left: 0,
                width: width,
                borderRadius: '0 0 10px 0',
                borderRight: '1px solid black',
                borderBottom: '1px solid black',
                zIndex: 10,
                background: 'rgb(255, 247, 226)',
                cursor: 'pointer',
                textAlign: 'center',
                padding: isHover ? '20px 0' : 'inherit'
            }}
        >
            <div
                style={{
                    margin: 'auto'
                }}
            >
                {isHover ? (
                    <span style={{ fontSize: 20, fontWeight: 'bold' }}>Корисні посилання</span>
                ) : (
                    <span style={{ fontSize: 40 }}>🎓</span>
                )}
            </div>
            <div
                style={{
                    display: isHover ? 'block' : 'none',
                    opacity: isHover ? 1 : 0,
                    padding: 10,
                    fontSize: 20
                }}
            >
                <div>
                    <Link href="https://www.president.gov.ua/">
                        <a>
                            <img
                                src="/images/useful-links/president.gif"
                                alt="Президент України"
                                style={usefulLinkStyle}
                            />
                        </a>
                    </Link>
                </div>
                <div>
                    <Link href="https://www.kmu.gov.ua/">
                        <a>
                            <img
                                src="/images/useful-links/uryadoviy-portal.gif"
                                alt="Урядовий портал"
                                style={usefulLinkStyle}
                            />
                        </a>
                    </Link>
                </div>
                <div>
                    <Link href="https://rada.gov.ua/">
                        <a>
                            <img
                                src="/images/useful-links/rada.gif"
                                alt="Верховна Рада України"
                                style={usefulLinkStyle}
                            />
                        </a>
                    </Link>
                </div>
                <div>
                    <Link href="https://mon.gov.ua/ua">
                        <a>
                            <img
                                src="/images/useful-links/ministerstvo-osviti.jpg"
                                alt="Міністерство освіти і науки України"
                                style={usefulLinkStyle}
                            />
                        </a>
                    </Link>
                </div>
                <div>
                    <Link href="https://play.google.com/store/apps/details?id=com.example33.admin.fragment8">
                        <a style={{ textDecoration: 'underline', color: 'blue' }}>
                            Завантажити додаток з розкладом
                        </a>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default UsefulLinks
