import * as THREE from 'three';
import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk';
import { WorldGenerator } from './WorldGenerator';
import { MeshBuilder } from './MeshBuilder';
import { BlockType } from '../blocks/BlockTypes';
import { LightingSystem } from '../systems/LightingSystem';

export class ChunkManager {
  private scene: THREE.Scene;
  private lightingSystem: LightingSystem;
  private worldGenerator: WorldGenerator;
  private meshBuilder: MeshBuilder;
  
  private chunks = new Map<string, Chunk>();
  private loadedChunks = new Set<string>();
  private meshes = new Map<string, THREE.Mesh>();
  
  private readonly RENDER_DISTANCE = 8;
  private readonly LOAD_DISTANCE = 4;
  
  // Render distances - much more conservative
  private renderDistance = 2; // Very conservative render distance
  private readonly MAX_RENDER_DISTANCE = 4;
  private readonly MIN_RENDER_DISTANCE = 2;
  
  private material: THREE.MeshLambertMaterial;

  constructor(scene: THREE.Scene, lightingSystem: LightingSystem) {
    this.scene = scene;
    this.lightingSystem = lightingSystem;
    this.worldGenerator = new WorldGenerator();
    this.meshBuilder = new MeshBuilder();
    
    this.initMaterial();
  }

  private initMaterial() {
    // Create texture atlas
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    // Generate simple block textures
    const textures = [
      { name: 'grass', baseColor: '#4a7c59', darkColor: '#2d5233', lightColor: '#6b9b7a', accentColor: '#8bc34a' },
      { name: 'dirt', baseColor: '#8b7355', darkColor: '#654832', lightColor: '#a68b6b', accentColor: '#7a6243' },
      { name: 'stone', baseColor: '#a0a0a0', darkColor: '#606060', lightColor: '#c0c0c0', accentColor: '#808080' },
      { name: 'wood', baseColor: '#8b4513', darkColor: '#5d2f0c', lightColor: '#cd853f', accentColor: '#a0522d' },
      { name: 'leaves', baseColor: '#228b22', darkColor: '#1a6b1a', lightColor: '#32cd32', accentColor: '#90ee90' },
      { name: 'water', baseColor: '#4169e1', darkColor: '#1e3a8a', lightColor: '#87ceeb', accentColor: '#00bfff' },
      { name: 'sand', baseColor: '#f4a460', darkColor: '#d4824a', lightColor: '#ffd700', accentColor: '#daa520' },
      { name: 'cobblestone', baseColor: '#696969', darkColor: '#404040', lightColor: '#909090', accentColor: '#555555' }
    ];
    
    const textureSize = 256; // Increased resolution
    
    textures.forEach((tex, i) => {
      const x = (i % 4) * textureSize;
      const y = Math.floor(i / 4) * textureSize;
      
      this.generateBlockTexture(ctx, tex, x, y, textureSize);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.flipY = false;
    
    this.material = new THREE.MeshLambertMaterial({ 
      map: texture,
      side: THREE.DoubleSide,
      vertexColors: true
    });
  }

  private generateBlockTexture(
    ctx: CanvasRenderingContext2D,
    tex: { name: string; baseColor: string; darkColor: string; lightColor: string; accentColor: string },
    x: number,
    y: number,
    size: number
  ) {
    // Base color fill
    ctx.fillStyle = tex.baseColor;
    ctx.fillRect(x, y, size, size);
    
    // Generate texture based on block type
    switch (tex.name) {
      case 'grass':
        this.generateGrassTexture(ctx, tex, x, y, size);
        break;
      case 'dirt':
        this.generateDirtTexture(ctx, tex, x, y, size);
        break;
      case 'stone':
        this.generateStoneTexture(ctx, tex, x, y, size);
        break;
      case 'wood':
        this.generateWoodTexture(ctx, tex, x, y, size);
        break;
      case 'leaves':
        this.generateLeavesTexture(ctx, tex, x, y, size);
        break;
      case 'water':
        this.generateWaterTexture(ctx, tex, x, y, size);
        break;
      case 'sand':
        this.generateSandTexture(ctx, tex, x, y, size);
        break;
      case 'cobblestone':
        this.generateCobblestoneTexture(ctx, tex, x, y, size);
        break;
    }
    
    // Add border for clarity
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }

  private generateGrassTexture(ctx: CanvasRenderingContext2D, tex: any, x: number, y: number, size: number) {
    // Add grass blade details
    for (let i = 0; i < 150; i++) {
      const px = x + Math.random() * size;
      const py = y + Math.random() * size;
      
      const rand = Math.random();
      if (rand > 0.6) {
        ctx.fillStyle = tex.lightColor;
        ctx.fillRect(px, py, 2, 3);
      } else if (rand > 0.4) {
        ctx.fillStyle = tex.accentColor;
        ctx.fillRect(px, py, 1, 2);
      } else if (rand < 0.2) {
        ctx.fillStyle = tex.darkColor;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  private generateDirtTexture(ctx: CanvasRenderingContext2D, tex: any, x: number, y: number, size: number) {
    // Add dirt particles and variation
    for (let i = 0; i < 200; i++) {
      const px = x + Math.random() * size;
      const py = y + Math.random() * size;
      const rand = Math.random();
      
      if (rand > 0.7) {
        ctx.fillStyle = tex.darkColor;
        ctx.fillRect(px, py, 3, 3);
      } else if (rand > 0.5) {
        ctx.fillStyle = tex.lightColor;
        ctx.fillRect(px, py, 2, 2);
      } else if (rand < 0.3) {
        ctx.fillStyle = tex.accentColor;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  private generateStoneTexture(ctx: CanvasRenderingContext2D, tex: any, x: number, y: number, size: number) {
    // Add stone cracks and variations
    for (let i = 0; i < 100; i++) {
      const px = x + Math.random() * size;
      const py = y + Math.random() * size;
      const rand = Math.random();
      
      if (rand > 0.8) {
        ctx.fillStyle = tex.darkColor;
        ctx.fillRect(px, py, 4, 1); // Horizontal crack
      } else if (rand > 0.6) {
        ctx.fillStyle = tex.lightColor;
        ctx.fillRect(px, py, 2, 2);
      } else if (rand < 0.2) {
        ctx.fillStyle = tex.darkColor;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  private generateWoodTexture(ctx: CanvasRenderingContext2D, tex: any, x: number, y: number, size: number) {
    // Add wood rings and grain
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    
    // Wood rings
    for (let ring = 1; ring <= 5; ring++) {
      const radius = (ring * size) / 10;
      ctx.strokeStyle = ring % 2 === 0 ? tex.darkColor : tex.accentColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // Wood grain details
    for (let i = 0; i < 80; i++) {
      const px = x + Math.random() * size;
      const py = y + Math.random() * size;
      
      if (Math.random() > 0.7) {
        ctx.fillStyle = tex.darkColor;
        ctx.fillRect(px, py, 1, 4); // Vertical grain
      }
    }
  }

  private generateLeavesTexture(ctx: CanvasRenderingContext2D, tex: any, x: number, y: number, size: number) {
    // Add leaf patterns
    for (let i = 0; i < 120; i++) {
      const px = x + Math.random() * size;
      const py = y + Math.random() * size;
      const rand = Math.random();
      
      if (rand > 0.6) {
        ctx.fillStyle = tex.lightColor;
        ctx.fillRect(px, py, 3, 2);
      } else if (rand > 0.4) {
        ctx.fillStyle = tex.accentColor;
        ctx.fillRect(px, py, 2, 1);
      } else if (rand < 0.3) {
        ctx.fillStyle = tex.darkColor;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  private generateWaterTexture(ctx: CanvasRenderingContext2D, tex: any, x: number, y: number, size: number) {
    // Add water ripples and reflections
    for (let i = 0; i < 60; i++) {
      const px = x + Math.random() * size;
      const py = y + Math.random() * size;
      const rand = Math.random();
      
      if (rand > 0.7) {
        ctx.fillStyle = tex.lightColor;
        ctx.fillRect(px, py, 4, 1); // Horizontal ripple
      } else if (rand > 0.5) {
        ctx.fillStyle = tex.accentColor;
        ctx.fillRect(px, py, 2, 2);
      } else if (rand < 0.2) {
        ctx.fillStyle = tex.darkColor;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  private generateSandTexture(ctx: CanvasRenderingContext2D, tex: any, x: number, y: number, size: number) {
    // Add sand grains
    for (let i = 0; i < 300; i++) {
      const px = x + Math.random() * size;
      const py = y + Math.random() * size;
      const rand = Math.random();
      
      if (rand > 0.8) {
        ctx.fillStyle = tex.lightColor;
        ctx.fillRect(px, py, 1, 1);
      } else if (rand > 0.6) {
        ctx.fillStyle = tex.accentColor;
        ctx.fillRect(px, py, 1, 1);
      } else if (rand < 0.2) {
        ctx.fillStyle = tex.darkColor;
        ctx.fillRect(px, py, 1, 1);
      }
    }
  }

  private generateCobblestoneTexture(ctx: CanvasRenderingContext2D, tex: any, x: number, y: number, size: number) {
    // Add cobblestone pattern
    const stoneSize = 32;
    for (let sx = 0; sx < size; sx += stoneSize) {
      for (let sy = 0; sy < size; sy += stoneSize) {
        const offsetX = (sy / stoneSize) % 2 === 0 ? 0 : stoneSize / 2;
        const px = x + sx + offsetX + (Math.random() - 0.5) * 8;
        const py = y + sy + (Math.random() - 0.5) * 8;
        
        // Stone shape
        ctx.fillStyle = Math.random() > 0.5 ? tex.lightColor : tex.darkColor;
        ctx.fillRect(px, py, stoneSize - 4, stoneSize - 4);
        
        // Stone outline
        ctx.strokeStyle = tex.accentColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, stoneSize - 4, stoneSize - 4);
      }
    }
  }

  private getChunkKey(x: number, z: number): string {
    return `${Math.floor(x)}_${Math.floor(z)}`;
  }

  private shouldLoadChunk(playerX: number, playerZ: number, chunkX: number, chunkZ: number): boolean {
    const dx = chunkX * CHUNK_SIZE - playerX;
    const dz = chunkZ * CHUNK_SIZE - playerZ;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance <= this.LOAD_DISTANCE * CHUNK_SIZE;
  }

  private shouldRenderChunk(playerX: number, playerZ: number, chunkX: number, chunkZ: number): boolean {
    const dx = chunkX * CHUNK_SIZE - playerX;
    const dz = chunkZ * CHUNK_SIZE - playerZ;
    const distance = Math.sqrt(dx * dx + dz * dz);
    return distance <= this.renderDistance * CHUNK_SIZE;
  }

  public update(playerPosition: THREE.Vector3) {
    const playerChunkX = Math.floor(playerPosition.x / CHUNK_SIZE);
    const playerChunkZ = Math.floor(playerPosition.z / CHUNK_SIZE);
    
    const chunksToLoad = new Set<string>();
    const chunksToRender = new Set<string>();
    
    // Determine which chunks to load/render
    for (let x = playerChunkX - this.renderDistance - 1; x <= playerChunkX + this.renderDistance + 1; x++) {
      for (let z = playerChunkZ - this.renderDistance - 1; z <= playerChunkZ + this.renderDistance + 1; z++) {
        const key = this.getChunkKey(x, z);
        const distance = Math.sqrt((x - playerChunkX) ** 2 + (z - playerChunkZ) ** 2);
        
        // Load slightly more than render to avoid pop-in
        if (distance <= this.renderDistance + 1) {
          chunksToLoad.add(key);
          
          // Only render chunks within render distance
          if (distance <= this.renderDistance) {
            chunksToRender.add(key);
          }
        }
      }
    }
    
    // Load new chunks
    for (const key of chunksToLoad) {
      if (!this.loadedChunks.has(key)) {
        this.loadChunk(key);
      }
    }
    
    // Update chunk meshes
    for (const key of chunksToRender) {
      if (this.loadedChunks.has(key) && !this.meshes.has(key)) {
        this.generateChunkMesh(key);
      }
    }
    
    // Unload distant chunks
    for (const key of this.loadedChunks) {
      if (!chunksToLoad.has(key)) {
        this.unloadChunk(key);
      }
    }
    
    // Remove distant meshes
    for (const key of this.meshes.keys()) {
      if (!chunksToRender.has(key)) {
        this.removeChunkMesh(key);
      }
    }
  }

  private loadChunk(key: string) {
    const [x, z] = key.split('_').map(Number);
    const chunk = new Chunk(x, z);
    
    // Generate chunk data
    this.worldGenerator.generateChunk(chunk);
    this.lightingSystem.calculateChunkLighting(chunk);
    
    this.chunks.set(key, chunk);
    this.loadedChunks.add(key);
  }

  private unloadChunk(key: string) {
    this.chunks.delete(key);
    this.loadedChunks.delete(key);
    this.removeChunkMesh(key);
  }

  private generateChunkMesh(key: string) {
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    
    const geometry = this.meshBuilder.buildChunkMesh(chunk, this);
    
    if (geometry.getAttribute('position').count > 0) {
      const mesh = new THREE.Mesh(geometry, this.material);
      mesh.position.set(chunk.x * CHUNK_SIZE, 0, chunk.z * CHUNK_SIZE);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      this.scene.add(mesh);
      this.meshes.set(key, mesh);
    }
  }

  private removeChunkMesh(key: string) {
    const mesh = this.meshes.get(key);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      this.meshes.delete(key);
    }
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (y < 0 || y >= CHUNK_HEIGHT) return BlockType.AIR;
    
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    const key = this.getChunkKey(chunkX, chunkZ);
    
    const chunk = this.chunks.get(key);
    if (!chunk) return BlockType.AIR;
    
    const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    
    return chunk.getBlock(localX, y, localZ);
  }

  public setBlock(x: number, y: number, z: number, blockType: BlockType) {
    if (y < 0 || y >= CHUNK_HEIGHT) return;
    
    const chunkX = Math.floor(x / CHUNK_SIZE);
    const chunkZ = Math.floor(z / CHUNK_SIZE);
    const key = this.getChunkKey(chunkX, chunkZ);
    
    const chunk = this.chunks.get(key);
    if (!chunk) return;
    
    const localX = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    const localZ = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
    
    chunk.setBlock(localX, y, localZ, blockType);
    
    // Regenerate mesh for this chunk and neighbors
    this.removeChunkMesh(key);
    this.generateChunkMesh(key);
    
    // Update neighbor chunks if on border
    if (localX === 0) this.updateNeighborMesh(chunkX - 1, chunkZ);
    if (localX === CHUNK_SIZE - 1) this.updateNeighborMesh(chunkX + 1, chunkZ);
    if (localZ === 0) this.updateNeighborMesh(chunkX, chunkZ - 1);
    if (localZ === CHUNK_SIZE - 1) this.updateNeighborMesh(chunkX, chunkZ + 1);
  }

  private updateNeighborMesh(chunkX: number, chunkZ: number) {
    const key = this.getChunkKey(chunkX, chunkZ);
    if (this.meshes.has(key)) {
      this.removeChunkMesh(key);
      this.generateChunkMesh(key);
    }
  }

  public setWireframe(enabled: boolean) {
    this.material.wireframe = enabled;
  }

  public setRenderDistance(distance: number) {
    this.renderDistance = Math.max(this.MIN_RENDER_DISTANCE, Math.min(this.MAX_RENDER_DISTANCE, distance));
    console.log(`🔭 Render distance set to: ${this.renderDistance} chunks`);
  }

  public getRenderDistance(): number {
    return this.renderDistance;
  }

  public getLoadedChunksCount(): number {
    return this.loadedChunks.size;
  }

  public destroy() {
    for (const mesh of this.meshes.values()) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
    }
    
    this.meshes.clear();
    this.chunks.clear();
    this.loadedChunks.clear();
    this.material.dispose();
  }
}