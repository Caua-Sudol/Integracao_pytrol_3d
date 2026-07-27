import * as THREE from 'three';
import { sampleRows } from './src/data/sample.js';
import {
  operationalTelemetrySample,
  uxTelemetrySample,
} from './src/data/telemetry-sample.js';
import { buildGraphData } from './src/data/pipeline.js';
import { setupScene } from './src/scene/setup.js';
import { createBarGrid } from './src/scene/grid.js';
import { createAxisLabels } from './src/scene/labels.js';
import { setupHover } from './src/interaction/raycast.js';
import { renderDashboard } from './src/ui/dashboard.js';
import { createTooltip } from './src/ui/tooltip.js';
import { PUBLIC_APP_URL } from './src/config/env.js';

const container = document.getElementById('scene-container');
const sceneView = document.getElementById('scene-view');
const dashboardView = document.getElementById('dashboard-view');
const dashboardRoot = document.getElementById('dashboard-root');
const modeButtons = [...document.querySelectorAll('[data-report-mode]')];
const { scene, camera, renderer, controls, dispose: disposeScene } = setupScene(container);
const tooltip = createTooltip();
const telemetryPayloads = {
  operational: operationalTelemetrySample,
  ux: uxTelemetrySample,
};
let activeGraph = null;
let activeMode = 'cte';
let removePytrolDataListener = null;

console.info(`Pimp Three listening as ${PUBLIC_APP_URL}`);
renderGraph(sampleRows);
removePytrolDataListener = setupPytrolDataListener();
setupModeNavigation();

renderer.setAnimationLoop(() => {
  if (activeMode !== 'cte') return;
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

    const payload = event.data.payload || {};
    if (payload.reportType === 'telemetry-operational') {
      telemetryPayloads.operational = payload.data || payload;
      showMode('operational');
      return;
    }

    if (payload.reportType === 'telemetry-ux') {
      telemetryPayloads.ux = payload.data || payload;
      showMode('ux');
      return;
    }

    const rows = payload.rows;
    if (!Array.isArray(rows)) return;

    renderGraph(rows.length ? rows : sampleRows);
    showMode('cte');
  };

  window.addEventListener('message', onMessage);
  window.opener?.postMessage({ type: 'THREE_READY' }, '*');

  return () => window.removeEventListener('message', onMessage);
}

function setupModeNavigation() {
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      showMode(button.dataset.reportMode || 'cte');
    });
  });
}

function showMode(mode) {
  activeMode = ['cte', 'operational', 'ux'].includes(mode) ? mode : 'cte';
  const showScene = activeMode === 'cte';

  sceneView.hidden = !showScene;
  dashboardView.hidden = showScene;
  controls.enabled = showScene;
  document.body.classList.toggle('dashboard-active', !showScene);

  modeButtons.forEach((button) => {
    button.setAttribute(
      'aria-selected',
      String(button.dataset.reportMode === activeMode),
    );
  });

  if (showScene) {
    requestAnimationFrame(() => {
      renderer.setSize(container.clientWidth, container.clientHeight, false);
      camera.aspect = container.clientWidth / Math.max(container.clientHeight, 1);
      camera.updateProjectionMatrix();
    });
    return;
  }

  tooltip.hide();
  renderDashboard(dashboardRoot, telemetryPayloads[activeMode]);
  window.scrollTo({ top: 0, behavior: 'auto' });
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
