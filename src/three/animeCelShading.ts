import * as THREE from 'three';

/**
 * Creates a crisp 3-step cel-shading gradient map for MeshToonMaterial,
 * producing authentic anime / mecha cel-shaded lighting.
 */
export function createAnimeCelGradient(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  // 3 crisp steps of anime cel-shading
  ctx.fillStyle = '#64748b'; // Dark shadow
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = '#94a3b8'; // Mid tone
  ctx.fillRect(1, 0, 1, 1);
  ctx.fillStyle = '#f1f5f9'; // Lit tone
  ctx.fillRect(2, 0, 1, 1);
  ctx.fillStyle = '#ffffff'; // Bright specular
  ctx.fillRect(3, 0, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/**
 * Creates a discrete 2-step gradient for high-contrast anime style
 */
export function createHighContrastCelGradient(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#71717a'; // Crisp anime shade
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = '#ffffff'; // Saturated lit surface
  ctx.fillRect(1, 0, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/**
 * Adds inverted-hull anime outline to an individual mesh
 */
export function createAnimeOutline(
  mesh: THREE.Mesh,
  thickness: number = 0.02,
  color: number = 0x0f172a
): THREE.Mesh {
  const outlineMat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
    depthWrite: true,
  });

  const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
  outlineMesh.name = 'AnimeOutline';
  const scale = 1.0 + thickness;
  outlineMesh.scale.set(scale, scale, scale);
  outlineMesh.position.copy(mesh.position);
  outlineMesh.rotation.copy(mesh.rotation);

  return outlineMesh;
}
