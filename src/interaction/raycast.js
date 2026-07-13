import * as THREE from 'three';

const highlightColor = new THREE.Color(1, 0.9, 0.32);

export function setupHover({ camera, renderer, mesh, metadata, tooltip }) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hoveredMesh = null;
  let hoveredOriginalColor = null;

  const onMouseMove = (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(mesh, true)[0];

    const instanceIndex = hit?.object?.userData?.instanceIndex;

    if (!Number.isInteger(instanceIndex) || !metadata[instanceIndex]) {
      clearHover();
      tooltip.hide();
      return;
    }

    if (hit.object !== hoveredMesh) {
      clearHover();
      hoveredMesh = hit.object;
      hoveredOriginalColor = hoveredMesh.material.color.clone();
      hoveredMesh.material.color.copy(highlightColor);
    }

    tooltip.show(event.clientX, event.clientY, metadata[instanceIndex]);
  };

  const clearHover = () => {
    if (!hoveredMesh || !hoveredOriginalColor) return;

    hoveredMesh.material.color.copy(hoveredOriginalColor);
    hoveredMesh = null;
    hoveredOriginalColor = null;
  };

  const onMouseLeave = () => {
    clearHover();
    tooltip.hide();
  };

  renderer.domElement.addEventListener('mousemove', onMouseMove);
  renderer.domElement.addEventListener('mouseleave', onMouseLeave);

  return {
    dispose() {
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
      clearHover();
    },
  };
}
