<template>
  <div id="container"></div>
</template>

<script setup>
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

import { onMounted, onUnmounted } from "vue";
import Stats from "three/addons/libs/stats.module.js";
import house from "./model/cyberpunk_city_1.glb";
import ICEMap from "./texture/tran.jpg";
import bgMap from "./texture/venice_sunset_1k.hdr"


import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

let stats = new Stats();
let gui = new GUI();
// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.01,
  10000
);
camera.position.z = 0.8;
// camera.position.x = 10;
camera.position.y = 0.4;
// camera.lookAt(0,6,0)

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.2;
scene.background = new THREE.Color(0x000000);
// document.body.appendChild(renderer.domElement);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0, 0.38, 0);
controls.update();

new RGBELoader().load(
  bgMap,
  (bg) => {
    bg.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = bg;
    scene.environment = bg;
    scene.backgroundBlurriness = 0.35;
  }
);

let row = 33;
let uvPosition = new Float32Array(row * row * 2);
for (let i = row; i > 0; i--) {
  for (let j = 0; j < row; j++) {
    uvPosition.set([j / row, i / row], ((row - i) * row + j) * 2);
  }
}
let texture = new THREE.TextureLoader().load(ICEMap);
texture.flipY = false;
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

let custonUniform = {
  sphereCenter: { value: new THREE.Vector3(0, 0, 0) },
  sphereRadius: { value: 0 },
  effectMap: { value: texture },
  time:{value:0}
};


// console.log(sphereGeometry);
const noise = `
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}`
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/gltf/");
loader.setDRACOLoader(dracoLoader);
loader.load(house, (gltf) => {
  // gltf.scene.scale.set(0.1, 0.1, 0.1);
  // gltf.scene.position.x = -5;
  // gltf.scene.position.y = -2;
  gltf.scene.rotation.y = Math.PI * 0.8;
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff,transparent:true});
  edgeMaterial.onBeforeCompile = (shader)=>{
    shader.uniforms = Object.assign(shader.uniforms, custonUniform);
    shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `
          #include <common>
          uniform vec3 sphereCenter;
          uniform float time;
          uniform float sphereRadius;
          varying float distance;
          varying vec2 _uv;
          `
        );
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `
            #include <begin_vertex>
              vec4 localPosition = (modelMatrix * vec4(position,1.));
              distance = length(localPosition);
              _uv = uv;
            `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `
          #include <common>
          varying float distance;
          uniform float sphereRadius;
          uniform sampler2D effectMap;
          varying vec2 _uv;
          `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `
            #include <color_fragment>
              float edge = 1.- smoothstep(sphereRadius,sphereRadius+0.05,distance);
              vec3 originColor = diffuseColor.rgb;
              vec3 mapColor =(texture2D(effectMap,_uv).xyz);
              mapColor = smoothstep(0.8,1.,mapColor);
              mapColor *= vec3(1.,0.,0.)*40.;
              // mapColor = vec3(_uv,1.);
              vec4 finallyColor = mix(vec4(0.),vec4(originColor,1.),edge);

              // vec3 color = texture2D(effectMap,_uv).xyz;
              diffuseColor = finallyColor;
            `
        );
  }
  gltf.scene.traverse((item) => {
    if (item.isMesh) {
      const edges = new THREE.EdgesGeometry( item.geometry );
      const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
      item.add(edgeLines);

      item.material.emissiveIntensity = 10.8
      item.material.onBeforeCompile = (shader) => {
        shader.uniforms = Object.assign(shader.uniforms, custonUniform);
        shader.vertexShader = shader.vertexShader.replace(
          "#include <common>",
          `
          #include <common>
          uniform vec3 sphereCenter;
          uniform float time;
          uniform float sphereRadius;
          varying float distance;
          varying vec2 _uv;
          ${noise}
          `
        );
        shader.vertexShader = shader.vertexShader.replace(
          "#include <begin_vertex>",
          `
            #include <begin_vertex>
              vec4 localPosition = (modelMatrix * vec4(position,1.));
              distance = length(localPosition);
              _uv = 0.1*vec2(uv.x + 0.5*snoise(uv+time*0.005),uv.y +  0.5*snoise(uv+time*0.005));
            `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <common>",
          `
          #include <common>
          varying float distance;
          uniform float sphereRadius;
          uniform sampler2D effectMap;
          varying vec2 _uv;
          `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
          "#include <color_fragment>",
          `
            #include <color_fragment>
              float edge = 1.- smoothstep(sphereRadius,sphereRadius+0.05,distance);
              vec3 originColor = diffuseColor.rgb;
              vec3 mapColor =(texture2D(effectMap,_uv).xyz);
              mapColor = smoothstep(0.8,1.,mapColor);
              mapColor *= vec3(1.,0.,0.)*40.;
              // mapColor = vec3(_uv,1.);
              vec3 finallyColor = mix(originColor,mapColor,edge);

              // vec3 color = texture2D(effectMap,_uv).xyz;
              diffuseColor.rgb = finallyColor;
            `
        );
      };
    }
  });
  scene.add(gltf.scene);
  // scene.add(lineGroup)
  // fire.add(gltf.scene.children[0]);
});
const light = new THREE.AmbientLight(0x404040, 1); // soft white light
scene.add(light);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

let setting = {
  sphereRadius: 0,
};
gui.add(setting, "sphereRadius", -1, 10, 0.0001).onChange((val) => {
  custonUniform.sphereRadius.value = val;
});

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  stats.update();
  custonUniform.time.value += 1
  // composer.render();
  renderer.render(scene, camera);
}

onMounted(() => {
  const container = document.querySelector("#container");
  container.appendChild(renderer.domElement);
  container.appendChild(stats.dom);
  animate();
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
