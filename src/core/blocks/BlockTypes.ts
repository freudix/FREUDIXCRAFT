export enum BlockType {
  AIR = 0,
  GRASS = 1,
  DIRT = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  WATER = 6,
  SAND = 7,
  COBBLESTONE = 8
}

export interface BlockProperties {
  name: string;
  visible: boolean;
  solid: boolean;
  transparent: boolean;
  hardness: number;
  emitsLight: number;
  flammable: boolean;
}

export const BLOCK_PROPERTIES: Record<BlockType, BlockProperties> = {
  [BlockType.AIR]: {
    name: 'Air',
    visible: false,
    solid: false,
    transparent: true,
    hardness: 0,
    emitsLight: 0,
    flammable: false
  },
  [BlockType.GRASS]: {
    name: 'Grass Block',
    visible: true,
    solid: true,
    transparent: false,
    hardness: 0.6,
    emitsLight: 0,
    flammable: true
  },
  [BlockType.DIRT]: {
    name: 'Dirt',
    visible: true,
    solid: true,
    transparent: false,
    hardness: 0.5,
    emitsLight: 0,
    flammable: false
  },
  [BlockType.STONE]: {
    name: 'Stone',
    visible: true,
    solid: true,
    transparent: false,
    hardness: 1.5,
    emitsLight: 0,
    flammable: false
  },
  [BlockType.WOOD]: {
    name: 'Wood',
    visible: true,
    solid: true,
    transparent: false,
    hardness: 2.0,
    emitsLight: 0,
    flammable: true
  },
  [BlockType.LEAVES]: {
    name: 'Leaves',
    visible: true,
    solid: true,
    transparent: true,
    hardness: 0.2,
    emitsLight: 0,
    flammable: true
  },
  [BlockType.WATER]: {
    name: 'Water',
    visible: true,
    solid: false,
    transparent: true,
    hardness: 0,
    emitsLight: 0,
    flammable: false
  },
  [BlockType.SAND]: {
    name: 'Sand',
    visible: true,
    solid: true,
    transparent: false,
    hardness: 0.5,
    emitsLight: 0,
    flammable: false
  },
  [BlockType.COBBLESTONE]: {
    name: 'Cobblestone',
    visible: true,
    solid: true,
    transparent: false,
    hardness: 2.0,
    emitsLight: 0,
    flammable: false
  }
};