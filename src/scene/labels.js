import * as THREE from 'three';

export function createAxisLabels({ filiais, bucketLabels, spacing }) {
  const group = new THREE.Group();

  filiais.forEach((filial, index) => {
    const label = createTextSprite(`Filial ${filial}`);
    label.position.set(index * spacing, 0.15, -spacing * 0.85);
    group.add(label);
  });

  bucketLabels.forEach((labelText, index) => {
    const label = createTextSprite(labelText);
    label.position.set(-spacing * 1.2, 0.15, index * spacing);
    group.add(label);
  });

  return group;
}

function createTextSprite(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;

  context.fillStyle = 'rgba(10, 14, 18, 0.72)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#f4f7fb';
  context.font = '28px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.9, 0.48, 1);
  return sprite;
}
