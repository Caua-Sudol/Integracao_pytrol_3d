import * as THREE from 'three';

export function createBarGrid({ instances }) {
  const geometry = new THREE.BoxGeometry(0.9, 1, 0.9);
  const mesh = new THREE.Group();
  const materials = [];

  instances.forEach((instance, index) => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(
        safeColor(instance.color.r),
        safeColor(instance.color.g),
        safeColor(instance.color.b),
      ),
      roughness: 0.48,
      metalness: 0.04,
    });
    const bar = new THREE.Mesh(geometry, material);

    bar.position.set(instance.x, instance.height / 2, instance.z);
    bar.scale.set(1, instance.height, 1);
    bar.userData.instanceIndex = index;

    materials.push(material);
    mesh.add(bar);
  });

  return {
    mesh,
    metadata: instances.map(instance => instance.meta),
    dispose() {
      geometry.dispose();
      materials.forEach(material => material.dispose());
    },
  };
}

function safeColor(value) {
  const normalized = Number(value);
  if (!Number.isFinite(normalized)) return 0;
  return Math.min(1, Math.max(0, normalized));
}
