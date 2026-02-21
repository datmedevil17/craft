import * as THREE from "three"
import * as RAPIER from "@dimforge/rapier3d-compat"
import { useRef, useMemo, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { useKeyboardControls, useGLTF, useAnimations } from "@react-three/drei"
import { CapsuleCollider, RigidBody, useRapier } from "@react-three/rapier"
import { SkeletonUtils } from "three-stdlib"
import Tool from "./Tool"
import { useSocket } from "./SocketContext"
import { useCubeStore } from "./useStore"

const WALK_SPEED = 5
const SPRINT_SPEED = 9
const THIRD_PERSON_DIST = 5

const direction = new THREE.Vector3()
const frontVector = new THREE.Vector3()
const sideVector = new THREE.Vector3()
const camOffset = new THREE.Vector3()
const camDir = new THREE.Vector3()
const targetCamPos = new THREE.Vector3() // lerp target to prevent jitter

/**
 * PlayerBody: rendered in 3rd-person modes.
 * Uses its own useFrame to follow the RigidBody ref every frame.
 */
function PlayerBody({ rigidBodyRef }) {
  const group = useRef()
  const { scene, animations } = useGLTF("/models/Characters/Character_Male_1.gltf")
  // Clone the scene so it can be used independently (animations, materials etc)
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions } = useAnimations(animations, group)

  // Play idle animation once actions are ready
  useEffect(() => {
    const idle = actions?.Idle || actions?.Idle_General || Object.values(actions)[0]
    if (idle) idle.reset().fadeIn(0.2).play()
  }, [actions])

  // Move + rotate to match player position every frame
  useFrame((state) => {
    if (!rigidBodyRef.current || !group.current) return
    const pos = rigidBodyRef.current.translation()
    group.current.position.set(pos.x, pos.y - 0.9, pos.z)
    group.current.rotation.set(0, state.camera.rotation.y + Math.PI, 0)
  })

  return (
    <group ref={group} scale={0.5}>
      {/* Render the full scene (CharacterArmature + mesh + skeleton) */}
      <primitive object={clone} />
    </group>
  )
}


export function Player({ lerp = THREE.MathUtils.lerp }) {
  const { updatePosition } = useSocket()
  const axe = useRef()
  const ref = useRef()  // RigidBody ref
  const rapier = useRapier()
  const [, get] = useKeyboardControls()
  const cameraMode = useCubeStore((state) => state.cameraMode)

  const swinging = useRef(false)
  const swingStartTime = useRef(0)

  useFrame((state) => {
    const { forward, backward, left, right, jump, sprint } = get()
    if (!ref.current) return
    const velocity = ref.current.linvel()
    const playerPos = ref.current.translation()

    // ── Swing on ANY click — only if holding an item ─────────────────────
    const heldItem = useCubeStore.getState().hotbarSlots[useCubeStore.getState().selectedHotbarIndex]
    if (state.mouse.buttons > 0 && !swinging.current && heldItem) {
      swinging.current = true
      swingStartTime.current = state.clock.elapsedTime
    }
    if (swinging.current && state.clock.elapsedTime - swingStartTime.current > 0.3) {
      swinging.current = false
    }

    // ── Camera Modes ──────────────────────────────────────────────────────
    if (cameraMode === 'first') {
      // Snap in first-person (player's own head, no lerp needed)
      state.camera.position.set(playerPos.x, playerPos.y, playerPos.z)
    } else {
      // third_back: camera smoothly follows behind player
      state.camera.getWorldDirection(camDir)
      camOffset.copy(camDir).multiplyScalar(-THIRD_PERSON_DIST)
      targetCamPos.set(
        playerPos.x + camOffset.x,
        playerPos.y + 1.8,
        playerPos.z + camOffset.z
      )
      state.camera.position.lerp(targetCamPos, 0.15)
    }

    // ── Hand animation (1st person only) ─────────────────────────────────
    if (cameraMode === 'first' && axe.current) {
      const isSwinging = swinging.current
      const swingRotation = isSwinging ? -1.2 : 0
      const moving = (velocity.x ** 2 + velocity.z ** 2) > 1
      const walkWobble = moving ? Math.sin(state.clock.elapsedTime * (sprint ? 14 : 10)) / 6 : 0

      if (axe.current.children[0]) {
        axe.current.children[0].rotation.x = lerp(
          axe.current.children[0].rotation.x,
          swingRotation + walkWobble,
          isSwinging ? 0.3 : 0.1
        )
      }
      axe.current.rotation.copy(state.camera.rotation)
      axe.current.position.copy(state.camera.position)
        .add(state.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1))
    }

    // ── Movement ──────────────────────────────────────────────────────────
    const spd = (sprint && forward) ? SPRINT_SPEED : WALK_SPEED

    frontVector.set(0, 0, Number(backward) - Number(forward))
    sideVector.set(Number(left) - Number(right), 0, 0)
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .applyEuler(state.camera.rotation)
    direction.y = 0
    if (direction.length() > 0) direction.normalize().multiplyScalar(spd)
    ref.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z })

    // Jumping
    const world = rapier.world.raw()
    const ray = world.castRay(new RAPIER.Ray(playerPos, { x: 0, y: -1, z: 0 }))
    const grounded = ray && ray.collider && Math.abs(ray.toi) <= 1.75
    if (jump && grounded) ref.current.setLinvel({ x: 0, y: 7.5, z: 0 })

    // Void check
    if (playerPos.y < -20) {
      ref.current.setTranslation({ x: 0, y: 10, z: 0 })
      ref.current.setLinvel({ x: 0, y: 0, z: 0 })
    }

    // Multiplayer sync (~20 Hz)
    if (state.clock.elapsedTime % 0.05 < 0.02) {
      const rot = state.camera.rotation
      updatePosition([playerPos.x, playerPos.y, playerPos.z], [rot.x, rot.y, rot.z])
    }
  })

  return (
    <>
      <RigidBody ref={ref} colliders={false} mass={1} type="dynamic" position={[0, 10, 0]} enabledRotations={[false, false, false]} linearDamping={12}>
        <CapsuleCollider args={[0.75, 0.5]} />
      </RigidBody>

      {/* First person: show hand + tool */}
      {cameraMode === 'first' && (
        <group ref={axe} onPointerMissed={() => {
          if (axe.current?.children[0]) axe.current.children[0].rotation.x = -0.8
        }}>
          <Tool position={[0.4, -0.2, 0.3]} />
        </group>
      )}

      {/* Third person: show character body that follows the RigidBody each frame */}
      {cameraMode !== 'first' && <PlayerBody rigidBodyRef={ref} />}
    </>
  )
}
