import React, { Suspense, useRef, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { Sky, PointerLockControls, KeyboardControls } from "@react-three/drei"
import { Physics } from "@react-three/rapier"
import { Ground } from "./Ground"
import { Player } from "./Player"
import { Cubes } from "./Cube"
import { UI } from "./UI"
import { Animals } from "./Animals"
import { NPCs } from "./NPCs"
import { Environment } from "./Environment"
import { Enemies } from "./Enemies"
import { Sun } from "./Sun"
import { Atmosphere } from "./Atmosphere"
import { SolanaProvider } from "./SolanaProvider"
import { useCubeStore } from "./useStore"
import { inventoryFlags } from "./inventoryFlags"
import { TxToast } from "./TxToast"
import { SocketProvider } from "./SocketContext"
import { OtherPlayers } from "./OtherPlayers"
import { TestPage } from "./TestPage"

const isTestPage = window.location.pathname === "/test"

function Game() {
  const gameStarted = useCubeStore((state) => state.gameStarted)
  const isGameOver = useCubeStore((state) => state.isGameOver)
  const isInventoryOpen = useCubeStore((state) => state.isInventoryOpen)
  const isMenuOpen = useCubeStore((state) => state.isMenuOpen)

  return (
    <>
      <Sky sunPosition={[100, 80, 100]} />
      <Sun />
      <Atmosphere />
      <ambientLight intensity={0.4} />
      <directionalLight
        castShadow
        intensity={1.5}
        position={[100, 80, 100]}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
      <Physics gravity={[0, -30, 0]}>
        <Ground />
        <Cubes />
        {gameStarted && (
          <>
            <Player />
            <OtherPlayers />
            <Animals />
            <NPCs />
            <Enemies />
            <Environment />
          </>
        )}
      </Physics>

      {/*
        Only mount PointerLockControls when inventory AND menu are closed.
        trois/drei's PointerLockControls has an internal click listener that would
        re-lock the cursor even while inventory is open if we kept it mounted.
      */}
      {gameStarted && !isGameOver && !isInventoryOpen && !isMenuOpen && (
        <PointerLockControls />
      )}
    </>
  )
}

export default function App() {
  if (isTestPage) {
    return (
      <SolanaProvider>
        <TestPage />
      </SolanaProvider>
    )
  }

  return (
    <SolanaProvider>
      <SocketProvider>
        {/* Listen for pointer lock changes to open Game Menu on Esc */}
        <PointerLockMenuHandler />
        <KeyboardControls
          map={[
            { name: "forward", keys: ["ArrowUp", "w", "W"] },
            { name: "backward", keys: ["ArrowDown", "s", "S"] },
            { name: "left", keys: ["ArrowLeft", "a", "A"] },
            { name: "right", keys: ["ArrowRight", "d", "D"] },
            { name: "jump", keys: ["Space"] },
            { name: "sprint", keys: ["ShiftLeft", "ShiftRight"] },
          ]}>
          <Canvas
            shadows
            camera={{ fov: 45 }}
          >
            <Suspense fallback={null}>
              <Game />
            </Suspense>
          </Canvas>
          <UI />
          <TxToast />
        </KeyboardControls>
      </SocketProvider>
    </SolanaProvider>
  )
}

/**
 * Dedicated component that listens to real pointerlockchange events.
 * Opens the Game Menu when the cursor is released via Esc (and not suppressed).
 */
function PointerLockMenuHandler() {
  useEffect(() => {
    // Track whether Esc was explicitly pressed while cursor was locked.
    // This is the ONLY reliable signal that the user wants the Game Menu.
    const escPressedRef = { current: false }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && document.pointerLockElement) {
        // User pressed Esc while in pointer lock → they want the Game Menu
        escPressedRef.current = true
      }
    }

    const handleLockChange = () => {
      if (document.pointerLockElement) {
        // Lock acquired — reset flag
        escPressedRef.current = false
      } else {
        // Lock released
        if (inventoryFlags.suppressNextMenuOpen) {
          inventoryFlags.suppressNextMenuOpen = false
          return
        }
        // Only open Game Menu if user explicitly pressed Esc while locked
        if (!escPressedRef.current) return
        escPressedRef.current = false

        const s = useCubeStore.getState()
        if (s.gameStarted && !s.isGameOver && !s.isInventoryOpen && !s.isMenuOpen) {
          useCubeStore.getState().setMenuOpen(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerlockchange', handleLockChange)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerlockchange', handleLockChange)
    }
  }, [])

  return null
}

