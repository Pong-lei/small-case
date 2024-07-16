<template>
  <div id="container"></div>
</template>

<script setup>
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

import { onMounted, onUnmounted } from "vue";

import airFlow from "./model/airflow.glb";
import noiseMap from "./model/texture/noiseMap.png";

// base scene
let scene = new THREE.Scene();
let stats = new Stats();
let time = new THREE.Clock();
let gui = new GUI();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  1,
  1000
);
camera.position.set(1.7, 1, 1.6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// setting and material
let setting = {
  baseColor: new THREE.Color(0x12c6d3),
  speed:0.1
};

let flowMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  transparent: true,
  uniforms: {
    baseColor: { value: setting.baseColor },
    TNoise: { value: new THREE.TextureLoader().load(noiseMap) },
    time: { value: 0 },
    speed:{value:0.7}
  },
  vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }`,
  fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform vec3 baseColor;
      uniform float speed;
      uniform sampler2D TNoise;
      void main(){
        vec2 _uv = vUv;
        float offset = clamp(0.5,1.,sin(_uv.x*20.));
        _uv.y = mod(_uv.y+time*speed+offset,1.);
        _uv.x = mod(_uv.x*6.,1.);
        vec4 color = texture2D(TNoise,_uv);
        float alpha = smoothstep(0.4,0.8,color.r);
        gl_FragColor = vec4(color.rgb*baseColor,alpha);
      }
    `,
});

gui.add(setting,'speed',0,4,0.1).onChange(val=>{
  flowMaterial.uniforms.speed.value = val
})
gui.addColor(setting,'baseColor').onChange(val=>{
  flowMaterial.uniforms.baseColor.value = val
})

// load gltf
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/gltf/");
loader.setDRACOLoader(dracoLoader);
loader.load(airFlow, (gltf) => {
  gltf.scene.children[0].material = flowMaterial;
  scene.add(gltf.scene.children[0]);
});


function animate() {
  requestAnimationFrame(animate);
  stats.update();
  flowMaterial.uniforms.time.value = time.getElapsedTime();
  renderer.render(scene, camera);
}
onMounted(() => {
  const container = document.querySelector("#container");
  container.appendChild(renderer.domElement);
  container.appendChild(stats.dom);
  animate();
});

onUnmounted(() => {
  gui.destroy();
});
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
