import * as THREE from 'three';

/**
 * Hand-Drawn Illustration Style (手描きイラスト・絵本・コピック風)
 * Creates warm, organic artistic shading inspired by Japanese technical illustration,
 * picture-book art, and anime mechanical line-art.
 */

// Shared procedural gradient for hand-drawn marker / watercolor wash shading
let cachedIllustrationGradient: THREE.CanvasTexture | null = null;
let cachedPaperTexture: THREE.CanvasTexture | null = null;

export function getHandDrawnIllustrationGradient(): THREE.CanvasTexture {
  if (cachedIllustrationGradient) return cachedIllustrationGradient;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  // Smooth warm watercolor / Copic marker wash transition
  const grad = ctx.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0.0, '#475569'); // Dark ink shadow
  grad.addColorStop(0.35, '#64748b'); // Soft midtone transition
  grad.addColorStop(0.55, '#94a3b8'); // Paper wash tone
  grad.addColorStop(0.85, '#f1f5f9'); // Luminous lit surface
  grad.addColorStop(1.0, '#ffffff'); // Crisp highlight

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 1);

  cachedIllustrationGradient = new THREE.CanvasTexture(canvas);
  cachedIllustrationGradient.minFilter = THREE.LinearFilter;
  cachedIllustrationGradient.magFilter = THREE.LinearFilter;
  cachedIllustrationGradient.generateMipmaps = false;
  return cachedIllustrationGradient;
}

/**
 * Creates high-quality fine watercolor / sketch paper grain texture
 */
export function getWatercolorPaperTexture(): THREE.CanvasTexture {
  if (cachedPaperTexture) return cachedPaperTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Warm off-white drawing paper base
  ctx.fillStyle = '#fbfbf9';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle warm artistic fibers
  const imgData = ctx.getImageData(0, 0, 256, 256);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const fiber = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + fiber));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + fiber));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + fiber * 0.7));
  }
  ctx.putImageData(imgData, 0, 0);

  cachedPaperTexture = new THREE.CanvasTexture(canvas);
  cachedPaperTexture.wrapS = THREE.RepeatWrapping;
  cachedPaperTexture.wrapT = THREE.RepeatWrapping;
  cachedPaperTexture.repeat.set(12, 12);
  return cachedPaperTexture;
}

/**
 * Creates an illustrated hand-drawn material with pen-and-wash aesthetic
 */
export function createHandDrawnMaterial(params: {
  color: number | string | THREE.Color;
  emissive?: number | string | THREE.Color;
  roughness?: number;
  transparent?: boolean;
  opacity?: number;
}): THREE.MeshToonMaterial {
  const gradient = getHandDrawnIllustrationGradient();
  return new THREE.MeshToonMaterial({
    color: params.color,
    emissive: params.emissive ?? 0x000000,
    gradientMap: gradient,
    transparent: params.transparent ?? false,
    opacity: params.opacity ?? 1.0,
  });
}
