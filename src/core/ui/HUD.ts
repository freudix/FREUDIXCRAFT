import { BlockType, BLOCK_PROPERTIES } from '../blocks/BlockTypes';

export class HUD {
  private hudElement: HTMLDivElement;
  private hotbarElement: HTMLDivElement;
  private statsElement: HTMLDivElement;
  private selectedSlot = 0;
  
  private readonly HOTBAR_BLOCKS = [
    BlockType.GRASS,
    BlockType.DIRT,
    BlockType.STONE,
    BlockType.WOOD,
    BlockType.LEAVES,
    BlockType.SAND,
    BlockType.COBBLESTONE,
    BlockType.WATER
  ];

  constructor() {
    this.createHUD();
    this.createHotbar();
    this.createStats();
  }

  private createHUD() {
    this.hudElement = document.createElement('div');
    this.hudElement.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: 'Courier New', monospace;
    `;
    
    document.body.appendChild(this.hudElement);
    
    // Crosshair
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    `;
    
    const crosshairDot = document.createElement('div');
    crosshairDot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: 2px;
      background: white;
      border-radius: 50%;
    `;
    
    crosshair.appendChild(crosshairDot);
    this.hudElement.appendChild(crosshair);
  }

  private createHotbar() {
    this.hotbarElement = document.createElement('div');
    this.hotbarElement.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 2px;
      background: rgba(0, 0, 0, 0.7);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      padding: 8px;
    `;
    
    for (let i = 0; i < this.HOTBAR_BLOCKS.length; i++) {
      const slot = document.createElement('div');
      slot.style.cssText = `
        width: 50px;
        height: 50px;
        background: ${i === this.selectedSlot ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
        border: 2px solid ${i === this.selectedSlot ? '#ffffff' : 'rgba(255, 255, 255, 0.2)'};
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        text-align: center;
        transition: all 0.2s;
      `;
      
      const blockName = BLOCK_PROPERTIES[this.HOTBAR_BLOCKS[i]].name;
      slot.innerHTML = `
        <div style="
          background: ${this.getBlockColor(this.HOTBAR_BLOCKS[i])};
          width: 30px;
          height: 30px;
          border-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        " title="${blockName}"></div>
      `;
      
      this.hotbarElement.appendChild(slot);
    }
    
    this.hudElement.appendChild(this.hotbarElement);
  }

  private createStats() {
    this.statsElement = document.createElement('div');
    this.statsElement.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.4;
      border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    this.hudElement.appendChild(this.statsElement);
  }

  private getBlockColor(blockType: BlockType): string {
    switch (blockType) {
      case BlockType.GRASS: return '#4a7c59';
      case BlockType.DIRT: return '#8b7355';
      case BlockType.STONE: return '#808080';
      case BlockType.WOOD: return '#8b4513';
      case BlockType.LEAVES: return '#228b22';
      case BlockType.WATER: return '#4169e1';
      case BlockType.SAND: return '#f4a460';
      case BlockType.COBBLESTONE: return '#696969';
      default: return '#ffffff';
    }
  }

  public scrollBlocks(direction: number) {
    this.selectedSlot += direction;
    if (this.selectedSlot < 0) this.selectedSlot = this.HOTBAR_BLOCKS.length - 1;
    if (this.selectedSlot >= this.HOTBAR_BLOCKS.length) this.selectedSlot = 0;
    
    this.updateHotbar();
  }

  private updateHotbar() {
    const slots = this.hotbarElement.children;
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i] as HTMLDivElement;
      const isSelected = i === this.selectedSlot;
      
      slot.style.background = isSelected ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)';
      slot.style.borderColor = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
      slot.style.transform = isSelected ? 'scale(1.05)' : 'scale(1)';
    }
  }

  public getSelectedBlock(): BlockType {
    return this.HOTBAR_BLOCKS[this.selectedSlot];
  }

  public updateStats(stats: { fps: number; chunks: number; triangles: number }) {
    this.statsElement.innerHTML = `
      <div style="font-weight: bold; color: #4CAF50; margin-bottom: 8px;">🌍 FreudixCraft</div>
      <div>FPS: <span style="color: #FFF59D">${stats.fps}</span></div>
      <div>Chunks: <span style="color: #81C784">${stats.chunks}</span></div>
      <div>Triangles: <span style="color: #64B5F6">${stats.triangles.toLocaleString()}</span></div>
      <div style="margin-top: 8px; font-size: 12px; color: #BDBDBD;">
        WASD: Move | Mouse: Look<br>
        LClick: Break | RClick: Place<br>
        Wheel: Change Block | F: Fly | L: Wire<br>
        +/-: Render Distance (2-4 chunks max)
      </div>
    `;
  }

  public destroy() {
    if (this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
  }
}