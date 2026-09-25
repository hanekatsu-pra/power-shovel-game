import * as THREE from 'three';

/**
 * Creates a discrete step gradient texture for MeshToonMaterial,
 * producing authentic hand-drawn / colored pencil / crayon shading.
 */
export function createToonGradientMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;

  // 4 steps of brightness for crayon/cel shading
  ctx.fillStyle = '#6b7280'; // deep shadow
  ctx.fillRect(0, 0, 1, 1);
  ctx.fillStyle = '#9ca3af'; // mid shadow
  ctx.fillRect(1, 0, 1, 1);
  ctx.fillStyle = '#d1d5db'; // soft lit
  ctx.fillRect(2, 0, 1, 1);
  ctx.fillStyle = '#ffffff'; // highlight
  ctx.fillRect(3, 0, 1, 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/**
 * Creates a subtle hand-drawn ink outline mesh using inverted-hull technique
 */
export function createCrayonOutline(
  mesh: THREE.Mesh,
  thickness: number = 0.025,
  color: number = 0x1e293b
): THREE.Mesh {
  const outlineMat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
    depthWrite: true,
  });

  const outlineMesh = new THREE.Mesh(mesh.geometry, outlineMat);
  outlineMesh.name = 'CrayonOutline';

  // Apply subtle scale expansion along normals or geometry bounds
  const scale = 1.0 + thickness;
  outlineMesh.scale.set(scale, scale, scale);
  outlineMesh.position.copy(mesh.position);
  outlineMesh.rotation.copy(mesh.rotation);

  return outlineMesh;
}

/**
 * Traverses an Object3D hierarchy and adds ink outlines to suitable meshes
 */
export function addCrayonOutlinesToHierarchy(
  root: THREE.Object3D,
  outlineGroup: THREE.Group,
  thickness: number = 0.03
) {
  root.traverse((child) => {
    if (
      child instanceof THREE.Mesh &&
      !child.name.includes('Outline') &&
      !child.name.includes('Glass') &&
      !child.name.includes('Ring') &&
      !child.name.includes('Floor') &&
      !child.name.includes('Carpet')
    ) {
      // Create duplicate with BackSide outline
      const outlineMat = new THREE.MeshBasicMaterial({
        color: 0x1e293b,
        side: THREE.BackSide,
      });
      const outline = new THREE.Mesh(child.geometry, outlineMat);
      outline.name = `${child.name}_Outline`;

      const scale = 1.0 + thickness;
      outline.scale.set(scale, scale, scale);
      child.add(outline);
    }
  });
}
