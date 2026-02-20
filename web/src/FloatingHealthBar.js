import React, { useEffect, useState } from 'react'
import { Html } from '@react-three/drei'

export const FloatingHealthBar = ({ health, maxHealth = 100, position = [0, 2, 0], showDuration = 3000 }) => {
    const [visible, setVisible] = useState(false)
    const percentage = (health / maxHealth) * 100

    useEffect(() => {
        if (health < maxHealth) {
            setVisible(true)
            const timer = setTimeout(() => setVisible(false), showDuration)
            return () => clearTimeout(timer)
        }
    }, [health, maxHealth, showDuration])

    if (!visible) return null

    return (
        <Html position={position} center distanceFactor={10}>
            <div style={{
                width: '60px',
                height: '8px',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid #000',
                padding: '1px',
                display: 'flex',
                pointerEvents: 'none'
            }}>
                <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: percentage > 40 ? '#4CAF50' : '#F44336',
                    transition: 'width 0.3s ease-out'
                }} />
            </div>
        </Html>
    )
}
