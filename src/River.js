import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const River = ({ width = 8 }) => {
    const mesh = useRef()

    // For now, let's use a simpler approach: a Plane with a custom displacement or just a set of segments.
    // Actually, let's just use a large plane and a shader that only colors the "river path".
    // Or better: define segments.

    useFrame((state) => {
        if (mesh.current) {
            mesh.current.material.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
            <planeGeometry args={[1000, 1000]} />
            <shaderMaterial
                transparent
                uniforms={{
                    uTime: { value: 0 },
                    uRiverWidth: { value: width },
                }}
                vertexShader={`
                    varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`}
                fragmentShader={`
                    varying vec2 vUv;
                    uniform float uTime;
                    uniform float uRiverWidth;

                    void main() {
                        // Map UV to world coords (-500 to 500)
                        vec2 world = (vUv - 0.5) * 1000.0;
                        
                        float riverZ = 30.0 * sin(world.x * 0.02);
                        float dist = abs(world.y - riverZ);

    if (dist < uRiverWidth) {
                            float alpha = 0.7 + 0.2 * sin(world.x * 0.1 + uTime);
                            vec3 waterColor = mix(vec3(0.0, 0.3, 0.6), vec3(0.1, 0.5, 0.8), 0.5 + 0.5 * sin(world.x * 0.05 + uTime * 2.0));
        gl_FragColor = vec4(waterColor, alpha);
    } else {
        discard;
    }
}
`}
            />
        </mesh>
    )
}
