import { Chunk, CHUNK_SIZE, CHUNK_HEIGHT } from './Chunk';
import { BlockType } from '../blocks/BlockTypes';
import { NoiseGenerator } from '../utils/NoiseGenerator';

export class WorldGenerator {
  private noiseGen: NoiseGenerator;
  
  // Terrain parameters
  private readonly TERRAIN_SCALE = 0.01;
  private readonly TERRAIN_HEIGHT = 80;
  private readonly CAVE_SCALE = 0.05;
  private readonly CAVE_THRESHOLD = 0.6;
  private readonly WATER_LEVEL = 60;

  constructor(seed: number = 12345) {
    this.noiseGen = new NoiseGenerator(seed);
  }

  public generateChunk(chunk: Chunk) {
    const worldX = chunk.x * CHUNK_SIZE;
    const worldZ = chunk.z * CHUNK_SIZE;
    
    // Generate height map
    const heightMap = this.generateHeightMap(worldX, worldZ);
    
    // Generate blocks
    for (let x = 0; x < CHUNK_SIZE; x++) {
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const height = heightMap[x][z];
        this.generateColumn(chunk, x, z, height, worldX + x, worldZ + z);
      }
    }
  }

  private generateHeightMap(worldX: number, worldZ: number): number[][] {
    const heightMap: number[][] = [];
    
    for (let x = 0; x < CHUNK_SIZE; x++) {
      heightMap[x] = [];
      for (let z = 0; z < CHUNK_SIZE; z++) {
        const wx = worldX + x;
        const wz = worldZ + z;
        
        // Multi-octave noise for terrain
        let height = 0;
        let amplitude = 1;
        let frequency = this.TERRAIN_SCALE;
        
        for (let octave = 0; octave < 6; octave++) {
          height += this.noiseGen.noise(wx * frequency, wz * frequency) * amplitude;
          amplitude *= 0.5;
          frequency *= 2;
        }
        
        // Normalize and scale
        height = (height + 1) * 0.5; // Normalize to 0-1
        height = height * this.TERRAIN_HEIGHT + 32; // Scale to world height
        
        heightMap[x][z] = Math.floor(height);
      }
    }
    
    return heightMap;
  }

  private generateColumn(chunk: Chunk, x: number, z: number, surfaceHeight: number, worldX: number, worldZ: number) {
    for (let y = 0; y < CHUNK_HEIGHT; y++) {
      let blockType = BlockType.AIR;
      
      if (y <= surfaceHeight) {
        // Determine block type based on height and biome
        if (y < surfaceHeight - 3) {
          // Deep underground - stone
          blockType = BlockType.STONE;
        } else if (y < surfaceHeight) {
          // Shallow underground - dirt
          blockType = BlockType.DIRT;
        } else {
          // Surface layer
          if (surfaceHeight > this.WATER_LEVEL + 5) {
            blockType = BlockType.GRASS;
          } else if (surfaceHeight > this.WATER_LEVEL - 2) {
            blockType = BlockType.SAND;
          } else {
            blockType = BlockType.DIRT;
          }
        }
        
        // Generate caves
        if (y > 5 && y < surfaceHeight - 5) {
          const caveNoise = this.noiseGen.noise3D(worldX * this.CAVE_SCALE, y * this.CAVE_SCALE * 2, worldZ * this.CAVE_SCALE);
          if (caveNoise > this.CAVE_THRESHOLD) {
            blockType = BlockType.AIR;
          }
        }
        
        // Generate ore veins
        if (blockType === BlockType.STONE) {
          const oreChance = Math.random();
          if (oreChance < 0.01 && y < 50) {
            blockType = BlockType.COBBLESTONE; // Placeholder for ore
          }
        }
      } else if (y <= this.WATER_LEVEL && surfaceHeight < this.WATER_LEVEL) {
        // Water above surface
        blockType = BlockType.WATER;
      }
      
      chunk.setBlock(x, y, z, blockType);
    }
    
    // Add trees
    if (Math.random() < 0.02 && surfaceHeight > this.WATER_LEVEL + 5) {
      this.generateTree(chunk, x, z, surfaceHeight + 1);
    }
  }

  private generateTree(chunk: Chunk, x: number, z: number, baseY: number) {
    const treeHeight = 4 + Math.floor(Math.random() * 3);
    
    // Trunk
    for (let y = 0; y < treeHeight; y++) {
      if (baseY + y < CHUNK_HEIGHT) {
        chunk.setBlock(x, baseY + y, z, BlockType.WOOD);
      }
    }
    
    // Leaves
    const leavesY = baseY + treeHeight;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = -1; dy <= 1; dy++) {
          const lx = x + dx;
          const lz = z + dz;
          const ly = leavesY + dy;
          
          if (lx >= 0 && lx < CHUNK_SIZE && lz >= 0 && lz < CHUNK_SIZE && ly < CHUNK_HEIGHT) {
            const distance = Math.abs(dx) + Math.abs(dz) + Math.abs(dy);
            if (distance <= 3 && Math.random() > 0.2) {
              if (chunk.getBlock(lx, ly, lz) === BlockType.AIR) {
                chunk.setBlock(lx, ly, lz, BlockType.LEAVES);
              }
            }
          }
        }
      }
    }
  }
}