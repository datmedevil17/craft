import * as THREE from "three"
import * as RAPIER from "@dimforge/rapier3d-compat"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { useKeyboardControls } from "@react-three/drei"
import { CapsuleCollider, RigidBody, useRapier } from "@react-three/rapier"
import Tool from "./Tool"
import { useSocket } from "./SocketContext"

const SPEED = 5
const direction = new THREE.Vector3()
const frontVector = new THREE.Vector3()
const sideVector = new THREE.Vector3()
const rotationVec = new THREE.Vector3() // Renamed to avoid confusion

export function Player({ lerp = THREE.MathUtils.lerp }) {
  const { updatePosition } = useSocket()
  const axe = useRef()
  const ref = useRef() // RigidBody ref
  const rapier = useRapier()
  const [, get] = useKeyboardControls()

  const swinging = useRef(false)
  const swingStartTime = useRef(0)

  useFrame((state) => {
    const { forward, backward, left, right, jump } = get()
    if (!ref.current) return
    const velocity = ref.current.linvel()

    // Check for click to swing
    if (state.mouse.buttons === 1 && !swinging.current) {
      swinging.current = true
      swingStartTime.current = state.clock.elapsedTime
    }

    // Handle swing duration (0.3s)
    if (swinging.current && state.clock.elapsedTime - swingStartTime.current > 0.3) {
      swinging.current = false
    }

    // update camera
    state.camera.position.set(...ref.current.translation())

    // update axe animation
    const isSwinging = swinging.current
    const swingRotation = isSwinging ? -1.2 : 0
    const walkWobble = (velocity.length() > 1) ? Math.sin(state.clock.elapsedTime * 10) / 6 : 0

    if (axe.current && axe.current.children[0]) {
      // Smoothly rotate the tool
      axe.current.children[0].rotation.x = lerp(
        axe.current.children[0].rotation.x,
        swingRotation + walkWobble,
        isSwinging ? 0.3 : 0.1
      )
    }

    axe.current.rotation.copy(state.camera.rotation)
    axe.current.position.copy(state.camera.position).add(state.camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(1))

    // movement logic ...
    frontVector.set(0, 0, Number(backward) - Number(forward))
    sideVector.set(Number(left) - Number(right), 0, 0)
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .applyEuler(state.camera.rotation)
    direction.y = 0
    if (direction.length() > 0) {
      direction.normalize().multiplyScalar(SPEED)
    }
    ref.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z })
    // jumping
    const world = rapier.world.raw()
    const ray = world.castRay(new RAPIER.Ray(ref.current.translation(), { x: 0, y: -1, z: 0 }))
    const grounded = ray && ray.collider && Math.abs(ray.toi) <= 1.75
    if (jump && grounded) ref.current.setLinvel({ x: 0, y: 7.5, z: 0 })

    // void check
    const translation = ref.current.translation()
    if (translation.y < -20) {
      ref.current.setTranslation({ x: 0, y: 10, z: 0 })
      ref.current.setLinvel({ x: 0, y: 0, z: 0 })
    }

    // Multiplayer sync
    if (state.clock.elapsedTime % 0.05 < 0.02) { // Roughly 20 times per second
      const pos = ref.current.translation()
      const rot = state.camera.rotation
      updatePosition([pos.x, pos.y, pos.z], [rot.x, rot.y, rot.z])
    }
  })
  return (
    <>
      <RigidBody ref={ref} colliders={false} mass={1} type="dynamic" position={[0, 10, 0]} enabledRotations={[false, false, false]}>
        <CapsuleCollider args={[0.75, 0.5]} />
      </RigidBody>
      <group ref={axe} onPointerMissed={(e) => (axe.current.children[0].rotation.x = -0.8)}>
        <Tool position={[0.4, -0.2, 0.3]} />
      </group>
    </>
  )
}
