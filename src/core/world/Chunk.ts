import { BlockType } from '../blocks/BlockTypes';

export const CHUNK_SIZE = 16;
export const CHUNK_HEIGHT = 256;

export class Chunk {
  public readonly x: number;
  public readonly z: number;
  private blocks: Uint8Array;
  private lightLevels: Uint8Array;
  
  constructor(x: number, z: number) {
    this.x = x;
    this.z = z;
    
    // Initialize block data
    const size = CHUNK_SIZE * CHUNK_HEIGHT * CHUNK_SIZE;
    this.blocks = new Uint8Array(size);
    this.lightLevels = new Uint8Array(size);
    
    // Fill with air by default
    this.blocks.fill(BlockType.AIR);
    this.lightLevels.fill(0);
  }

  private getIndex(x: number, y: number, z: number): number {
    return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
  }

  public getBlock(x: number, y: number, z: number): BlockType {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return BlockType.AIR;
    }
    
    return this.blocks[this.getIndex(x, y, z)];
  }

  public setBlock(x: number, y: number, z: number, blockType: BlockType) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return;
    }
    
    this.blocks[this.getIndex(x, y, z)] = blockType;
  }

  public getLightLevel(x: number, y: number, z: number): number {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return 0;
    }
    
    return this.lightLevels[this.getIndex(x, y, z)];
  }

  public setLightLevel(x: number, y: number, z: number, level: number) {
    if (x < 0 || x >= CHUNK_SIZE || y < 0 || y >= CHUNK_HEIGHT || z < 0 || z >= CHUNK_SIZE) {
      return;
    }
    
    this.lightLevels[this.getIndex(x, y, z)] = Math.max(0, Math.min(15, level));
  }

  public getHeightAt(x: number, z: number): number {
    for (let y = CHUNK_HEIGHT - 1; y >= 0; y--) {
      if (this.getBlock(x, y, z) !== BlockType.AIR) {
        return y;
      }
    }
    return 0;
  }

  public isEmpty(): boolean {
    for (let i = 0; i < this.blocks.length; i++) {
      if (this.blocks[i] !== BlockType.AIR) {
        return false;
      }
    }
    return true;
  }
}