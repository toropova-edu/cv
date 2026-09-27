/**
 * Cetacean renderer. Loaded lazily (dynamic import) so three.js never touches the first paint.
 *
 * The models are static meshes with no rig, so all motion is done in the vertex shader:
 *  - tail: a dorsoventral wave, ~still at the head and growing toward the fluke;
 *  - pectoral flippers: each one rotates about a hinge along its root. A per-vertex weight
 *    (0 at the body, 1 at the tip) scales the angle, so the flipper bends smoothly instead of tearing.
 * Normals follow both deformations so the light stays right.
 * All materials are fully matte (roughness 1, metalness 0); textured species keep their colour.
 */
import {
  ACESFilmicToneMapping,
  BufferAttribute,
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
  Texture,
  Vector2,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export type Species = 'beluga' | 'minke' | 'porpoise'

/**
 * head: which end of the model's x axis the head points to (+1 / −1).
 * amp: tail wave amplitude at the fluke (model units).
 * flip: where the pectoral flippers sit along the body (x with head = −1, fluke = +1),
 *       their stroke (degrees) and rate relative to the tail beat.
 */
const SPECIES: Record<
  Species,
  { url: string; head: 1 | -1; amp: number; flip: { x0: number; x1: number; deg: number; rate: number } }
> = {
  beluga: { url: 'assets/models/beluga.glb', head: -1, amp: 0.11, flip: { x0: -0.6, x1: -0.1, deg: 16, rate: 0.55 } },
  // long and slim: a shallower beat, small flippers held close
  minke: { url: 'assets/models/minke.glb', head: 1, amp: 0.07, flip: { x0: -0.6, x1: -0.25, deg: 11, rate: 0.5 } },
  porpoise: { url: 'assets/models/porpoise.glb', head: 1, amp: 0.12, flip: { x0: -0.65, x1: -0.3, deg: 18, rate: 0.6 } },
}

type Model = { geometry: BufferGeometry; map: Texture | null; hinge: Vector2 }
const cache = new Map<Species, Promise<Model>>()

/** Float copy of an attribute (meshopt/quantized ones are normalized ints). */
function toFloat(attr: BufferAttribute, size: number) {
  const out = new Float32Array(attr.count * size)
  for (let i = 0; i < attr.count; i++) {
    out[i * size] = attr.getX(i)
    if (size > 1) out[i * size + 1] = attr.getY(i)
    if (size > 2) out[i * size + 2] = attr.getZ(i)
  }
  return new BufferAttribute(out, size)
}

const median = (a: number[]) => {
  if (!a.length) return 0
  const s = [...a].sort((p, q) => p - q)
  return s[s.length >> 1]
}
const percentile = (a: number[], q: number) => {
  if (!a.length) return 0
  const s = [...a].sort((p, r) => p - r)
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]
}

/**
 * Per-vertex flipper weight. The body's true half-width at each station comes from its *upper* half
 * (flippers only hang below); anything in the flipper window that reaches past it on the lower half
 * is flipper, weighted by how far it reaches. Returns the weights and the hinge (y, |z|).
 */
function flipperWeights(pos: BufferAttribute, head: number, x0: number, x1: number) {
  const n = pos.count
  const BINS = 40
  const xn = new Float32Array(n)
  const bin = new Int32Array(n)
  const byBin: number[][] = Array.from({ length: BINS }, () => [])
  for (let i = 0; i < n; i++) {
    xn[i] = -pos.getX(i) * head
    bin[i] = Math.min(BINS - 1, Math.max(0, Math.floor(((xn[i] + 1) / 2) * BINS)))
    byBin[bin[i]].push(i)
  }
  const mid = new Float32Array(BINS)
  const bodyR = new Float32Array(BINS)
  for (let b = 0; b < BINS; b++) {
    const ids = byBin[b]
    if (ids.length < 10) continue
    mid[b] = median(ids.map((i) => pos.getY(i)))
    const upper = ids.filter((i) => pos.getY(i) > mid[b]).map((i) => Math.abs(pos.getZ(i)))
    bodyR[b] = upper.length > 5 ? percentile(upper, 0.95) : percentile(ids.map((i) => Math.abs(pos.getZ(i))), 0.6)
  }
  const w = new Float32Array(n)
  const hy: number[] = []
  const hz: number[] = []
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
  for (let i = 0; i < n; i++) {
    const R = bodyR[bin[i]]
    const xm = clamp01((xn[i] - x0) / 0.06) * clamp01((x1 - xn[i]) / 0.06)
    const reach = clamp01((Math.abs(pos.getZ(i)) - R * 1.02) / Math.max(R * 0.9, 0.05))
    const below = clamp01((mid[bin[i]] - pos.getY(i)) / 0.05)
    w[i] = Math.pow(reach, 1.2) * below * xm
    if (w[i] > 0.02) {
      hz.push(R)
      if (w[i] < 0.25) hy.push(pos.getY(i))
    }
  }
  return { w, hinge: new Vector2(median(hy), median(hz)) }
}

function loadModel(species: Species) {
  let p = cache.get(species)
  if (!p) {
    const spec = SPECIES[species]
    p = new GLTFLoader()
      .setMeshoptDecoder(MeshoptDecoder)
      .loadAsync(spec.url)
      .then((gltf) => {
        let found: Mesh | null = null
        gltf.scene.updateMatrixWorld(true)
        gltf.scene.traverse((o) => {
          if (!found && (o as Mesh).isMesh) found = o as Mesh
        })
        if (!found) throw new Error(`${species}: no mesh`)
        const mesh = found as Mesh
        const src = mesh.geometry
        // Bake the node transform (dequantisation scale/offset) into plain float geometry
        const geometry = new BufferGeometry()
        geometry.setIndex(src.getIndex())
        geometry.setAttribute('position', toFloat(src.getAttribute('position') as BufferAttribute, 3))
        const nrm = src.getAttribute('normal') as BufferAttribute | undefined
        if (nrm) geometry.setAttribute('normal', toFloat(nrm, 3))
        const uv = src.getAttribute('uv') as BufferAttribute | undefined
        if (uv) geometry.setAttribute('uv', toFloat(uv, 2))
        geometry.applyMatrix4(mesh.matrixWorld)
        if (!nrm) geometry.computeVertexNormals()

        const { w, hinge } = flipperWeights(
          geometry.getAttribute('position') as BufferAttribute,
          spec.head,
          spec.flip.x0,
          spec.flip.x1,
        )
        geometry.setAttribute('aFlip', new BufferAttribute(w, 1))
        const map = (mesh.material as MeshStandardMaterial).map ?? null
        return { geometry, map, hinge }
      })
    cache.set(species, p)
  }
  return p
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

export async function mountWhale(
  canvas: HTMLCanvasElement,
  look: Look,
  onFrame: (f: Frame) => void,
  species: Species = 'beluga',
) {
  const { geometry, map, hinge } = await loadModel(species)
  const spec = SPECIES[species]

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
  scene.add(new HemisphereLight(deep ? 0xcfe3e4 : 0xf4f3ee, deep ? 0x061a1d : 0x0d2a2e, deep ? 0.9 : map ? 1.6 : 1.3))
  const sun = new DirectionalLight(0xffffff, deep ? 0.9 : map ? 1.9 : 1.6)
  sun.position.set(-1.5, 4, 2.5)
  scene.add(sun)
  // Soft teal rim from behind and below: separates dark backs (minke, porpoise) from the black page
  const rim = new DirectionalLight(0x8fd6dd, deep ? 0.35 : 1.5)
  rim.position.set(1.2, -1.2, -3)
  scene.add(rim)

  // Matte — no gloss, no metal. The beluga is plain white; the others keep their own colours.
  const material = new MeshStandardMaterial({ color: map ? 0xffffff : 0xf1f0eb, map, roughness: 1, metalness: 0 })
  const swim = { speed: 2.1, amp: spec.amp }
  const u = {
    uPhase: { value: 0 },
    uAmp: { value: swim.amp },
    uHead: { value: spec.head },
    uFlipAng: { value: 0 },
    uHinge: { value: hinge },
  }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u)
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uPhase;
        uniform float uAmp;
        uniform float uHead;
        uniform float uFlipAng;
        uniform vec2 uHinge;
        attribute float aFlip;
        // x along the body with the head at −1 and the fluke at +1, whatever the model's own orientation
        float swim(float px) {
          float x = -px * uHead;
          float w = smoothstep(-0.35, 1.0, x);
          return uAmp * w * w * sin(uPhase - x * 3.2);
        }
        // rotate (outward reach, height) about the flipper hinge; angle grows root → tip
        vec2 flap(vec2 dh, float a) {
          float c = cos(a), s = sin(a);
          return vec2(dh.x * c - dh.y * s, dh.x * s + dh.y * c);
        }`,
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        float fa = uFlipAng * aFlip;
        float side = position.z >= 0.0 ? 1.0 : -1.0;
        vec2 fn = flap(vec2(objectNormal.z * side, objectNormal.y), fa);
        objectNormal = vec3(objectNormal.x, fn.y, fn.x * side);
        float e = 0.01;
        float slope = (swim(position.x + e) - swim(position.x - e)) / (2.0 * e);
        objectNormal = normalize(objectNormal + vec3(-slope * objectNormal.y, slope * objectNormal.x, 0.0));`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec2 dh = flap(vec2(abs(position.z) - uHinge.y, position.y - uHinge.x), fa);
        transformed.y = uHinge.x + dh.y;
        transformed.z = side * (uHinge.y + dh.x);
        transformed.y += swim(position.x);`,
      )
  }

  const whale = new Group()
  // user turn (arrows) sits between the pose and the body, so it composes with the swimming pose
  const turn = new Group()
  const body = new Mesh(geometry, material)
  // every species faces −x (screen left) in the scene
  if (spec.head === 1) body.rotation.y = Math.PI
  turn.add(body)
  whale.add(turn)
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

  // Turn spring: critically damped (no overshoot), ~0.55 s response. Re-targeting mid-turn keeps
  // the current velocity, so rapid taps blend instead of snapping.
  const SPRING_K = ((2 * Math.PI) / 0.55) ** 2
  const SPRING_C = 2 * Math.sqrt(SPRING_K)
  const yaw = { x: 0, v: 0, target: 0 }

  const clock = new Clock(false)
  let t = 0
  let phase = 0
  let flipPhase = 0
  let running = false
  const flipAmp = (spec.flip.deg * Math.PI) / 180
  const frame = () => {
    const dt = Math.min(clock.getDelta(), 0.05) // a long pause must not teleport the whale
    t += dt
    onFrame({ t, dt, whale, halfW, halfH, swim })
    phase += dt * swim.speed
    // flippers paddle slower than the tail, in step with it, and a little more when the tail works harder
    flipPhase += dt * swim.speed * spec.flip.rate
    u.uPhase.value = phase
    u.uAmp.value = swim.amp
    u.uFlipAng.value = flipAmp * (swim.amp / spec.amp) * Math.sin(flipPhase)

    yaw.v += (SPRING_K * (yaw.target - yaw.x) - SPRING_C * yaw.v) * dt
    yaw.x += yaw.v * dt
    turn.rotation.y = yaw.x

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
    /** turn the animal about its vertical axis, in degrees (clamped by the caller) */
    turnTo(deg: number) {
      yaw.target = (deg * Math.PI) / 180
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
