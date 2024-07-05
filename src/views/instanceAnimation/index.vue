<template>
  <div id="container"></div>
</template>
  
<script setup>
import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { onMounted } from 'vue'

import bar from './model/bar.glb'
import aoMap from './model/texture/aoMap.png'
import uFBO from './model/texture/maskMap.png'
import state1 from './model/texture/maskMap.png'
import state2 from './model/texture/map.png'
import fragment from './shader/fragment.glsl'
import vertex from './shader/vertex.glsl'

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

const geometry = new THREE.BoxGeometry(1, 1, 1)
let material = new THREE.ShaderMaterial({
  uniforms: {},
  vertexShader: vertex,
  fragmentShader: fragment
})
let aoTexture = new THREE.TextureLoader().load(aoMap)
// 为了防止纹理在加载时翻转，可以将 texture.flipY 设置为 false
aoTexture.flipY = false
material = new THREE.MeshPhysicalMaterial({
  roughness: 0.72,
  map: aoTexture,
  aoMap: aoTexture,
  aoMapIntensity: 0.65
})
const cube = new THREE.Mesh(geometry, material)
// scene.add( cube );

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
  apMap: { value: aoMap },
  uFBO: { value: new THREE.TextureLoader().load(uFBO) },
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
        `
    )
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        #include <begin_vertex>
        vUv = instanceUV;
        vHeightUV = clamp(position.y*2.,0.,1.);
        vec4 transition = texture2D(uFBO,instanceUV);
        // 控制顶点位置，间接控制大小
        transformed *= (transition.g);
        vHeight = transformed.y;
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
        diffuseColor.rgb = mix(diffuseColor.rgb,highlight,clamp(vHeight/10. -3.,0.,1.));
        `
    )
  }

  //   mesh.material = material

  scene.add(getMatrix(mesh))
})

let fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1)
let fboScene = new THREE.Scene()
let fbo = new THREE.WebGLRenderTarget(window.width, window.height)
function setFBO() {
  let fboMaterial = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      uFBO: { value: null },
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
console.log(fboScene.matrixWorldAutoUpdate, fboCamera)
function animate() {
  requestAnimationFrame(animate)

  renderer.setRenderTarget(fbo)
  renderer.render(fboScene, fboCamera)
  renderer.setRenderTarget(null)
  uniforms.uFBO.value = fbo.texture
  // console.log(fboScene,fboCamera);
  renderer.render(scene, camera)
}
onMounted(() => {
  const container = document.querySelector('#container')
  container.appendChild(renderer.domElement)
  animate()
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