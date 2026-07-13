import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

export function setupScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101418);

  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
  directionalLight.position.set(8, 16, 10);
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 2, 0xffdd55);
  scene.add(lightHelper);

  const gui = new GUI({ title: 'Luz' });
  gui.add(ambientLight, 'intensity', 0, 3, 0.1).name('Ambiente');
  gui.add(directionalLight, 'intensity', 0, 12, 0.1).name('Direcional');
  gui.add(directionalLight.position, 'x', -30, 30, 0.1).name('Luz X').onChange(() => lightHelper.update());
  gui.add(directionalLight.position, 'y', 0, 40, 0.1).name('Luz Y').onChange(() => lightHelper.update());
  gui.add(directionalLight.position, 'z', -30, 30, 0.1).name('Luz Z').onChange(() => lightHelper.update());

  const resize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  };

  window.addEventListener('resize', resize);

  return {
    scene,
    camera,
    renderer,
    controls,
    dispose() {
      window.removeEventListener('resize', resize);
      gui.destroy();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
