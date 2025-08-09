import * as THREE from 'three';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk';
import { BlockType, BLOCK_PROPERTIES } from '../blocks/BlockTypes';
import type { ChunkManager } from './ChunkManager';

interface FaceData {
  positions: number[];
  normals: number[];
  uvs: number[];
  indices: number[];
  colors: number[];
}

export class MeshBuilder {
  private readonly FACES = [
    // Front face
    { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], normal: [0, 0, 1] },
    // Back face  
    { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], normal: [0, 0, -1] },
    // Right face
    { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], normal: [1, 0, 0] },
    // Left face
    { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], normal: [-1, 0, 0] },
    // Top face
    { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], normal: [0, 1, 0] },
    // Bottom face
    { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], normal: [0, -1, 0] }
  ];

  public buildChunkMesh(chunk: Chunk, chunkManager: ChunkManager): THREE.BufferGeometry {
    // More aggressive optimization - skip blocks that are likely not visible
    const faceData: FaceData = {
      positions: [],
      normals: [],
      uvs: [],
      indices: [],
      colors: []
    };

    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        // Only process visible height range to reduce triangles
        const maxY = Math.min(CHUNK_HEIGHT, chunk.getHeightAt(x, z) + 10);
        for (let y = Math.max(0, maxY - 60); y < maxY; y++) {
          const blockType = chunk.getBlock(x, y, z);
          if (blockType === BlockType.AIR) continue;

          this.addBlockFaces(chunk, chunkManager, x, y, z, blockType, faceData);
        }
      }
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    
    if (faceData.positions.length > 0) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(faceData.positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(faceData.normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(faceData.uvs, 2));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(faceData.colors, 3));
      geometry.setIndex(faceData.indices);
    }

    return geometry;
  }

  private addBlockFaces(
    chunk: Chunk, 
    chunkManager: ChunkManager,
    x: number, 
    y: number, 
    z: number, 
    blockType: BlockType,
    faceData: FaceData
  ) {
    const blockProps = BLOCK_PROPERTIES[blockType];
    if (!blockProps.visible) return;

    const worldX = chunk.x * CHUNK_SIZE + x;
    const worldZ = chunk.z * CHUNK_SIZE + z;

    for (let faceIndex = 0; faceIndex < 6; faceIndex++) {
      const face = this.FACES[faceIndex];
      const [dx, dy, dz] = face.dir;
      
      const neighborX = x + dx;
      const neighborY = y + dy;
      const neighborZ = z + dz;
      
      // Get neighbor block (handle chunk boundaries)
      let neighborBlock: BlockType;
      
      if (neighborX < 0 || neighborX >= CHUNK_SIZE || neighborZ < 0 || neighborZ >= CHUNK_SIZE) {
        // Check neighboring chunk
        neighborBlock = chunkManager.getBlock(worldX + dx, neighborY, worldZ + dz);
      } else {
        neighborBlock = chunk.getBlock(neighborX, neighborY, neighborZ);
      }
      
      // Skip face if neighbor is solid and opaque
      const shouldSkipFace = this.shouldCullFace(blockType, neighborBlock);
      if (shouldSkipFace) {
        continue;
      }

      this.addFace(x, y, z, faceIndex, blockType, chunk, faceData);
    }
  }

  private shouldCullFace(currentBlock: BlockType, neighborBlock: BlockType): boolean {
    // Always show faces against air
    if (neighborBlock === BlockType.AIR) {
      return false;
    }

    // Don't cull faces against transparent blocks
    if (neighborBlock === BlockType.WATER || neighborBlock === BlockType.LEAVES) {
      return false;
    }

    const currentProps = BLOCK_PROPERTIES[currentBlock];
    const neighborProps = BLOCK_PROPERTIES[neighborBlock];

    // Only cull if both blocks are solid and opaque
    return currentProps.solid && neighborProps.solid && 
           !currentProps.transparent && !neighborProps.transparent;
  }

  private addFace(
    x: number, 
    y: number, 
    z: number, 
    faceIndex: number, 
    blockType: BlockType,
    chunk: Chunk,
    faceData: FaceData
  ) {
    const face = this.FACES[faceIndex];
    const startIndex = faceData.positions.length / 3;
    
    // Get texture coordinates for this block type and face
    const texCoords = this.getTextureCoords(blockType, faceIndex);
    
    // Ensure proper vertex order for correct normals
    const vertices = face.corners;
    
    // Add vertices
    for (let i = 0; i < vertices.length; i++) {
      const corner = vertices[i];
      const [cx, cy, cz] = corner;
      
      // Position
      faceData.positions.push(x + cx, y + cy, z + cz);
      
      // Normal
      faceData.normals.push(...face.normal);
      
      // Color with lighting
      const lightLevel = chunk.getLightLevel(x, y, z) / 15;
      let brightness = Math.max(0.7, lightLevel * 0.3 + 0.7);
      
      // Adjust brightness based on face direction for better contrast
      if (faceIndex === 4) brightness *= 1.0; // Top face - full brightness
      else if (faceIndex === 5) brightness *= 0.8; // Bottom face - darker
      else if (faceIndex === 0 || faceIndex === 1) brightness *= 0.9; // Front/back
      else brightness *= 0.85; // Left/right sides
      
      faceData.colors.push(brightness, brightness, brightness);
    }
    
    // Add UV coordinates
    faceData.uvs.push(
      texCoords.minU, texCoords.maxV, // bottom-left
      texCoords.maxU, texCoords.maxV, // bottom-right  
      texCoords.maxU, texCoords.minV, // top-right
      texCoords.minU, texCoords.minV  // top-left
    );
    
    // Add indices (two triangles per face)
    faceData.indices.push(
      startIndex, startIndex + 1, startIndex + 2,
      startIndex, startIndex + 2, startIndex + 3
    );
  }

  private getTextureCoords(blockType: BlockType, faceIndex: number) {
    // Simple texture atlas mapping (4x4 grid)
    const texSize = 1 / 4;
    let texIndex = 0;
    
    switch (blockType) {
      case BlockType.GRASS:
        texIndex = faceIndex === 4 ? 0 : (faceIndex === 5 ? 1 : 0); // top/side/bottom
        break;
      case BlockType.DIRT:
        texIndex = 1;
        break;
      case BlockType.STONE:
        texIndex = 2;
        break;
      case BlockType.WOOD:
        texIndex = 3;
        break;
      case BlockType.LEAVES:
        texIndex = 4;
        break;
      case BlockType.WATER:
        texIndex = 5;
        break;
      case BlockType.SAND:
        texIndex = 6;
        break;
      case BlockType.COBBLESTONE:
        texIndex = 7;
        break;
      default:
        texIndex = 2; // Default to stone
    }
    
    const u = (texIndex % 4) * texSize;
    const v = Math.floor(texIndex / 4) * texSize;
    
    return {
      minU: u,
      maxU: u + texSize,
      minV: v,
      maxV: v + texSize
    };
  }

  private calculateAO(chunk: Chunk, x: number, y: number, z: number, faceIndex: number, corner: number[]): number {
    // Simple ambient occlusion calculation
    const face = this.FACES[faceIndex];
    const [fx, fy, fz] = face.normal;
    const [cx, cy, cz] = corner;
    
    // Get the three blocks that could contribute to AO for this corner
    const dx1 = cx === 0 ? -1 : 1;
    const dy1 = cy === 0 ? -1 : 1; 
    const dz1 = cz === 0 ? -1 : 1;
    
    let occluders = 0;
    
    // Check adjacent blocks
    if (chunk.getBlock(x + dx1, y, z) !== BlockType.AIR) occluders++;
    if (chunk.getBlock(x, y + dy1, z) !== BlockType.AIR) occluders++;
    if (chunk.getBlock(x, y, z + dz1) !== BlockType.AIR) occluders++;
    
    return Math.max(0.3, 1.0 - (occluders * 0.2));
  }
}