import * as THREE from 'three';
import { sampleRows } from './src/data/sample.js';
import { buildGraphData } from './src/data/pipeline.js';
import { setupScene } from './src/scene/setup.js';
import { createBarGrid } from './src/scene/grid.js';
import { createAxisLabels } from './src/scene/labels.js';
import { setupHover } from './src/interaction/raycast.js';
import { createTooltip } from './src/ui/tooltip.js';
import { PUBLIC_APP_URL } from './src/config/env.js';

const container = document.getElementById('app');
const { scene, camera, renderer, controls, dispose: disposeScene } = setupScene(container);
const tooltip = createTooltip();
let activeGraph = null;
let removePytrolDataListener = null;

console.info(`Pimp Three listening as ${PUBLIC_APP_URL}`);
renderGraph(sampleRows);
removePytrolDataListener = setupPytrolDataListener();

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

function renderGraph(rows) {
  clearGraph();

  const graphData = buildGraphData(rows, { spacing: 2.4, targetBuckets: 12 });
  const { mesh, metadata, dispose: disposeGrid } = createBarGrid(graphData);
  const axisLabels = createAxisLabels(graphData);
  const graphBounds = getGraphBounds(graphData);
  const graphGroup = new THREE.Group();
  const floorGrid = createFloorGrid(graphBounds, graphData.spacing);
  const hover = setupHover({ camera, renderer, mesh, metadata, tooltip });

  graphGroup.add(mesh);
  graphGroup.add(axisLabels);
  graphGroup.add(floorGrid);
  graphGroup.position.set(-graphBounds.width / 2, 0, -graphBounds.depth / 2);

  scene.add(graphGroup);
  fitCameraToData(graphBounds);

  activeGraph = {
    graphGroup,
    hover,
    disposeGrid,
    disposeLabels: () => disposeObject(axisLabels),
    disposeFloor: () => disposeObject(floorGrid),
  };
}

function setupPytrolDataListener() {
  const onMessage = (event) => {
    if (event.data?.type !== 'PYTROL_THREE_DATA') return;

    const rows = event.data.payload?.rows;
    if (!Array.isArray(rows)) return;

    renderGraph(rows.length ? rows : sampleRows);
  };

  window.addEventListener('message', onMessage);
  window.opener?.postMessage({ type: 'THREE_READY' }, '*');

  return () => window.removeEventListener('message', onMessage);
}

function clearGraph() {
  if (!activeGraph) return;

  activeGraph.hover.dispose();
  activeGraph.disposeGrid();
  activeGraph.disposeLabels();
  activeGraph.disposeFloor();
  scene.remove(activeGraph.graphGroup);
  activeGraph = null;
  tooltip.hide();
}

function getGraphBounds({ filiais, bucketLabels, spacing }) {
  return {
    width: Math.max(filiais.length - 1, 1) * spacing,
    depth: Math.max(bucketLabels.length - 1, 1) * spacing,
  };
}

function createFloorGrid({ width, depth }, spacing) {
  const gridSize = Math.max(width, depth, 12) + spacing * 2;
  const divisions = Math.max(12, Math.round(gridSize / spacing) * 2);
  const grid = new THREE.GridHelper(gridSize, divisions, 0x425165, 0x26313f);

  grid.position.set(width / 2, 0, depth / 2);
  return grid;
}

function fitCameraToData({ width, depth }) {
  const maxSize = Math.max(width, depth, 12);

  controls.target.set(0, 1.6, 0);
  camera.position.set(maxSize * 0.9, maxSize * 0.85, maxSize * 1.1);
  camera.near = 0.1;
  camera.far = Math.max(1000, maxSize * 30);
  camera.updateProjectionMatrix();
  controls.update();
}

function disposeObject(object) {
  object.traverse((child) => {
    child.geometry?.dispose?.();

    if (Array.isArray(child.material)) {
      child.material.forEach(material => disposeMaterial(material));
    } else {
      disposeMaterial(child.material);
    }
  });
}

function disposeMaterial(material) {
  if (!material) return;
  material.map?.dispose?.();
  material.dispose?.();
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    renderer.setAnimationLoop(null);
    removePytrolDataListener?.();
    clearGraph();
    tooltip.dispose();
    disposeScene();
  });
}
