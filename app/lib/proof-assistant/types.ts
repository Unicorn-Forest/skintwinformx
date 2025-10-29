/**
 * Core types for the SKIN-TWIN Formulation Proof Assistant
 */

interface SimpleIngredient {
  id: string;
  label?: string;
  inci_name?: string;
  category?: string;
  molecular_weight?: number;
  safety_rating?: string;
  concentration?: number;
}

// Core proof assistant types
export interface ProofAssistantConfig {
  maxVerificationDepth: number;
  cognitiveThreshold: number;
  tensorPrecision: number;
  hypergraphAnalysisDepth: number;
}

// Multi-scale skin model types
export interface SkinLayer {
  id: string;
  name: string;
  depth: number; // micrometers from surface
  cellTypes: string[];
  permeability: number;
  ph: number;
  functions: string[];
}

export interface SkinModel {
  layers: SkinLayer[];
  barriers: SkinBarrier[];
  transport: TransportMechanism[];
}

export interface SkinBarrier {
  id: string;
  location: string;
  type: 'lipid' | 'protein' | 'enzymatic';
  strength: number;
  selectivity: string[];
}

export interface TransportMechanism {
  id: string;
  type: 'passive' | 'active' | 'facilitated';
  pathway: 'transcellular' | 'intercellular' | 'appendage';
  efficiency: number;
  molecularWeightLimit: number;
}

// Ingredient interaction types
export interface IngredientInteraction {
  source: string;
  target: string;
  type: 'synergistic' | 'antagonistic' | 'neutral' | 'unknown';
  mechanism: string;
  confidence: number;
  evidenceLevel: 'theoretical' | 'in-vitro' | 'in-vivo' | 'clinical';
}

export interface IngredientEffect {
  ingredientId: string;
  targetLayer: string;
  effectType: string;
  magnitude: number;
  timeframe: number; // minutes
  confidence: number;
  mechanismOfAction: string;
}

// Proof verification types
export interface ProofStep {
  id: string;
  type: 'assumption' | 'deduction' | 'verification' | 'conclusion';
  statement: string;
  premises: string[];
  rule?: string;
  confidence: number;
  evidence: Evidence[];
  reasoning?: string;
}

export interface Evidence {
  id: string;
  type: 'experimental' | 'theoretical' | 'computational' | 'literature' | 'formal_logic';
  source: string;
  reliability: number;
  relevance: number;
  citation?: string;
  confidence: number;
  data?: any;
}

export interface Proof {
  id: string;
  hypothesis: string;
  conclusion: string;
  steps: ProofStep[];
  validity: number;
  completeness: number;
  cognitiveRelevance: number;
  formalProof?: {
    id: string;
    tactics: string[];
    qed: boolean;
    assumptions: string[];
  };
}

// Formal verification types (OpenCoq-inspired)
export interface FormalVerificationResult {
  isValid: boolean;
  confidence: number;
  formalProof?: any;
  mathematicalRigor: number;
  axiomsCovered: string[];
}

// Cognitive accounting types
export interface CognitiveState {
  relevanceWeights: Map<string, number>;
  attentionalFocus: string[];
  memoryActivation: Map<string, number>;
  uncertaintyLevels: Map<string, number>;
}

export interface RelevanceRealizationContext {
  currentGoal: string;
  activeIngredients: string[];
  skinCondition: string;
  userConstraints: string[];
  environmentalFactors: Map<string, any>;
}

// Tensor operation types
export interface TensorField {
  dimensions: number[];
  data: number[];
  metadata: {
    units: string;
    description: string;
    timestamp: Date;
    [key: string]: unknown; // Allow additional metadata properties
  };
}

export interface TensorOperation {
  name: string;
  inputFields: string[];
  outputField: string;
  operation: (inputs: TensorField[]) => TensorField;
  validation: (result: TensorField) => boolean;
}

// Verification engine types
export interface VerificationRequest {
  hypothesis: string;
  ingredients: SimpleIngredient[];
  targetEffects: IngredientEffect[];
  constraints: FormulationConstraint[];
  skinModel: SkinModel;
}

export interface FormulationConstraint {
  type: 'concentration' | 'ph' | 'temperature' | 'compatibility' | 'regulatory';
  parameter: string;
  value: number | string;
  operator: 'eq' | 'lt' | 'gt' | 'lte' | 'gte' | 'in' | 'not_in';
  required: boolean;
}

export interface VerificationResult {
  isValid: boolean;
  confidence: number;
  proof: Proof;
  warnings: string[];
  recommendations: string[];
  alternativeFormulations?: AlternativeFormulation[];
}

export interface AlternativeFormulation {
  ingredients: SimpleIngredient[];
  reasoning: string;
  expectedImprovement: string;
  tradeoffs: string[];
  confidence: number;
}

// Hypergraph integration types
export interface ProofHypergraph {
  nodes: ProofNode[];
  hyperedges: ProofHyperedge[];
  analysis: HypergraphAnalysis;
}

export interface ProofNode {
  id: string;
  type: 'ingredient' | 'effect' | 'interaction' | 'constraint' | 'evidence';
  properties: Map<string, any>;
  relevanceScore: number;
}

export interface ProofHyperedge {
  id: string;
  nodes: string[];
  type: 'causation' | 'correlation' | 'inhibition' | 'enhancement' | 'dependency';
  weight: number;
  confidence: number;
  evidence: Evidence[];
}

export interface HypergraphAnalysis {
  connectivity: number;
  clustering: number;
  criticalPaths: string[][];
  vulnerabilities: string[];
  opportunities: string[];
}
