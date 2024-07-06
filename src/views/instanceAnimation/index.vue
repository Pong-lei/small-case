<template>
  <div id="container"></div>
</template>

<script setup>
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { onMounted ,onUnmounted} from 'vue'

import bar from './model/bar.glb'
import aoMap from './model/texture/aoMap.png'
import uFBO from './model/texture/maskMap.png'
import state1 from './model/texture/maskMap.png'
import state2 from './model/texture/map.png'
import fragment from './shader/fragment.glsl'
import vertex from './shader/vertex.glsl'

const noise = `//	Classic Perlin 3D Noise 
//	by Stefan Gustavson (https://github.com/stegu/webgl-noise)
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}`

let time = 0
let gui = new GUI()
let setting = {
  progress: 0
}
const scene = new THREE.Scene()
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 2, 3)

let frustumSize = window.innerHeight
let aspect = window.innerWidth / window.innerHeight
camera = new THREE.OrthographicCamera(
  (frustumSize * aspect) / -2,
  (frustumSize * aspect) / 2,
  frustumSize / 2,
  frustumSize / -2,
  -1000,
  1000
)
camera.position.set(2, 2, 2)
// scene.add(camera)
// scene.background = new THREE.Color(0xffffff); // 例如：黑色背景

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x08092d, 1)
const controls = new OrbitControls(camera, renderer.domElement)
controls.update()


let aoTexture = new THREE.TextureLoader().load(aoMap)
// 为了防止纹理在加载时翻转，可以将 texture.flipY 设置为 false
aoTexture.flipY = false
let material = new THREE.MeshPhysicalMaterial({
  roughness: 0.72,
  map: aoTexture,
  aoMap: aoTexture,
  aoMapIntensity: 0.65
})


let plane = new THREE.PlaneGeometry(400, 400)
let planeM = new THREE.MeshPhysicalMaterial({
  map: new THREE.TextureLoader().load(state1),
  side: THREE.DoubleSide
})
planeM.needsUpdate = true
let planeMesh = new THREE.Mesh(plane, planeM)
planeMesh.position.set(0, 200, 0)
// scene.add(planeMesh)

const light = new THREE.AmbientLight(0xffffff, 2) // 柔和的白光
scene.add(light)
const spotLight = new THREE.SpotLight(0xffe9e9, 0.5)
spotLight.position.set(-80, 200, -80)
spotLight.angle = 1
spotLight.penumbra = 1.5
const targetObject = new THREE.Object3D()
targetObject.position.set(0, -80, 200)
spotLight.target = targetObject
spotLight.intensity = 600
spotLight.distance = 3000
spotLight.decay = 0.6
scene.add(spotLight)
const axesHelper = new THREE.AxesHelper(5)




const loader = new GLTFLoader()
const dracoLoader = new DRACOLoader()
let uniforms = {
  time: { value: 0 },
  aoMap: { value: aoMap },
  uFBO: { value: null },
  lightColor: { value: new THREE.Color(0xffe9e9) },
  ramp_color_one: { value: new THREE.Color(0x06082d) },
  ramp_color_two: { value: new THREE.Color(0x020284) },
  ramp_color_three: { value: new THREE.Color(0x0000ff) },
  ramp_color_four: { value: new THREE.Color(0x71c7f5) }
}
dracoLoader.setDecoderPath('draco/gltf/')
loader.setDRACOLoader(dracoLoader)
loader.load(bar, (gltf) => {
  let mesh = gltf.scene.children[0]
  mesh.geometry.scale(40, 40, 40)

  material.onBeforeCompile = (shader) => {
    console.log(uniforms);
    shader.uniforms = Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
        uniform float time;
        uniform sampler2D uFBO;
        uniform vec3 lightColor;
        uniform vec3 ramp_color_one;
        uniform vec3 ramp_color_two;
        uniform vec3 ramp_color_three;
        uniform vec3 ramp_color_four;
        attribute vec2 instanceUV;
        varying float vHeight;
        varying float vHeightUV;
        varying vec2 vUv;
        ${noise}
        `
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>
        vUv = instanceUV;
        float n = cnoise(vec3(instanceUV.x*2.,instanceUV.y*2.,time*0.1));
        transformed.y+=n*90.;

        vHeightUV = clamp(position.y*2.,0.,1.);
        vec4 transition = texture2D(uFBO,instanceUV);
        // 控制顶点位置，间接控制大小
        transformed *= (transition.g);
        transformed.y+=transition.r*300.;
        vHeight = transformed.y*3.;
        `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
        #include <common>
        uniform sampler2D uFBO;
        uniform vec3 lightColor;
        uniform vec3 ramp_color_one;
        uniform vec3 ramp_color_two;
        uniform vec3 ramp_color_three;
        uniform vec3 ramp_color_four;
        varying vec2 vUv;
        varying float vHeightUV;
        varying float vHeight;
        `
    )
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
        #include <color_fragment>
        vec3 highlight = mix(ramp_color_three,ramp_color_four,vHeightUV);
        diffuseColor.rgb = ramp_color_two;
        diffuseColor.rgb = mix(diffuseColor.rgb,ramp_color_three,vHeightUV);
        diffuseColor.rgb = mix(diffuseColor.rgb,highlight,clamp(vHeight/2.-3.  ,0.,1.));
        // diffuseColor.rgb = highlight;
        `
    )
  }

  //   mesh.material = material

  scene.add(getMatrix(mesh))
})

let fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1)
let fboScene = new THREE.Scene()
let fbo = new THREE.WebGLRenderTarget(1024, 1024)
function setFBO() {
  let fboMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      ustate1: { value: new THREE.TextureLoader().load(state1) },
      ustate2: { value: new THREE.TextureLoader().load(state2) },
      uProgress: { value: 0 }
    },
    vertexShader: vertex,
    fragmentShader: fragment
  })
  let fboGeo = new THREE.PlaneGeometry(2, 2)
  let fboQuad = new THREE.Mesh(fboGeo, fboMaterial)

  gui.add(setting, 'progress', 0, 1, 0.01).onChange((val) => {
    fboMaterial.uniforms.uProgress.value = val
  })
  fboScene.add(fboQuad)
}
setFBO()

function getMatrix(mesh) {
  let iSize = 50
  let instances = iSize ** 2
  let instancesMesh = new THREE.InstancedMesh(
    mesh.geometry,
    material,
    instances
  )
  let temp = new THREE.Object3D()
  let width = 60
  let instanceUV = new Float32Array(instances * 2)
  for (let i = 0; i < iSize; i++) {
    for (let j = 0; j < iSize; j++) {
      instanceUV.set([i / iSize, j / iSize], (i * iSize + j) * 2)

      temp.position.set(width * (i - iSize / 2), 0, width * (j - iSize / 2))
      temp.updateMatrix()
      instancesMesh.setMatrixAt(i * iSize + j, temp.matrix)
    }
  }
  mesh.geometry.setAttribute(
    'instanceUV',
    new THREE.InstancedBufferAttribute(instanceUV, 2)
  )
  console.log(instancesMesh)
  return instancesMesh
}

function animate() {
  requestAnimationFrame(animate)
  time += 0.05
  renderer.setRenderTarget(fbo)
  renderer.render(fboScene, fboCamera)

  uniforms.uFBO.value = fbo.texture
  uniforms.time.value = time
  planeMesh.material.map = fbo.texture
  renderer.setRenderTarget(null)
  // planeM.needsUpdate = true
  console.log(fbo);
  renderer.render(scene, camera)
}
onMounted(() => {
  const container = document.querySelector('#container')
  container.appendChild(renderer.domElement)
  animate()
})
onUnmounted(()=>{
  gui.destroy()
})
</script>

<style lang="scss" scoped>
#container {
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
}
</style>