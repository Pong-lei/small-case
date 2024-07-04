<template>
  <div id="container"></div>
</template>
  
<script setup>
import * as THREE from "three";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { onMounted } from "vue";

import bar from './model/bar.glb'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);


camera.position.set( 0, 2, 3 );

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls( camera, renderer.domElement );
controls.update();

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

const light = new THREE.PointLight( 0xff0000, 10, 100 );
light.position.set( 5, 5, 5 );
scene.add( light );
const axesHelper = new THREE.AxesHelper( 5 );

const loader = new GLTFLoader();

// Optional: Provide a DRACOLoader instance to decode compressed mesh data
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('draco/gltf/');
loader.setDRACOLoader( dracoLoader );
loader.load(
	bar,
	(gltf)=>{
    console.log();
    let mesh = gltf.scene.children[0]
    mesh.material = new THREE.MeshBasicMaterial({color:'red'})
		scene.add( mesh );
    
	}
);

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
onMounted(() => {
  const container = document.querySelector('#container')
  container.appendChild(renderer.domElement)
  animate();
});
</script>
  
<style lang="scss" scoped>
#container{
  position: absolute;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
}
</style>