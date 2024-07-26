<template>
  <div id="container"></div>
</template>

<script setup>
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { onMounted, onUnmounted } from "vue";
import Stats from "three/addons/libs/stats.module.js";
import cyberpunkCity from "./model/cyberpunk_city_1.glb";
import ICEMap from "./texture/tran.jpg";
import bgMap from "./texture/venice_sunset_1k.hdr";

import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

let stats = new Stats();
let gui = new GUI();
// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 0.8;
camera.position.y = 0.4;

const cameraDepth = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10
);
cameraDepth.position.z = 0.8;
cameraDepth.position.y = 0.4;
camera.updateMatrix()
camera.updateWorldMatrix()
// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
scene.background = new THREE.Color(0x000000);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target = new THREE.Vector3(0, 0.38, 0);
controls.update();

new RGBELoader().load(bgMap, (bg) => {
  bg.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = bg;
  scene.environment = bg;
  scene.backgroundBlurriness = 0.35;
});

let texture = new THREE.TextureLoader().load(ICEMap);
texture.flipY = false;
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

let custonUniform = {
  sphereCenter: { value: new THREE.Vector3(0, 0, 0) },
  sphereRadius: { value: 0 },
  effectMap: { value: texture },
  time: { value: 0 },
};

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
}`;
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("draco/gltf/");
loader.setDRACOLoader(dracoLoader);
loader.load(cyberpunkCity, (gltf) => {
  gltf.scene.rotation.y = Math.PI * 0.8;
  scene.add(gltf.scene);
});
const light = new THREE.AmbientLight(0x404040, 1); // soft white light
scene.add(light);

// const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

let setting = {
  sphereRadius: 1000,
};

// 创建 EffectComposer
const composer = new EffectComposer(renderer);

// 添加 RenderPass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);
// console.log(cameraDepth);
// 自定义 ShaderPass
const customShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepthT: { value: null },
    effectMap: { value: texture },
    cameraNear: { value: camera.near },
    cameraFar: { value: camera.far },
    cameraProjectionMatrix: { value: camera.projectionMatrix },
    cameraInverseProjectionMatrix: {
      value: camera.projectionMatrixInverse,
    },
    cameraMatrixWorld:{
      value:camera.matrixWorld
    },
    radius:{value:setting.sphereRadius}
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #include <packing>

    uniform sampler2D tDiffuse;
    uniform sampler2D tDepthT;
    uniform sampler2D effectMap;
    uniform float cameraNear;
		uniform float cameraFar;
    uniform mat4 cameraProjectionMatrix;
		uniform mat4 cameraInverseProjectionMatrix;
    uniform float radius;
    uniform mat4 cameraMatrixWorld;
    varying vec2 vUv;
    varying vec3 vPosition;
    float readDepth( sampler2D depthSampler, vec2 coord ) {
      float fragCoordZ = texture2D( depthSampler, coord ).x;
      float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
      return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    }
    float getDepth( const in vec2 uv ) {
			return texture2D( tDepthT, uv ).x;
		}
		float getViewZ( const in float depth ) {
				return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
		}
		vec3 getViewPosition( const in vec2 uv, const in float depth/*clip space*/, const in float clipW ) {
			vec4 clipPosition = vec4( ( vec3( uv, depth ) - 0.5 ) * 2.0, 1.0 );//ndc
			clipPosition *= clipW; //clip
			return ( cameraInverseProjectionMatrix * clipPosition ).xyz;//view
		}
    vec3 worldPosFromDepth(float depth){
      float z = depth * 2.0 - 1.0;

      vec4 clipSpacePosition = vec4(vPosition.xy * 2.0 - 1.0, z, 1.0);
      vec4 viewSpacePosition = cameraInverseProjectionMatrix * clipSpacePosition;

      // Perspective division
      viewSpacePosition /= viewSpacePosition.w;

      vec4 worldSpacePosition = cameraMatrixWorld * viewSpacePosition;

      return worldSpacePosition.xyz;
    }
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      // float depthScene = readDepth( tDepthT, vUv );

       // 计算偏移坐标
      vec2 offset = vec2(1.0 / 1024.0); // 偏移量（1/纹理分辨率）
      float depth = getDepth( vUv );
      float depthLeft = getDepth( vUv - vec2(offset.x, 0.0));
      float depthRight = getDepth(vUv + vec2(offset.x, 0.0));
      float depthUp = getDepth(vUv - vec2(0.0, offset.y));
      float depthDown = getDepth(vUv + vec2(0.0, offset.y));
      float outLine = -4.*depth + depthLeft+depthRight+depthUp+depthDown;
      outLine = pow(outLine*1000.,0.8);

      // depth = 1. - pow(depth,20.);
			float viewZ = getViewZ( depth );
			// if(-viewZ>=cameraFar) return;

			float clipW = cameraProjectionMatrix[2][3] * viewZ+cameraProjectionMatrix[3][3];
			vec3 viewPosition = getViewPosition( vUv, depth, clipW );
      vec3 worldPosition =  (cameraMatrixWorld * vec4(viewPosition,1.)).xyz;


      // worldPosition = worldPosFromDepth(depth);
      float dis = distance(worldPosition.xyz,cameraPosition.xyz);
      // dis = pow(dis,0.8);
      dis = 1. - dis;
      float edge = smoothstep(radius,radius+0.01,dis);
      // edge = pow(edge,2.);

      depth = clamp(0.,1.,depth);
      // depth = depth * 0.5;

      vec4 diffuseColor = texture2D(tDiffuse,vUv);
      diffuseColor = mix(diffuseColor,diffuseColor,outLine*edge);
      vec4 effectColor = texture2D(effectMap,vUv*5.)*vec4(1.,0.0,0.,1.);
      vec4 finallyColor = mix(diffuseColor,vec4(vec3(outLine),1.),0.01);

      gl_FragColor = edge == 0. ? diffuseColor:vec4(vec3(outLine),1.)+effectColor;
      // if(worldPosition.y > 1.){
      //   gl_FragColor = vec4(1.);
      // }
    }
  `,
};


const customPass = new ShaderPass(customShader);
composer.addPass(customPass);
gui.add(setting, "sphereRadius", 15, 1200, 0.1).onChange((val) => {
  customPass.material.uniforms.radius.value = (val-100)/val;
});
// console.log(customPass);
let RenderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight,
  {
    depthTexture: new THREE.DepthTexture(),
  }
);
RenderTarget.texture.minFilter = THREE.NearestFilter;
RenderTarget.texture.magFilter = THREE.NearestFilter;
RenderTarget.stencilBuffer = false;
RenderTarget.depthTexture.format = THREE.DepthFormat;
RenderTarget.depthTexture.type = THREE.FloatType;
RenderTarget.setSize( window.innerWidth, window.innerHeight );

let plane = new THREE.PlaneGeometry(
  5,
  5 / (window.innerWidth / window.innerHeight),
  1024,
  1024
);
let planeM = new THREE.ShaderMaterial({
  uniforms: {
    tDepthT: { value: null },
    cameraNear: { value: cameraDepth.near },
    cameraFar: { value: cameraDepth.far },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    #include <packing>

    uniform sampler2D tDepthT;
    uniform float cameraNear;
		uniform float cameraFar;
    varying vec2 vUv;
    float readDepth( sampler2D depthSampler, vec2 coord ) {
      float fragCoordZ = texture2D( depthSampler, coord ).x;
      float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
      return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
    }
    void main() {
      float depth = readDepth( tDepthT, vUv );
      gl_FragColor.rgb = 1.0 - vec3( depth );
      gl_FragColor.a = 1.0;
      // gl_FragColor = color;
    }
  `,
});
let planeMesh = new THREE.Mesh(plane, planeM);
planeMesh.position.y = 0.5;
let postScene = new THREE.Scene();
// scene.add(planeMesh);

// 渲染循环
function animate() {
  requestAnimationFrame(animate);
  stats.update();
  custonUniform.time.value += 1;
  renderer.setRenderTarget(RenderTarget);
  renderer.setClearColor(0x000000)
  renderer.render(scene,camera);

  customPass.material.uniforms.tDepthT.value = RenderTarget.depthTexture;
  customPass.material.uniforms.tDiffuse.value = RenderTarget.texture;
  // planeM.uniforms.tDepthT.value = RenderTarget.depthTexture;
  renderer.setRenderTarget(null);
  composer.render();
  // renderer.render(scene, camera);
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
