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

import fireBallHead from "./model/fireBallHead.glb";
import T_Tail from "./model/texture/tail.png";
import T_Head from "./model/texture/T_Noise_09.png";

let stats = new Stats();
let time = new THREE.Clock();
let scene = new THREE.Scene();
let gui = new GUI();
let camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x08092d, 1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

let fire = new THREE.Group();
fire.name = "fire";

let fireBallHeadMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    offset: { value: 0 },
    speed: { value: 1 },
    intensity: { value: 10 },
    baseColor: { value: new THREE.Color(0x00ffee) },
    headNoise: { value: new THREE.TextureLoader().load(T_Head) },
  },
  vertexShader: `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }`,
  fragmentShader: `
  varying vec2 vUv;
  uniform sampler2D headNoise;
  uniform vec3 baseColor;
  uniform float intensity;
  uniform float time;
  uniform float offset;
  uniform float speed;

  void main() {
    vec2 v_uv1 = vUv;
    v_uv1.x = fract(v_uv1.x - time*speed);
    vec4 color = texture2D(headNoise,v_uv1);

    float gradient = smoothstep(0.35,0.8,v_uv1.y);
    color*=gradient;
    gl_FragColor = vec4(baseColor*intensity,color.r);
    // gl_FragColor = color;

  }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthTest: false,
  blending: THREE.AdditiveBlending,
});

let setting = {
  intensity: 1,
  headColor: new THREE.Color(0x00ffee),
  ballColor: new THREE.Color(0x00e1ff),
  tailColor: new THREE.Color(0x00e1ff),
  speed: 4,
};

// Head
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/gltf/");
loader.setDRACOLoader(dracoLoader);
loader.load(fireBallHead, (gltf) => {
  console.log(gltf);
  gltf.scene.children[0].material = fireBallHeadMaterial;
  // scene.add(gltf.scene);
  fire.add(gltf.scene.children[0]);
});

//ball
const geometry = new THREE.SphereGeometry(0.72, 64, 64);
const ballMaterial = new THREE.ShaderMaterial({
  uniforms: {
    baseColor: { value: setting.ballColor },
  },
  vertexShader: `
    varying vec3 vPositionW;
    varying vec3 vNormalW;

    void main() {

    vPositionW = vec3( vec4( position, 1.0 ) * modelMatrix);
    vNormalW = normalize( vec3( vec4( normal, 0.0 ) * modelMatrix ) );

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`,

  fragmentShader: `
    varying vec3 vPositionW;
    varying vec3 vNormalW;
    uniform vec3 baseColor;
    void main() {

    vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
    float fresnelTerm = dot(viewDirectionW, vNormalW);
    fresnelTerm = pow(fresnelTerm,6.);
    fresnelTerm = clamp(fresnelTerm, 0., 1.);

    gl_FragColor = vec4( baseColor,fresnelTerm);

    }`,
  transparent: true,
  depthTest: false,
  depthWrite: false,
});
const ball = new THREE.Mesh(geometry, ballMaterial);
ball.position.x = -0.3;
fire.add(ball);

const tail = new THREE.PlaneGeometry(3,1.8);
const tailMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  transparent: true,
  depthTest: false,
  depthWrite: false,
  uniforms:{
    time:{value:0},
    baseColor:{value:setting.tailColor},
    speed:{value:setting.speed},
    tailMap:{value:new THREE.TextureLoader().load(T_Tail)}
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,

  fragmentShader: `
    uniform vec3 baseColor;
    uniform float time;
    uniform float speed;
    uniform sampler2D tailMap;
    varying vec2 vUv;
    void main() {
      vec2 v_uv1 = vUv;
      v_uv1.x = fract(v_uv1.x - time*speed);
      float opacity = texture2D(tailMap,v_uv1).r;
      // xgradient
      float xgradient = smoothstep(0.01,0.2,vUv.x)*smoothstep(1.,0.5,vUv.x);
      // ygradient
      float ygradient = smoothstep(0.01,0.2,vUv.y)*smoothstep(1.,0.8,vUv.y);
      opacity=opacity*xgradient*ygradient;
      gl_FragColor = vec4(baseColor,opacity);
      // gl_FragColor = vec4(vec3(gradient),1.);
    }`,
});
const plane1 = new THREE.Mesh(tail, tailMaterial);
const plane2 = new THREE.Mesh(tail, tailMaterial);
plane1.position.x = 1.2;
plane2.position.x = 1.2;
plane2.rotation.x = Math.PI / 6;
plane1.rotation.x = -Math.PI / 6;
fire.add(plane1, plane2);

gui.add(setting, "intensity", 0, 1, 0.01).onChange((val) => {
  fireBallHeadMaterial.uniforms.intensity.value = val;
});
gui.add(setting, "speed", 0, 10, 0.01).onChange((val) => {
  fireBallHeadMaterial.uniforms.speed.value = val;
  tailMaterial.uniforms.speed.value = val;
});
gui.addColor(setting, "headColor").onChange((val) => {
  fireBallHeadMaterial.uniforms.baseColor.value.set(val);
});
gui.addColor(setting, "ballColor").onChange((val) => {
  ballMaterial.uniforms.baseColor.value.set(val);
});
gui.addColor(setting, "tailColor").onChange((val) => {
  tailMaterial.uniforms.baseColor.value.set(val);
});

scene.add(fire);

function animate() {
  requestAnimationFrame(animate);
  stats.update();
  fireBallHeadMaterial.uniforms.time.value = time.getElapsedTime();
  tailMaterial.uniforms.time.value = time.getElapsedTime();
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
