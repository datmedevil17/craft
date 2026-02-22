import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { useGLTF, useAnimations, Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'
import { useCubeStore } from './useStore'
import { useSocket } from './SocketContext'

const BOSS_PATROL_RADIUS = 20   // How far boss wanders from spawn
const BOSS_CHASE_RANGE = 35     // Start chasing player within this distance
const BOSS_ATTACK_RANGE = 8     // Melee attack range
const BOSS_MOVE_SPEED = 5       // Movement speed
const BOSS_PATROL_SPEED = 1.5   // Patrol wander speed

export default function Boss3D() {
    const { bossState } = useSocket()
    const { socketActions } = useCubeStore()
    const [deathState, setDeathState] = useState('alive') // 'alive' | 'dying' | 'dead'
    const [defeatMsg, setDefeatMsg] = useState(null)
    const prevAlive = useRef(true)

    useEffect(() => {
        if (!bossState) return

        if (prevAlive.current && !bossState.alive) {
            // Boss just died!
            setDeathState('dying')
            setDefeatMsg(`☠️ ${bossState.type} DEFEATED! ☠️`)
            // After 4 seconds, hide the boss body
            const timer = setTimeout(() => {
                setDeathState('dead')
                // Clear the defeat message after another 3s
                setTimeout(() => setDefeatMsg(null), 3000)
            }, 4000)
            prevAlive.current = false
            return () => clearTimeout(timer)
        }

        if (!prevAlive.current && bossState.alive) {
            // Boss respawned!
            setDeathState('alive')
            setDefeatMsg(null)
            prevAlive.current = true
        }
    }, [bossState?.alive, bossState?.type])

    return (
        <>
            {/* Defeat Banner */}
            {defeatMsg && (
                <Html center position={[0, 20, 0]} zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
                    <div style={{
                        position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)',
                        color: '#FFD700', fontSize: '36px', fontWeight: 'bold',
                        fontFamily: "'Press Start 2P', monospace",
                        textShadow: '0 0 20px rgba(255,0,0,0.8), 3px 3px 6px #000',
                        animation: 'pulse 1s ease-in-out infinite',
                        whiteSpace: 'nowrap', zIndex: 9999,
                        background: 'rgba(0,0,0,0.6)', padding: '15px 30px', borderRadius: '12px',
                        border: '2px solid #FFD700'
                    }}>
                        {defeatMsg}
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>
                            Respawns in 30 seconds...
                        </div>
                    </div>
                </Html>
            )}

            {/* Boss Model */}
            {bossState && (deathState === 'alive' || deathState === 'dying') && (
                <BossModel
                    bossState={bossState}
                    attackBoss={socketActions.attackBoss}
                    isDying={deathState === 'dying'}
                />
            )}
        </>
    )
}

function BossModel({ bossState, attackBoss, isDying = false }) {
    const group = useRef()
    const rb = useRef()
    const { scene, animations } = useGLTF(`/models/Enemies/${bossState.type}.gltf`)
    const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
    const { actions, names } = useAnimations(animations, group)
    const [animState, setAnimState] = useState('idle')
    const lastHp = useRef(bossState.hp)
    const hitFlashRef = useRef(0)
    const lastBossAttack = useRef(0)
    const sinkProgress = useRef(0)

    // Movement state
    const spawnPos = useRef(new THREE.Vector3(...bossState.position))
    const patrolTarget = useRef(new THREE.Vector3(...bossState.position))
    const patrolTimer = useRef(0)

    // Log available animations
    useEffect(() => {
        console.log(`[Boss ${bossState.type}] Animations:`, names)
    }, [names, bossState.type])

    // Find animation by name patterns
    const findAnim = useCallback((patterns) => {
        for (const pattern of patterns) {
            if (actions[pattern]) return actions[pattern]
            const found = names.find(n => n.toLowerCase().includes(pattern.toLowerCase()))
            if (found && actions[found]) return actions[found]
        }
        return null
    }, [actions, names])

    // Death animation
    useEffect(() => {
        if (isDying) {
            Object.values(actions).forEach(a => a.fadeOut(0.3))
            const deathAnim = findAnim(['Death', 'Die', 'dead', 'death'])
            if (deathAnim) {
                deathAnim.setLoop(THREE.LoopOnce)
                deathAnim.clampWhenFinished = true
                deathAnim.reset().fadeIn(0.2).play()
            }
            sinkProgress.current = 0
        }
    }, [isDying, actions, findAnim])

    // Animation state machine
    useEffect(() => {
        Object.values(actions).forEach(a => a.fadeOut(0.25))

        let target = null
        if (animState === 'attack') {
            target = findAnim(['Attack', 'Punch', 'Bite', 'Slash', 'attack', 'punch'])
            if (target) {
                target.setLoop(THREE.LoopOnce)
                target.clampWhenFinished = true
                target.reset().fadeIn(0.1).play()
                const dur = target.getClip().duration * 1000
                const timer = setTimeout(() => setAnimState('idle'), dur)
                return () => clearTimeout(timer)
            }
        } else if (animState === 'walk') {
            target = findAnim(['Walk', 'Run', 'walk', 'run'])
            if (target) {
                target.setLoop(THREE.LoopRepeat)
                target.reset().fadeIn(0.2).play()
            }
        }

        if (!target) {
            target = findAnim(['Idle', 'idle']) || Object.values(actions)[0]
            if (target) {
                target.setLoop(THREE.LoopRepeat)
                target.reset().fadeIn(0.2).play()
            }
        }
    }, [animState, actions, findAnim])

    // Detect boss taking damage → flash red
    useEffect(() => {
        if (bossState.hp < lastHp.current) {
            hitFlashRef.current = 0.3
        }
        lastHp.current = bossState.hp
    }, [bossState.hp])

    // Main frame loop: movement AI + animation + visual effects
    useFrame((state, delta) => {
        if (!group.current || !rb.current) return

        // If dying, just sink into ground
        if (isDying) {
            sinkProgress.current += delta * 0.3
            group.current.position.set(0, -1 - sinkProgress.current, 0)
            rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
            return
        }

        const bossPos = new THREE.Vector3().copy(rb.current.translation())
        const cam = state.camera.position
        const distToPlayer = bossPos.distanceTo(cam)
        const distToSpawn = bossPos.distanceTo(spawnPos.current)

        // ── Movement AI ──────────────────────────────────────────────────
        let moveDir = new THREE.Vector3()
        let speed = 0

        // Attack cooldown counts down each frame
        if (lastBossAttack.current > 0) lastBossAttack.current -= delta

        if (distToPlayer < BOSS_ATTACK_RANGE) {
            // In melee range — stop moving and attack on cooldown
            speed = 0
            if (lastBossAttack.current <= 0) {
                lastBossAttack.current = 2.5
                setAnimState('attack')

                // Capture refs — camera is a live object, position updates automatically
                const bossRef = rb
                const cameraRef = state.camera
                setTimeout(() => {
                    if (!bossRef.current) return
                    const store = useCubeStore.getState()
                    if (store.isGameOver || store.invincible) return

                    // Get boss's CURRENT position from physics body
                    const bp = bossRef.current.translation()
                    // Get player's CURRENT position from camera (live reference)
                    const pp = cameraRef.position

                    const dx = bp.x - pp.x
                    const dy = bp.y - pp.y
                    const dz = bp.z - pp.z
                    const hitDist = Math.sqrt(dx * dx + dy * dy + dz * dz)

                    console.log(`[BOSS HIT CHECK] boss:(${bp.x.toFixed(1)},${bp.y.toFixed(1)},${bp.z.toFixed(1)}) player:(${pp.x.toFixed(1)},${pp.y.toFixed(1)},${pp.z.toFixed(1)}) dist:${hitDist.toFixed(1)}`)

                    if (hitDist < 9) {
                        store.damagePlayer(4)
                        console.log('[BOSS] ✅ Fist connected!')
                    } else {
                        console.log('[BOSS] ❌ Player dodged!')
                    }
                }, 400)
            }
        } else if (distToPlayer < BOSS_CHASE_RANGE) {
            // Chase player
            moveDir.subVectors(cam, bossPos).normalize()
            moveDir.y = 0
            speed = BOSS_MOVE_SPEED
            if (animState !== 'walk' && animState !== 'attack') setAnimState('walk')
        } else if (distToSpawn > BOSS_PATROL_RADIUS) {
            // Too far from spawn — return
            moveDir.subVectors(spawnPos.current, bossPos).normalize()
            moveDir.y = 0
            speed = BOSS_PATROL_SPEED
            if (animState !== 'walk' && animState !== 'attack') setAnimState('walk')
        } else {
            // Patrol: pick random target nearby
            patrolTimer.current -= delta
            if (patrolTimer.current <= 0) {
                patrolTimer.current = 3 + Math.random() * 4
                const angle = Math.random() * Math.PI * 2
                const dist = 5 + Math.random() * 15
                patrolTarget.current.set(
                    spawnPos.current.x + Math.cos(angle) * dist,
                    spawnPos.current.y,
                    spawnPos.current.z + Math.sin(angle) * dist
                )
            }
            const distToTarget = bossPos.distanceTo(patrolTarget.current)
            if (distToTarget > 2) {
                moveDir.subVectors(patrolTarget.current, bossPos).normalize()
                moveDir.y = 0
                speed = BOSS_PATROL_SPEED
                if (animState !== 'walk' && animState !== 'attack') setAnimState('walk')
            } else {
                if (animState !== 'idle' && animState !== 'attack') setAnimState('idle')
            }
        }

        // Apply movement
        if (speed > 0) {
            const vel = rb.current.linvel()
            rb.current.setLinvel({
                x: moveDir.x * speed,
                y: vel.y,
                z: moveDir.z * speed
            }, true)
        } else {
            const vel = rb.current.linvel()
            rb.current.setLinvel({ x: 0, y: vel.y, z: 0 }, true)
        }

        // ── Rotate toward movement direction or player ──────────────────
        const lookTarget = distToPlayer < BOSS_CHASE_RANGE ? cam : patrolTarget.current
        const angle = Math.atan2(lookTarget.x - bossPos.x, lookTarget.z - bossPos.z)
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, angle, 0.08)

        // ── Position group locally within RigidBody (NOT world coords!) ──
        group.current.position.set(0, -1, 0)

        // ── Hit flash effect ────────────────────────────────────────────
        if (hitFlashRef.current > 0) {
            hitFlashRef.current -= delta
            group.current.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissive = child.material.emissive || new THREE.Color()
                    child.material.emissive.setRGB(1, 0.2, 0.2)
                    child.material.emissiveIntensity = hitFlashRef.current * 3
                }
            })
        } else {
            group.current.traverse((child) => {
                if (child.isMesh && child.material && child.material.emissiveIntensity > 0) {
                    child.material.emissiveIntensity = 0
                }
            })
        }
    })

    const handleClick = (e) => {
        e.stopPropagation()
        attackBoss()
    }

    const hpPercent = Math.max(0, bossState.hp / bossState.maxHp)
    const scale = 2.5

    return (
        <RigidBody
            position={bossState.position}
            type="dynamic"
            colliders={false}
            onClick={handleClick}
            enabledRotations={[false, false, false]}
            linearDamping={5}
            ref={rb}
        >
            <CuboidCollider args={[2, 3, 2]} position={[0, 3, 0]} />

            {/* Boss model rendered as sibling — positioned via useFrame */}
            <group ref={group} scale={scale}>
                <primitive object={clone} />
            </group>

            <Html position={[0, scale * 4, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
                <div style={{
                    textAlign: 'center', userSelect: 'none', fontFamily: "'Press Start 2P', monospace"
                }}>
                    <div style={{
                        color: '#ff4444', fontSize: '14px', fontWeight: 'bold',
                        textShadow: '2px 2px 4px #000', marginBottom: '6px'
                    }}>
                        ⚔️ {bossState.type}
                    </div>
                    <div style={{
                        width: '180px', height: '14px',
                        background: '#333', borderRadius: '7px', border: '2px solid #000',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${hpPercent * 100}%`, height: '100%',
                            background: hpPercent > 0.5
                                ? 'linear-gradient(180deg, #ff3333, #cc0000)'
                                : hpPercent > 0.25
                                    ? 'linear-gradient(180deg, #ff8800, #cc5500)'
                                    : 'linear-gradient(180deg, #ff0000, #880000)',
                            transition: 'width 0.3s ease',
                            borderRadius: '5px'
                        }} />
                    </div>
                    <div style={{
                        color: '#fff', fontSize: '8px', marginTop: '3px',
                        textShadow: '1px 1px 2px #000'
                    }}>
                        {bossState.hp} / {bossState.maxHp}
                    </div>
                </div>
            </Html>
        </RigidBody>
    )
}
