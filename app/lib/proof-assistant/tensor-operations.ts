/**
 * Tensor Operations for Multi-Scale Skin Model Analysis
 *
 * Provides tensor-based mathematical operations for modeling
 * ingredient penetration, diffusion, and multi-scale interactions
 * in skin tissue.
 */

import type { TensorField, TensorOperation } from './types';

// Re-export types for use in other modules
export type { TensorField, TensorOperation } from './types';

/**
 * Tensor mathematics engine for skin model calculations
 */
export class TensorOperationsEngine {
  private operations: Map<string, TensorOperation>;
  private precision: number;

  constructor(precision: number = 1e-6) {
    this.precision = precision;
    this.operations = new Map();
    this.initializeOperations();
  }

  /**
   * Execute a tensor operation by name
   */
  executeOperation(operationName: string, inputs: TensorField[]): TensorField {
    const operation = this.operations.get(operationName);

    if (!operation) {
      throw new Error(`Unknown tensor operation: ${operationName}`);
    }

    // Validate inputs
    if (inputs.length !== operation.inputFields.length) {
      throw new Error(
        `Operation ${operationName} expects ${operation.inputFields.length} inputs, got ${inputs.length}`,
      );
    }

    // Execute operation
    const result = operation.operation(inputs);

    // Validate result
    if (!operation.validation(result)) {
      throw new Error(`Operation ${operationName} produced invalid result`);
    }

    return result;
  }

  /**
   * Model ingredient diffusion through skin layers
   */
  modelDiffusion(concentration: TensorField, diffusivity: TensorField, timeStep: number): TensorField {
    return this.executeOperation('diffusion', [concentration, diffusivity, this.createTimeField(timeStep)]);
  }

  /**
   * Calculate skin penetration depth
   */
  calculatePenetrationDepth(molecularWeight: number, logP: number, concentration: number): TensorField {
    const mwField = this.createScalarField(molecularWeight, 'daltons', 'Molecular weight');
    const logPField = this.createScalarField(logP, 'unitless', 'Partition coefficient');
    const concField = this.createScalarField(concentration, 'mg/ml', 'Concentration');

    return this.executeOperation('penetration_depth', [mwField, logPField, concField]);
  }

  /**
   * Model multi-layer skin transport
   */
  modelMultiLayerTransport(layers: TensorField[], transportCoefficients: TensorField[]): TensorField {
    if (layers.length !== transportCoefficients.length) {
      throw new Error('Number of layers must match number of transport coefficients');
    }

    let currentConcentration = layers[0];

    for (let i = 1; i < layers.length; i++) {
      const transport = this.executeOperation('layer_transport', [
        currentConcentration,
        layers[i],
        transportCoefficients[i],
      ]);

      currentConcentration = this.executeOperation('tensor_add', [layers[i], transport]);
    }

    return currentConcentration;
  }

  /**
   * Calculate ingredient interaction tensor
   */
  calculateInteractionTensor(
    ingredient1: TensorField,
    ingredient2: TensorField,
    interactionType: 'synergistic' | 'antagonistic' | 'competitive',
  ): TensorField {
    const interactionField = this.createInteractionField(interactionType);

    return this.executeOperation('ingredient_interaction', [ingredient1, ingredient2, interactionField]);
  }

  /**
   * Model skin barrier function
   */
  modelBarrierFunction(barrierIntegrity: TensorField, permeabilityMap: TensorField): TensorField {
    return this.executeOperation('barrier_function', [barrierIntegrity, permeabilityMap]);
  }

  /**
   * Calculate effectiveness tensor for target effects
   */
  calculateEffectivenessTensor(
    concentrationProfile: TensorField,
    targetSite: TensorField,
    mechanismOfAction: TensorField,
  ): TensorField {
    return this.executeOperation('effectiveness_calculation', [concentrationProfile, targetSite, mechanismOfAction]);
  }

  // Helper methods for creating tensor fields

  /**
   * Create a scalar tensor field
   */
  createScalarField(value: number, units: string, description: string): TensorField {
    return {
      dimensions: [1],
      data: [value],
      metadata: {
        units,
        description,
        timestamp: new Date(),
      },
    };
  }

  /**
   * Create a time field for temporal operations
   */
  createTimeField(timeValue: number): TensorField {
    return this.createScalarField(timeValue, 'seconds', 'Time parameter');
  }

  /**
   * Create interaction type field
   */
  createInteractionField(interactionType: string): TensorField {
    const interactionValues = {
      synergistic: 1.2,
      antagonistic: 0.8,
      competitive: 0.9,
    };

    const value = interactionValues[interactionType as keyof typeof interactionValues] || 1.0;

    return this.createScalarField(value, 'unitless', `${interactionType} interaction coefficient`);
  }

  /**
   * Create a 2D concentration field
   */
  create2DConcentrationField(width: number, height: number, initialValue: number = 0): TensorField {
    const size = width * height;
    const data = new Array(size).fill(initialValue);

    return {
      dimensions: [width, height],
      data,
      metadata: {
        units: 'mg/ml',
        description: '2D concentration field',
        timestamp: new Date(),
      },
    };
  }

  /**
   * Create a 3D skin model field
   */
  create3DSkinField(width: number, height: number, depth: number, layerProperties: number[]): TensorField {
    const size = width * height * depth;
    const data: number[] = [];

    for (let z = 0; z < depth; z++) {
      const layerValue = layerProperties[Math.min(z, layerProperties.length - 1)];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          data.push(layerValue);
        }
      }
    }

    return {
      dimensions: [width, height, depth],
      data,
      metadata: {
        units: 'tissue_property',
        description: '3D skin model field',
        timestamp: new Date(),
      },
    };
  }

  // Private initialization methods

  private initializeOperations(): void {
    // Diffusion operation
    this.operations.set('diffusion', {
      name: 'diffusion',
      inputFields: ['concentration', 'diffusivity', 'time'],
      outputField: 'concentration_new',
      operation: this.diffusionOperation.bind(this),
      validation: this.validateConcentrationField.bind(this),
    });

    // Penetration depth calculation
    this.operations.set('penetration_depth', {
      name: 'penetration_depth',
      inputFields: ['molecular_weight', 'log_p', 'concentration'],
      outputField: 'penetration_depth',
      operation: this.penetrationDepthOperation.bind(this),
      validation: this.validatePositiveField.bind(this),
    });

    // Layer transport
    this.operations.set('layer_transport', {
      name: 'layer_transport',
      inputFields: ['source_layer', 'target_layer', 'transport_coefficient'],
      outputField: 'transported_amount',
      operation: this.layerTransportOperation.bind(this),
      validation: this.validateConcentrationField.bind(this),
    });

    // Tensor addition
    this.operations.set('tensor_add', {
      name: 'tensor_add',
      inputFields: ['tensor_a', 'tensor_b'],
      outputField: 'sum',
      operation: this.tensorAddOperation.bind(this),
      validation: this.validateTensorField.bind(this),
    });

    // Ingredient interaction
    this.operations.set('ingredient_interaction', {
      name: 'ingredient_interaction',
      inputFields: ['ingredient_1', 'ingredient_2', 'interaction_type'],
      outputField: 'interaction_result',
      operation: this.ingredientInteractionOperation.bind(this),
      validation: this.validateConcentrationField.bind(this),
    });

    // Barrier function
    this.operations.set('barrier_function', {
      name: 'barrier_function',
      inputFields: ['barrier_integrity', 'permeability_map'],
      outputField: 'effective_permeability',
      operation: this.barrierFunctionOperation.bind(this),
      validation: this.validatePositiveField.bind(this),
    });

    // Effectiveness calculation
    this.operations.set('effectiveness_calculation', {
      name: 'effectiveness_calculation',
      inputFields: ['concentration_profile', 'target_site', 'mechanism'],
      outputField: 'effectiveness',
      operation: this.effectivenessOperation.bind(this),
      validation: this.validateNormalizedField.bind(this),
    });
  }

  // Tensor operation implementations

  private diffusionOperation(inputs: TensorField[]): TensorField {
    const [concentration, diffusivity, time] = inputs;
    const dt = time.data[0];

    // Simple finite difference diffusion
    const newData = [...concentration.data];
    const D = diffusivity.data[0];

    if (concentration.dimensions.length === 1) {
      // 1D diffusion
      for (let i = 1; i < newData.length - 1; i++) {
        const d2c = concentration.data[i + 1] - 2 * concentration.data[i] + concentration.data[i - 1];
        newData[i] += D * dt * d2c;
      }
    } else if (concentration.dimensions.length === 2) {
      // 2D diffusion
      const [width, height] = concentration.dimensions;

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const d2c =
            concentration.data[idx + 1] +
            concentration.data[idx - 1] +
            concentration.data[idx + width] +
            concentration.data[idx - width] -
            4 * concentration.data[idx];
          newData[idx] += D * dt * d2c;
        }
      }
    }

    return {
      dimensions: concentration.dimensions,
      data: newData,
      metadata: {
        units: concentration.metadata.units,
        description: 'Diffused concentration field',
        timestamp: new Date(),
      },
    };
  }

  private penetrationDepthOperation(inputs: TensorField[]): TensorField {
    const [mw, logP, conc] = inputs;

    // Empirical penetration depth model
    const molecularWeight = mw.data[0];
    const partitionCoeff = logP.data[0];
    const concentration = conc.data[0];

    // Simplified penetration model: depth inversely related to MW, enhanced by logP and concentration
    const basePenetration = 100; // micrometers
    const mwFactor = Math.exp(-molecularWeight / 1000);
    const logPFactor = Math.min(2.0, Math.max(0.1, partitionCoeff));
    const concFactor = Math.min(2.0, Math.log(concentration + 1));

    const penetrationDepth = basePenetration * mwFactor * logPFactor * concFactor;

    return this.createScalarField(penetrationDepth, 'micrometers', 'Calculated penetration depth');
  }

  private layerTransportOperation(inputs: TensorField[]): TensorField {
    const [source, target, transport] = inputs;
    const transportCoeff = transport.data[0];

    // Calculate transported amount based on concentration gradient
    const gradient = this.calculateGradient(source, target);
    const transportedData = gradient.data.map((g) => g * transportCoeff);

    return {
      dimensions: gradient.dimensions,
      data: transportedData,
      metadata: {
        units: source.metadata.units,
        description: 'Layer transport flux',
        timestamp: new Date(),
      },
    };
  }

  private tensorAddOperation(inputs: TensorField[]): TensorField {
    const [tensorA, tensorB] = inputs;

    if (!this.dimensionsMatch(tensorA, tensorB)) {
      throw new Error('Tensor dimensions must match for addition');
    }

    const sumData = tensorA.data.map((a, i) => a + tensorB.data[i]);

    return {
      dimensions: tensorA.dimensions,
      data: sumData,
      metadata: {
        units: tensorA.metadata.units,
        description: 'Tensor sum',
        timestamp: new Date(),
      },
    };
  }

  private ingredientInteractionOperation(inputs: TensorField[]): TensorField {
    const [ing1, ing2, interaction] = inputs;
    const interactionCoeff = interaction.data[0];

    // Model ingredient interaction as modified concentration
    const interactionData = ing1.data.map((c1, i) => {
      const c2 = ing2.data[i] || 0;
      return c1 * c2 * interactionCoeff;
    });

    return {
      dimensions: ing1.dimensions,
      data: interactionData,
      metadata: {
        units: ing1.metadata.units,
        description: 'Ingredient interaction field',
        timestamp: new Date(),
      },
    };
  }

  private barrierFunctionOperation(inputs: TensorField[]): TensorField {
    const [integrity, permeability] = inputs;

    const effectivePermeability = integrity.data.map((integ, i) => {
      const perm = permeability.data[i] || 0;
      return perm * integ; // Barrier reduces permeability
    });

    return {
      dimensions: integrity.dimensions,
      data: effectivePermeability,
      metadata: {
        units: 'cm/s',
        description: 'Effective barrier permeability',
        timestamp: new Date(),
      },
    };
  }

  private effectivenessOperation(inputs: TensorField[]): TensorField {
    const [concentration, target, mechanism] = inputs;

    const effectiveness = concentration.data.map((conc, i) => {
      const targetDensity = target.data[i] || 0;
      const mechanismEff = mechanism.data[i] || 1;

      // Effectiveness as function of concentration, target density, and mechanism
      return Math.min(1.0, (conc * targetDensity * mechanismEff) / 100);
    });

    return {
      dimensions: concentration.dimensions,
      data: effectiveness,
      metadata: {
        units: 'unitless',
        description: 'Calculated effectiveness',
        timestamp: new Date(),
      },
    };
  }

  // Validation methods

  private validateTensorField(field: TensorField): boolean {
    return field.dimensions.length > 0 && field.data.length > 0 && field.data.every((x) => !isNaN(x));
  }

  private validateConcentrationField(field: TensorField): boolean {
    return this.validateTensorField(field) && field.data.every((x) => x >= 0);
  }

  private validatePositiveField(field: TensorField): boolean {
    return this.validateTensorField(field) && field.data.every((x) => x > 0);
  }

  private validateNormalizedField(field: TensorField): boolean {
    return this.validateTensorField(field) && field.data.every((x) => x >= 0 && x <= 1);
  }

  // Helper methods

  private calculateGradient(source: TensorField, target: TensorField): TensorField {
    const gradientData = source.data.map((s, i) => {
      const t = target.data[i] || 0;
      return s - t;
    });

    return {
      dimensions: source.dimensions,
      data: gradientData,
      metadata: {
        units: source.metadata.units,
        description: 'Concentration gradient',
        timestamp: new Date(),
      },
    };
  }

  private dimensionsMatch(tensorA: TensorField, tensorB: TensorField): boolean {
    return (
      tensorA.dimensions.length === tensorB.dimensions.length &&
      tensorA.dimensions.every((dim, i) => dim === tensorB.dimensions[i])
    );
  }
}
