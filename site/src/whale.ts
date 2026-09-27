/**
 * Beluga renderer. Loaded lazily (dynamic import) so three.js never touches the first paint.
 *
 * The model is a static mesh with no rig, so swimming is done in the vertex shader:
 * a dorsoventral wave that is ~still at the head (−x) and grows toward the fluke (+x),
 * with normals tilted by the wave's slope so the light follows the bend.
 */
import {
  ACESFilmicToneMapping,
  BufferGeometry,
  Clock,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const MODEL = 'assets/models/beluga.glb'

let geometry: Promise<BufferGeometry> | null = null
function loadGeometry() {
  geometry ??= new GLTFLoader()
    .setMeshoptDecoder(MeshoptDecoder)
    .loadAsync(MODEL)
    .then((gltf) => {
      let g: BufferGeometry | null = null
      gltf.scene.traverse((o) => {
        if (!g && (o as Mesh).isMesh) g = (o as Mesh).geometry
      })
      if (!g) throw new Error('beluga: no mesh')
      const geo = g as BufferGeometry
      geo.computeVertexNormals()
      return geo
    })
  return geometry
}

export type Look = 'deep' | 'near'

export type Frame = {
  /** seconds of *active* time (pauses while the view is stopped) */
  t: number
  dt: number
  whale: Group
  /** half the visible width/height at the whale's depth, in world units */
  halfW: number
  halfH: number
  swim: { speed: number; amp: number }
}

export async function mountWhale(canvas: HTMLCanvasElement, look: Look, onFrame: (f: Frame) => void) {
  const geo = await loadGeometry()

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new PerspectiveCamera(30, 1, 0.1, 50)
  camera.position.set(0, 0, 5)

  // Light from the surface above; the deep one is dimmer and bluer, as if seen through water
  const deep = look === 'deep'
  scene.add(new HemisphereLight(deep ? 0xcfe3e4 : 0xf4f3ee, deep ? 0x061a1d : 0x0d2a2e, deep ? 0.9 : 1.3))
  const sun = new DirectionalLight(0xffffff, deep ? 0.9 : 1.6)
  sun.position.set(-1.5, 4, 2.5)
  scene.add(sun)

  // Matte white — no gloss, no metal
  const material = new MeshStandardMaterial({ color: 0xf1f0eb, roughness: 1, metalness: 0 })
  const swim = { speed: 2.1, amp: 0.11 }
  const u = { uPhase: { value: 0 }, uAmp: { value: swim.amp } }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPhase = u.uPhase
    shader.uniforms.uAmp = u.uAmp
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uPhase;
        uniform float uAmp;
        float swim(float x) {
          float w = smoothstep(-0.35, 1.0, x);
          return uAmp * w * w * sin(uPhase - x * 3.2);
        }`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        float e = 0.01;
        float slope = (swim(position.x + e) - swim(position.x - e)) / (2.0 * e);
        objectNormal = normalize(objectNormal + vec3(-slope * objectNormal.y, slope * objectNormal.x, 0.0));`,
      )
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n        transformed.y += swim(position.x);`)
  }

  const whale = new Group()
  whale.add(new Mesh(geo, material))
  scene.add(whale)

  let halfW = 1
  let halfH = 1
  const resize = () => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    halfH = Math.tan((camera.fov * Math.PI) / 360) * camera.position.z
    halfW = halfH * camera.aspect
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(canvas)

  const clock = new Clock(false)
  let t = 0
  let phase = 0
  let running = false
  const frame = () => {
    const dt = Math.min(clock.getDelta(), 0.05) // a long pause must not teleport the whale
    t += dt
    onFrame({ t, dt, whale, halfW, halfH, swim })
    phase += dt * swim.speed
    u.uPhase.value = phase
    u.uAmp.value = swim.amp
    renderer.render(scene, camera)
  }

  return {
    start() {
      if (running) return
      running = true
      clock.start()
      renderer.setAnimationLoop(frame)
    },
    stop() {
      if (!running) return
      running = false
      clock.stop()
      renderer.setAnimationLoop(null)
    },
    dispose() {
      renderer.setAnimationLoop(null)
      ro.disconnect()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}

export type WhaleView = Awaited<ReturnType<typeof mountWhale>>
