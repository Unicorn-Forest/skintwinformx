
/**
 * Cellular Scale Skin Model
 * Models cell division, differentiation, migration, and death in skin layers
 */

import type { MultiscaleField } from '../multiscale-tensor-operations';

export interface SkinCell {
  id: string;
  type: CellType;
  position: [number, number, number];
  age: number; // cell age in hours
  viability: number; // 0-1
  size: number; // cell radius in μm
  divisionTimer: number;
  differentiationStage: number; // 0 (stem) to 1 (terminally differentiated)
  metabolicState: 'active' | 'senescent' | 'apoptotic';
}

export type CellType = 
  | 'stem_cell' 
  | 'transit_amplifying' 
  | 'early_differentiation'
  | 'late_differentiation'
  | 'corneocyte'
  | 'melanocyte'
  | 'langerhans'
  | 'fibroblast';

export interface CellularProcess {
  processType: 'division' | 'differentiation' | 'migration' | 'apoptosis';
  trigger: string[];
  duration: number; // hours
  energyCost: number; // ATP molecules
  products: string[]; // resulting proteins/signals
}

export class CellularScaleModel {
  private cells: Map<string, SkinCell>;
  private cellGrid: Map<string, SkinCell[]>; // spatial organization
  private processes: Map<string, CellularProcess>;
  private growthFactors: Map<string, number>;
  private timeStep: number = 1; // hours
  private gridSize: [number, number, number];

  constructor(gridSize: [number, number, number]) {
    this.gridSize = gridSize;
    this.cells = new Map();
    this.cellGrid = new Map();
    this.processes = new Map();
    this.growthFactors = new Map();
    this.initializeCellularProcesses();
    this.populateInitialCells();
  }

  /**
   * Simulate one time step of cellular dynamics
   */
  public simulateTimeStep(molecularInfluence?: MultiscaleField): MultiscaleField {
    // Process molecular influences
    if (molecularInfluence) {
      this.processMolecularSignals(molecularInfluence);
    }

    // Update cellular processes
    this.updateCellDivision();
    this.updateCellDifferentiation();
    this.updateCellMigration();
    this.updateCellDeath();

    // Update growth factor gradients
    this.updateGrowthFactorGradients();

    return this.convertToTensorField();
  }

  /**
   * Model keratinocyte differentiation cascade
   */
  public modelKeratinocyteDifferentiation(stemCellDensity: number): MultiscaleField {
    const basalLayer = this.createBasalLayerCells(stemCellDensity);
    
    // Process through differentiation stages
    let currentCells = basalLayer;
    const differentiationStages = [
      'transit_amplifying',
      'early_differentiation',
      'late_differentiation',
      'corneocyte'
    ];

    differentiationStages.forEach((stage, index) => {
      currentCells = this.processDifferentiationStage(
        currentCells, 
        stage as CellType, 
        index / differentiationStages.length
      );
    });

    return this.convertToTensorField();
  }

  /**
   * Model wound healing cellular response
   */
  public modelWoundHealing(woundArea: number[][]): MultiscaleField {
    // Create wound area
    this.createWoundArea(woundArea);
    
    // Activate healing processes
    this.activateHealingResponse();
    
    // Simulate repair cascade
    for (let timePoint = 0; timePoint < 168; timePoint += this.timeStep) { // 1 week
      this.simulateHealingTimeStep();
    }

    return this.convertToTensorField();
  }

  private initializeCellularProcesses(): void {
    this.processes.set('keratinocyte_division', {
      processType: 'division',
      trigger: ['growth_factors', 'space_available'],
      duration: 16, // hours for full cell cycle
      energyCost: 1000,
      products: ['daughter_cells', 'growth_signals']
    });

    this.processes.set('terminal_differentiation', {
      processType: 'differentiation',
      trigger: ['differentiation_signals', 'cell_density'],
      duration: 72, // hours from basal to cornified
      energyCost: 500,
      products: ['keratins', 'lipids', 'cornified_envelope']
    });

    // Initialize growth factors
    this.growthFactors.set('EGF', 0.1); // Epidermal Growth Factor
    this.growthFactors.set('TGF_alpha', 0.05);
    this.growthFactors.set('IGF_1', 0.02);
    this.growthFactors.set('PDGF', 0.03);
  }

  private populateInitialCells(): void {
    const cellDensity = 1000; // cells per mm²
    let cellId = 0;

    for (let x = 0; x < this.gridSize[0]; x++) {
      for (let y = 0; y < this.gridSize[1]; y++) {
        const gridKey = `${x},${y}`;
        const cellsInGrid: SkinCell[] = [];

        // Basal layer (z=0)
        for (let i = 0; i < cellDensity / 10; i++) {
          const cell: SkinCell = {
            id: `cell_${cellId++}`,
            type: 'stem_cell',
            position: [x, y, 0],
            age: Math.random() * 100,
            viability: 0.95 + Math.random() * 0.05,
            size: 10 + Math.random() * 5,
            divisionTimer: Math.random() * 16,
            differentiationStage: 0,
            metabolicState: 'active'
          };
          
          cellsInGrid.push(cell);
          this.cells.set(cell.id, cell);
        }

        this.cellGrid.set(gridKey, cellsInGrid);
      }
    }
  }

  private processMolecularSignals(molecularField: MultiscaleField): void {
    // Extract growth factor concentrations from molecular field
    const avgConcentration = molecularField.data.reduce((a: number, b: number) => a + b, 0) / molecularField.data.length;
    
    // Update growth factor levels based on molecular input
    this.growthFactors.forEach((currentLevel, factorName) => {
      const molecularInfluence = avgConcentration * 0.1;
      this.growthFactors.set(factorName, currentLevel + molecularInfluence);
    });
  }

  private updateCellDivision(): void {
    const newCells: SkinCell[] = [];
    
    this.cells.forEach(cell => {
      if (cell.type === 'stem_cell' || cell.type === 'transit_amplifying') {
        cell.divisionTimer -= this.timeStep;
        
        if (cell.divisionTimer <= 0 && this.canCellDivide(cell)) {
          const daughterCell = this.createDaughterCell(cell);
          newCells.push(daughterCell);
          
          // Reset parent cell division timer
          cell.divisionTimer = 16 + Math.random() * 8; // 16-24 hours
          cell.age += this.timeStep;
        }
      }
    });

    // Add new cells to the system
    newCells.forEach(cell => {
      this.cells.set(cell.id, cell);
      const gridKey = `${Math.floor(cell.position[0])},${Math.floor(cell.position[1])}`;
      const gridCells = this.cellGrid.get(gridKey) || [];
      gridCells.push(cell);
      this.cellGrid.set(gridKey, gridCells);
    });
  }

  private updateCellDifferentiation(): void {
    this.cells.forEach(cell => {
      if (cell.type !== 'corneocyte') {
        const differentiationSignal = this.calculateDifferentiationSignal(cell);
        
        if (differentiationSignal > 0.5) {
          cell.differentiationStage += 0.01 * this.timeStep;
          
          // Update cell type based on differentiation stage
          if (cell.differentiationStage > 0.8) {
            cell.type = this.getNextDifferentiationStage(cell.type);
          }
        }
      }
    });
  }

  private updateCellMigration(): void {
    this.cells.forEach(cell => {
      if (cell.type !== 'stem_cell') {
        // Upward migration toward surface
        const migrationRate = this.calculateMigrationRate(cell);
        cell.position[2] += migrationRate * this.timeStep;
        
        // Remove cells that reach the surface
        if (cell.position[2] > this.gridSize[2]) {
          this.cells.delete(cell.id);
        }
      }
    });
  }

  private updateCellDeath(): void {
    const deadCells: string[] = [];
    
    this.cells.forEach(cell => {
      // Age-related death
      if (cell.age > 168) { // 1 week maximum lifespan
        cell.metabolicState = 'senescent';
        cell.viability *= 0.9;
      }
      
      // Apoptosis
      if (cell.viability < 0.1) {
        deadCells.push(cell.id);
      }
    });

    // Remove dead cells
    deadCells.forEach(cellId => this.cells.delete(cellId));
  }

  private canCellDivide(cell: SkinCell): boolean {
    const growthFactorLevel = this.growthFactors.get('EGF') || 0;
    const spaceFactor = this.calculateLocalSpaceFactor(cell.position);
    const viabilityFactor = cell.viability;
    
    return growthFactorLevel > 0.05 && spaceFactor > 0.3 && viabilityFactor > 0.8;
  }

  private createDaughterCell(parentCell: SkinCell): SkinCell {
    return {
      id: `cell_${Date.now()}_${Math.random()}`,
      type: parentCell.type,
      position: [
        parentCell.position[0] + (Math.random() - 0.5) * 2,
        parentCell.position[1] + (Math.random() - 0.5) * 2,
        parentCell.position[2]
      ],
      age: 0,
      viability: parentCell.viability * 0.95,
      size: parentCell.size * 0.8,
      divisionTimer: 16 + Math.random() * 8,
      differentiationStage: 0,
      metabolicState: 'active'
    };
  }

  private calculateDifferentiationSignal(cell: SkinCell): number {
    const densityFactor = this.calculateLocalCellDensity(cell.position);
    const ageFactor = cell.age / 168; // normalized age
    const positionFactor = cell.position[2] / this.gridSize[2]; // distance from basal
    
    return (densityFactor * 0.4 + ageFactor * 0.3 + positionFactor * 0.3);
  }

  private getNextDifferentiationStage(currentType: CellType): CellType {
    const stageMap: Record<CellType, CellType> = {
      'stem_cell': 'transit_amplifying',
      'transit_amplifying': 'early_differentiation',
      'early_differentiation': 'late_differentiation',
      'late_differentiation': 'corneocyte',
      'corneocyte': 'corneocyte',
      'melanocyte': 'melanocyte',
      'langerhans': 'langerhans',
      'fibroblast': 'fibroblast'
    };
    
    return stageMap[currentType] || currentType;
  }

  private calculateMigrationRate(cell: SkinCell): number {
    // Migration rate depends on cell type and differentiation stage
    const baseRate = 0.5; // μm/hour
    const differentiationFactor = cell.differentiationStage;
    const typeFactor = cell.type === 'corneocyte' ? 2.0 : 1.0;
    
    return baseRate * differentiationFactor * typeFactor;
  }

  private calculateLocalSpaceFactor(position: [number, number, number]): number {
    const gridKey = `${Math.floor(position[0])},${Math.floor(position[1])}`;
    const localCells = this.cellGrid.get(gridKey) || [];
    const maxCapacity = 100; // cells per grid unit
    
    return Math.max(0, 1 - localCells.length / maxCapacity);
  }

  private calculateLocalCellDensity(position: [number, number, number]): number {
    const gridKey = `${Math.floor(position[0])},${Math.floor(position[1])}`;
    const localCells = this.cellGrid.get(gridKey) || [];
    return localCells.length / 100; // normalized density
  }

  private createBasalLayerCells(density: number): SkinCell[] {
    const cells: SkinCell[] = [];
    const cellCount = Math.floor(density * this.gridSize[0] * this.gridSize[1]);
    
    for (let i = 0; i < cellCount; i++) {
      cells.push({
        id: `basal_${i}`,
        type: 'stem_cell',
        position: [
          Math.random() * this.gridSize[0],
          Math.random() * this.gridSize[1],
          0
        ],
        age: 0,
        viability: 0.98,
        size: 12,
        divisionTimer: 16,
        differentiationStage: 0,
        metabolicState: 'active'
      });
    }
    
    return cells;
  }

  private processDifferentiationStage(
    inputCells: SkinCell[], 
    targetType: CellType, 
    stage: number
  ): SkinCell[] {
    return inputCells.map(cell => ({
      ...cell,
      type: targetType,
      differentiationStage: stage,
      age: cell.age + 24, // 24 hours per stage
      position: [cell.position[0], cell.position[1], cell.position[2] + 10] // move up 10μm
    }));
  }

  private createWoundArea(woundArea: number[][]): void {
    // Remove cells in wound area
    woundArea.forEach((row, x) => {
      row.forEach((isWound, y) => {
        if (isWound) {
          const gridKey = `${x},${y}`;
          this.cellGrid.set(gridKey, []);
        }
      });
    });
  }

  private activateHealingResponse(): void {
    // Increase growth factor production
    this.growthFactors.set('EGF', 0.5);
    this.growthFactors.set('PDGF', 0.3);
    this.growthFactors.set('TGF_alpha', 0.2);
  }

  private simulateHealingTimeStep(): void {
    // Enhanced proliferation in wound area
    this.cells.forEach(cell => {
      if (this.isNearWound(cell.position)) {
        cell.divisionTimer *= 0.5; // Faster division
      }
    });
    
    this.simulateTimeStep();
  }

  private isNearWound(position: [number, number, number]): boolean {
    // Simplified wound proximity check
    const woundCenter = [this.gridSize[0] / 2, this.gridSize[1] / 2];
    const distance = Math.sqrt(
      Math.pow(position[0] - woundCenter[0], 2) + 
      Math.pow(position[1] - woundCenter[1], 2)
    );
    
    return distance < 5; // within 5 grid units of wound
  }

  private updateGrowthFactorGradients(): void {
    // Implement growth factor diffusion and degradation
    this.growthFactors.forEach((concentration, factorName) => {
      // Simple degradation
      const degradationRate = 0.1; // per hour
      const newConcentration = concentration * (1 - degradationRate * this.timeStep);
      this.growthFactors.set(factorName, Math.max(0, newConcentration));
    });
  }

  private convertToTensorField(): MultiscaleField {
    // Convert cellular state to tensor representation
    const cellDensityGrid = Array(this.gridSize[0]).fill(null).map(() =>
      Array(this.gridSize[1]).fill(null).map(() =>
        Array(this.gridSize[2]).fill(0)
      )
    );

    // Map cells to grid
    this.cells.forEach(cell => {
      const [x, y, z] = cell.position.map(coord => Math.floor(coord));
      if (x >= 0 && x < this.gridSize[0] && 
          y >= 0 && y < this.gridSize[1] && 
          z >= 0 && z < this.gridSize[2]) {
        cellDensityGrid[x][y][z]++;
      }
    });

    const flatData = cellDensityGrid.flat().flat();

    return {
      dimensions: [...this.gridSize],
      data: flatData,
      scale: 'cellular',
      coupling_interfaces: [
        {
          from_scale: 'cellular',
          to_scale: 'tissue',
          coupling_strength: 0.9,
          coupling_mechanism: 'cellular_force_generation'
        }
      ],
      metadata: {
        units: 'cells/mm³',
        description: 'Cellular density field',
        timestamp: new Date(),
        total_cells: this.cells.size,
        viable_cells: Array.from(this.cells.values()).filter(c => c.viability > 0.5).length
      }
    };
  }

  /**
   * Get current cellular state
   */
  public getCurrentState(): MultiscaleField {
    return this.convertToTensorField();
  }

  /**
   * Apply molecular scale influences
   */
  public applyMolecularInfluence(molecularField: MultiscaleField): void {
    // Process molecular signals affecting cellular behavior
    const avgMolecularConcentration = molecularField.data.reduce((a: number, b: number) => a + b, 0) / molecularField.data.length;
    
    // Adjust growth factors based on molecular signals
    this.growthFactors.forEach((currentLevel, factorName) => {
      const molecularBoost = avgMolecularConcentration * 0.01;
      this.growthFactors.set(factorName, currentLevel + molecularBoost);
    });
  }
}
