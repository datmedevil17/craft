import React, { Suspense } from "react"
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
import { TxToast } from "./TxToast"

function Game() {
  const gameStarted = useCubeStore((state) => state.gameStarted)
  const isGameOver = useCubeStore((state) => state.isGameOver)

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
            <Animals />
            <NPCs />
            <Enemies />
            <Environment />
          </>
        )}
      </Physics>
      {gameStarted && !isGameOver && <PointerLockControls />}
    </>
  )
}

export default function App() {
  return (
    <SolanaProvider>
      <KeyboardControls
        map={[
          { name: "forward", keys: ["ArrowUp", "w", "W"] },
          { name: "backward", keys: ["ArrowDown", "s", "S"] },
          { name: "left", keys: ["ArrowLeft", "a", "A"] },
          { name: "right", keys: ["ArrowRight", "d", "D"] },
          { name: "jump", keys: ["Space"] },
        ]}>
        <Canvas shadows camera={{ fov: 45 }}>
          <Suspense fallback={null}>
            <Game />
          </Suspense>
        </Canvas>
        <UI />
        <TxToast />
      </KeyboardControls>
    </SolanaProvider>
  )
}
