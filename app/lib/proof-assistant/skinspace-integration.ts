/**
 * SkinSpace Integration Module
 * 
 * Main integration point that brings together the SkinSpace core, adapters, 
 * and cognitive operations with the existing hypergraph proof assistant architecture.
 */

import type { 
  SkinSpace, 
  SkinAtom, 
  SkinLink, 
  SkinSpaceStatistics
} from './skinspace-core';
import { SkinAtomType, SkinLinkType, SkinSpace as SkinSpaceClass } from './skinspace-core';

import type { 
  SkinSpaceLoadResult,
  RawNode,
  RawEdge,
  RSNode,
  RSEdge
} from './skinspace-adapters';
import { 
  SkinSpaceDataAdapter, 
  VesselDataParser
} from './skinspace-adapters';

import type {
  DiscoveredPattern,
  AttentionContext,
  AttentionUpdate,
  ActivationSpread,
  InferenceResult
} from './skinspace-cognition';
import {
  SkinSpacePatternMiner,
  SkinSpaceAttentionEngine,
  SkinSpaceInferenceEngine
} from './skinspace-cognition';

import type {
  ProofHypergraph,
  ProofNode,
  ProofHyperedge,
  VerificationRequest,
  VerificationResult,
  Evidence
} from './types';

/**
 * Main SkinSpace container that integrates all OpenCog-inspired functionality
 */
export class SkinSpaceVessel {
  private skinSpace: SkinSpace;
  private dataAdapter: SkinSpaceDataAdapter;
  private patternMiner: SkinSpacePatternMiner;
  private attentionEngine: SkinSpaceAttentionEngine;
  private inferenceEngine: SkinSpaceInferenceEngine;
  private isInitialized: boolean = false;

  constructor() {
    this.skinSpace = new SkinSpaceClass();
    this.dataAdapter = new SkinSpaceDataAdapter(this.skinSpace);
    this.patternMiner = new SkinSpacePatternMiner(this.skinSpace);
    this.attentionEngine = new SkinSpaceAttentionEngine(this.skinSpace);
    this.inferenceEngine = new SkinSpaceInferenceEngine(this.skinSpace);
  }

  /**
   * Initialize SkinSpace with vessel data from CSV files
   */
  public async initializeFromVesselData(
    rawNodesContent: string,
    rawEdgesContent: string,
    rsNodesContent: string,
    rsEdgesContent: string
  ): Promise<SkinSpaceInitResult> {
    try {
      const startTime = Date.now();

      // Parse CSV data
      const rawNodes = VesselDataParser.parseRawNodes(rawNodesContent);
      const rawEdges = VesselDataParser.parseRawEdges(rawEdgesContent);
      const rsNodes = VesselDataParser.parseRSNodes(rsNodesContent);
      const rsEdges = VesselDataParser.parseRSEdges(rsEdgesContent);

      // Load data into SkinSpace
      const loadResult = await this.dataAdapter.loadVesselData(
        rawNodes, rawEdges, rsNodes, rsEdges
      );

      // Perform initial pattern mining
      const formulationPatterns = this.patternMiner.mineFormulationPatterns(0.1);
      const supplyPatterns = this.patternMiner.mineSupplyChainPatterns();
      const substitutionPatterns = this.patternMiner.mineSubstitutionPatterns();

      // Perform initial inference
      const supplyInferences = this.inferenceEngine.inferMissingSupplyLinks();
      const synergyInferences = this.inferenceEngine.inferIngredientSynergies();

      this.isInitialized = true;
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        loadResult,
        initialPatterns: {
          formulation: formulationPatterns,
          supply: supplyPatterns,
          substitution: substitutionPatterns
        },
        initialInferences: {
          supply: supplyInferences,
          synergy: synergyInferences
        },
        statistics: this.skinSpace.getStatistics(),
        processingTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown initialization error',
        processingTime: 0
      };
    }
  }

  /**
   * Query SkinSpace with natural language and context
   */
  public async query(
    query: string, 
    context: SkinSpaceQueryContext = {}
  ): Promise<SkinSpaceQueryResult> {
    if (!this.isInitialized) {
      throw new Error('SkinSpace not initialized. Call initializeFromVesselData first.');
    }

    const startTime = Date.now();

    // Focus attention based on query
    const attentionContext: AttentionContext = {
      focus: context.focus || 'ingredients',
      ingredientIds: context.ingredientIds,
      productIds: context.productIds,
      supplierIds: context.supplierIds
    };

    const attentionUpdate = this.attentionEngine.focusAttentionOnQuery(query, attentionContext);

    // Get focused atoms
    const focusedAtoms = this.attentionEngine.getCurrentFocus(20);

    // Spread activation from focused atoms
    const activation = this.attentionEngine.spreadActivation(
      focusedAtoms.slice(0, 5).map(a => a.id),
      0.7
    );

    // Find relevant patterns
    const relevantPatterns = this.findRelevantPatterns(query, focusedAtoms);

    // Generate inferences based on context
    const contextualInferences = this.generateContextualInferences(query, focusedAtoms);

    // Build response
    const response: SkinSpaceQueryResult = {
      query,
      focusedAtoms: focusedAtoms.slice(0, 10).map(atom => ({
        id: atom.id,
        name: atom.name,
        type: atom.type,
        truthValue: atom.truthValue,
        attentionValue: atom.attentionValue,
        properties: Object.fromEntries(atom.properties)
      })),
      attentionUpdate,
      activationSpread: activation,
      relevantPatterns,
      inferences: contextualInferences,
      recommendations: this.generateRecommendations(query, focusedAtoms, relevantPatterns),
      processingTime: Date.now() - startTime
    };

    return response;
  }

  /**
   * Integrate with existing hypergraph proof assistant
   */
  public integrateWithProofHypergraph(
    proofGraph: ProofHypergraph,
    context: string
  ): SkinSpaceIntegrationResult {
    if (!this.isInitialized) {
      throw new Error('SkinSpace not initialized');
    }

    const integration: SkinSpaceIntegrationResult = {
      mappedNodes: [],
      mappedEdges: [],
      cognitiveInsights: [],
      enhancedTruthValues: new Map(),
      attentionMappings: new Map()
    };

    // Map proof nodes to SkinSpace atoms
    for (const proofNode of proofGraph.nodes) {
      const mappedAtom = this.mapProofNodeToSkinAtom(proofNode);
      if (mappedAtom) {
        integration.mappedNodes.push({
          proofNodeId: proofNode.id,
          skinAtomId: mappedAtom.id,
          mappingConfidence: this.calculateMappingConfidence(proofNode, mappedAtom)
        });

        // Enhance truth values with SkinSpace knowledge
        const enhancedTruth = this.enhanceTruthValueWithSkinSpace(
          proofNode.properties.get('truthValue') || { strength: 0.5, confidence: 0.5, count: 1 },
          mappedAtom
        );
        integration.enhancedTruthValues.set(proofNode.id, enhancedTruth);

        // Map attention values
        integration.attentionMappings.set(proofNode.id, mappedAtom.attentionValue);
      }
    }

    // Generate cognitive insights
    integration.cognitiveInsights = this.generateCognitiveInsights(proofGraph, context);

    return integration;
  }

  /**
   * Enhance verification with SkinSpace knowledge
   */
  public enhanceVerificationWithSkinSpace(
    request: VerificationRequest
  ): Promise<SkinSpaceEnhancedVerification> {
    if (!this.isInitialized) {
      throw new Error('SkinSpace not initialized');
    }

    // Focus on ingredients in the request
    const ingredientIds = request.ingredients.map(ing => `ingredient_${ing.id}`);
    this.attentionEngine.focusAttentionOnQuery(
      request.hypothesis,
      { focus: 'ingredients', ingredientIds }
    );

    // Find relevant patterns for the ingredients
    const relevantPatterns = this.patternMiner.mineFormulationPatterns(0.05)
      .filter(pattern => 
        pattern.atoms.some(atomId => ingredientIds.includes(atomId))
      );

    // Generate supply chain analysis
    const supplyAnalysis = this.analyzeSupplyChain(ingredientIds);

    // Infer potential issues
    const potentialIssues = this.inferPotentialFormulationIssues(request);

    // Generate enhanced evidence
    const enhancedEvidence = this.generateSkinSpaceEvidence(
      request, relevantPatterns, supplyAnalysis
    );

    return Promise.resolve({
      originalRequest: request,
      skinSpacePatterns: relevantPatterns,
      supplyChainAnalysis: supplyAnalysis,
      potentialIssues,
      enhancedEvidence,
      cognitiveRecommendations: this.generateCognitiveRecommendations(
        request, relevantPatterns, supplyAnalysis
      )
    });
  }

  /**
   * Get comprehensive SkinSpace analytics
   */
  public getAnalytics(): SkinSpaceAnalytics {
    if (!this.isInitialized) {
      throw new Error('SkinSpace not initialized');
    }

    const statistics = this.skinSpace.getStatistics();
    const loadStats = this.dataAdapter.getLoadStatistics();
    
    return {
      atomStatistics: statistics,
      networkCoverage: loadStats.networkCoverage,
      discoveredPatterns: {
        formulation: this.patternMiner.mineFormulationPatterns(0.1).length,
        supply: this.patternMiner.mineSupplyChainPatterns().length,
        substitution: this.patternMiner.mineSubstitutionPatterns().length
      },
      attentionMetrics: {
        focusedAtoms: this.attentionEngine.getCurrentFocus(50).length,
        attentionSpread: statistics.attentionSpread
      },
      inferenceMetrics: {
        missingSupplyLinks: this.inferenceEngine.inferMissingSupplyLinks().length,
        potentialSynergies: this.inferenceEngine.inferIngredientSynergies().length
      }
    };
  }

  // Private helper methods

  private findRelevantPatterns(query: string, focusedAtoms: SkinAtom[]): DiscoveredPattern[] {
    const allPatterns = this.patternMiner.getCachedPatterns();
    const focusedIds = new Set(focusedAtoms.map(a => a.id));
    
    return allPatterns.filter(pattern =>
      pattern.atoms.some(atomId => focusedIds.has(atomId))
    ).sort((a, b) => b.significance - a.significance);
  }

  private generateContextualInferences(query: string, focusedAtoms: SkinAtom[]): InferenceResult[] {
    // Generate inferences based on current focus
    const supplyInferences = this.inferenceEngine.inferMissingSupplyLinks()
      .filter(inf => inf.affectedAtoms.some(id => focusedAtoms.some(a => a.id === id)));
    
    const synergyInferences = this.inferenceEngine.inferIngredientSynergies()
      .filter(inf => inf.affectedAtoms.some(id => focusedAtoms.some(a => a.id === id)));

    return [...supplyInferences, ...synergyInferences]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  private generateRecommendations(
    query: string, 
    focusedAtoms: SkinAtom[], 
    patterns: DiscoveredPattern[]
  ): string[] {
    const recommendations: string[] = [];

    // Pattern-based recommendations
    for (const pattern of patterns.slice(0, 3)) {
      if (pattern.type === 'formulation_synergy') {
        recommendations.push(
          `Consider the synergistic combination: ${pattern.description}`
        );
      } else if (pattern.type === 'supply_vulnerability') {
        recommendations.push(
          `Supply chain risk identified: ${pattern.description}`
        );
      } else if (pattern.type === 'substitution_group') {
        recommendations.push(
          `Alternative ingredients available: ${pattern.description}`
        );
      }
    }

    // Attention-based recommendations
    const highAttentionAtoms = focusedAtoms.slice(0, 3);
    for (const atom of highAttentionAtoms) {
      if (atom.type === SkinAtomType.INGREDIENT_NODE) {
        recommendations.push(
          `High relevance ingredient: ${atom.name} (confidence: ${atom.truthValue.confidence.toFixed(2)})`
        );
      }
    }

    return recommendations;
  }

  private mapProofNodeToSkinAtom(proofNode: ProofNode): SkinAtom | null {
    // Try to find matching atom in SkinSpace
    const candidates = this.skinSpace.patternMatch({
      namePattern: proofNode.properties.get('label') || `.*${proofNode.id}.*`
    });

    if (candidates.length > 0) {
      return candidates[0]; // Return best match
    }

    return null;
  }

  private calculateMappingConfidence(proofNode: ProofNode, skinAtom: SkinAtom): number {
    // Simple confidence calculation based on name similarity and type matching
    let confidence = 0.5;
    
    const proofLabel = proofNode.properties.get('label') || '';
    if (skinAtom.name.toLowerCase().includes(proofLabel.toLowerCase())) {
      confidence += 0.3;
    }
    
    if (proofNode.type === 'ingredient' && skinAtom.type === SkinAtomType.INGREDIENT_NODE) {
      confidence += 0.2;
    }
    
    return Math.min(1, confidence);
  }

  private enhanceTruthValueWithSkinSpace(
    originalTruth: any, 
    skinAtom: SkinAtom
  ): { strength: number; confidence: number; count: number } {
    return {
      strength: (originalTruth.strength + skinAtom.truthValue.strength) / 2,
      confidence: Math.max(originalTruth.confidence, skinAtom.truthValue.confidence),
      count: originalTruth.count + skinAtom.truthValue.count
    };
  }

  private generateCognitiveInsights(proofGraph: ProofHypergraph, context: string): string[] {
    const insights: string[] = [];

    // Analyze attention patterns in the proof graph
    const nodeAttentions = proofGraph.nodes.map(n => 
      n.properties.get('attention') || 0
    );
    
    if (nodeAttentions.length > 0) {
      const avgAttention = nodeAttentions.reduce((a, b) => a + b, 0) / nodeAttentions.length;
      insights.push(`Average attention level in proof: ${avgAttention.toFixed(2)}`);
    }

    // Add pattern-based insights
    const patterns = this.patternMiner.getCachedPatterns();
    if (patterns.length > 0) {
      insights.push(`Discovered ${patterns.length} knowledge patterns in SkinSpace`);
    }

    return insights;
  }

  private analyzeSupplyChain(ingredientIds: string[]): SupplyChainAnalysis {
    const supplyLinks = this.skinSpace.getAtomsByType(SkinLinkType.SUPPLIED_BY_LINK) as unknown as SkinLink[];
    
    const analysis: SupplyChainAnalysis = {
      totalIngredients: ingredientIds.length,
      suppliedIngredients: 0,
      vulnerableIngredients: [],
      supplierDiversity: new Map(),
      riskScore: 0
    };

    for (const ingredientId of ingredientIds) {
      const suppliers = supplyLinks
        .filter(link => link.outgoing[0] === ingredientId)
        .map(link => link.outgoing[1]);

      if (suppliers.length > 0) {
        analysis.suppliedIngredients++;
        
        if (suppliers.length === 1) {
          analysis.vulnerableIngredients.push(ingredientId);
        }
        
        for (const supplierId of suppliers) {
          const count = analysis.supplierDiversity.get(supplierId) || 0;
          analysis.supplierDiversity.set(supplierId, count + 1);
        }
      } else {
        analysis.vulnerableIngredients.push(ingredientId);
      }
    }

    // Calculate risk score
    analysis.riskScore = analysis.vulnerableIngredients.length / analysis.totalIngredients;

    return analysis;
  }

  private inferPotentialFormulationIssues(request: VerificationRequest): PotentialIssue[] {
    const issues: PotentialIssue[] = [];

    // Check for known incompatibilities (simplified)
    const ingredientIds = request.ingredients.map(ing => `ingredient_${ing.id}`);
    
    for (let i = 0; i < ingredientIds.length; i++) {
      for (let j = i + 1; j < ingredientIds.length; j++) {
        const atom1 = this.skinSpace.getAtom(ingredientIds[i]);
        const atom2 = this.skinSpace.getAtom(ingredientIds[j]);
        
        if (atom1 && atom2) {
          // Check for incompatibility patterns (simplified)
          const incompatibilityRisk = this.assessIncompatibilityRisk(atom1, atom2);
          if (incompatibilityRisk > 0.5) {
            issues.push({
              type: 'incompatibility_risk',
              severity: 'medium',
              description: `Potential incompatibility between ${atom1.name} and ${atom2.name}`,
              affectedIngredients: [atom1.id, atom2.id],
              confidence: incompatibilityRisk
            });
          }
        }
      }
    }

    return issues;
  }

  private assessIncompatibilityRisk(atom1: SkinAtom, atom2: SkinAtom): number {
    // Simplified incompatibility assessment
    const category1 = atom1.properties.get('category') || '';
    const category2 = atom2.properties.get('category') || '';
    
    // Some known problematic combinations (simplified)
    const problematicPairs = [
      ['acid', 'base'],
      ['oil', 'water-soluble'],
      ['antioxidant', 'oxidizer']
    ];

    for (const [cat1, cat2] of problematicPairs) {
      if ((category1.includes(cat1) && category2.includes(cat2)) ||
          (category1.includes(cat2) && category2.includes(cat1))) {
        return 0.7;
      }
    }

    return 0.1; // Low default risk
  }

  private generateSkinSpaceEvidence(
    request: VerificationRequest,
    patterns: DiscoveredPattern[],
    supplyAnalysis: SupplyChainAnalysis
  ): Evidence[] {
    const evidence: Evidence[] = [];

    // Pattern-based evidence
    for (const pattern of patterns) {
      evidence.push({
        id: `skinspace_pattern_${pattern.id}`,
        type: 'computational',
        source: 'SkinSpace pattern mining',
        reliability: pattern.confidence,
        relevance: pattern.significance,
        confidence: pattern.strength,
        data: {
          patternType: pattern.type,
          description: pattern.description,
          frequency: pattern.frequency
        }
      });
    }

    // Supply chain evidence
    if (supplyAnalysis.riskScore > 0.3) {
      evidence.push({
        id: `skinspace_supply_risk`,
        type: 'computational',
        source: 'SkinSpace supply chain analysis',
        reliability: 0.8,
        relevance: 0.7,
        confidence: 1 - supplyAnalysis.riskScore,
        data: {
          riskScore: supplyAnalysis.riskScore,
          vulnerableIngredients: supplyAnalysis.vulnerableIngredients.length,
          supplierDiversity: supplyAnalysis.supplierDiversity.size
        }
      });
    }

    return evidence;
  }

  private generateCognitiveRecommendations(
    request: VerificationRequest,
    patterns: DiscoveredPattern[],
    supplyAnalysis: SupplyChainAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Pattern-based recommendations
    const synergyPatterns = patterns.filter(p => p.type === 'formulation_synergy');
    if (synergyPatterns.length > 0) {
      recommendations.push(
        `Found ${synergyPatterns.length} synergistic ingredient patterns that could enhance the formulation`
      );
    }

    // Supply chain recommendations
    if (supplyAnalysis.riskScore > 0.5) {
      recommendations.push(
        `High supply chain risk (${(supplyAnalysis.riskScore * 100).toFixed(1)}%). Consider alternative suppliers or ingredient substitutions.`
      );
    }

    // Substitution recommendations
    const substitutionPatterns = patterns.filter(p => p.type === 'substitution_group');
    if (substitutionPatterns.length > 0) {
      recommendations.push(
        `${substitutionPatterns.length} ingredient substitution groups available for optimization`
      );
    }

    return recommendations;
  }

  // Getter methods for access to internal components
  public getSkinSpace(): SkinSpace {
    return this.skinSpace;
  }

  public getPatternMiner(): SkinSpacePatternMiner {
    return this.patternMiner;
  }

  public getAttentionEngine(): SkinSpaceAttentionEngine {
    return this.attentionEngine;
  }

  public getInferenceEngine(): SkinSpaceInferenceEngine {
    return this.inferenceEngine;
  }
}

// Type definitions for integration

export interface SkinSpaceInitResult {
  success: boolean;
  loadResult?: SkinSpaceLoadResult;
  initialPatterns?: {
    formulation: DiscoveredPattern[];
    supply: DiscoveredPattern[];
    substitution: DiscoveredPattern[];
  };
  initialInferences?: {
    supply: InferenceResult[];
    synergy: InferenceResult[];
  };
  statistics?: SkinSpaceStatistics;
  error?: string;
  processingTime: number;
}

export interface SkinSpaceQueryContext {
  focus?: 'ingredients' | 'products' | 'supply_chain' | 'formulation';
  ingredientIds?: string[];
  productIds?: string[];
  supplierIds?: string[];
}

export interface SkinSpaceQueryResult {
  query: string;
  focusedAtoms: Array<{
    id: string;
    name: string;
    type: string;
    truthValue: { strength: number; confidence: number; count: number };
    attentionValue: { sti: number; lti: number; vlti: number };
    properties: Record<string, any>;
  }>;
  attentionUpdate: AttentionUpdate;
  activationSpread: ActivationSpread;
  relevantPatterns: DiscoveredPattern[];
  inferences: InferenceResult[];
  recommendations: string[];
  processingTime: number;
}

export interface SkinSpaceIntegrationResult {
  mappedNodes: Array<{
    proofNodeId: string;
    skinAtomId: string;
    mappingConfidence: number;
  }>;
  mappedEdges: Array<{
    proofEdgeId: string;
    skinLinkId: string;
    mappingConfidence: number;
  }>;
  cognitiveInsights: string[];
  enhancedTruthValues: Map<string, { strength: number; confidence: number; count: number }>;
  attentionMappings: Map<string, { sti: number; lti: number; vlti: number }>;
}

export interface SkinSpaceEnhancedVerification {
  originalRequest: VerificationRequest;
  skinSpacePatterns: DiscoveredPattern[];
  supplyChainAnalysis: SupplyChainAnalysis;
  potentialIssues: PotentialIssue[];
  enhancedEvidence: Evidence[];
  cognitiveRecommendations: string[];
}

export interface SkinSpaceAnalytics {
  atomStatistics: SkinSpaceStatistics;
  networkCoverage: {
    rawNodes: number;
    rsNodes: number;
    overlappingIngredients: number;
  };
  discoveredPatterns: {
    formulation: number;
    supply: number;
    substitution: number;
  };
  attentionMetrics: {
    focusedAtoms: number;
    attentionSpread: number;
  };
  inferenceMetrics: {
    missingSupplyLinks: number;
    potentialSynergies: number;
  };
}

interface SupplyChainAnalysis {
  totalIngredients: number;
  suppliedIngredients: number;
  vulnerableIngredients: string[];
  supplierDiversity: Map<string, number>;
  riskScore: number;
}

interface PotentialIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedIngredients: string[];
  confidence: number;
}