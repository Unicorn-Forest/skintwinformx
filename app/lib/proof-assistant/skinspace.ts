/**
 * SkinSpace Entry Point
 * 
 * Main export file for the OpenCog-inspired SkinSpace implementation.
 * Provides a unified interface to all SkinSpace functionality.
 */

// Core SkinSpace exports
export {
  SkinSpace,
  SkinAtom,
  SkinLink,
  SkinAtomType,
  SkinLinkType,
  SkinSpaceUtils,
  TruthValue,
  AttentionValue,
  SkinAtomPattern,
  SkinSpaceStatistics
} from './skinspace-core';

// Data adapter exports
export {
  SkinSpaceDataAdapter,
  VesselDataParser,
  SkinSpaceLoadResult,
  SkinSpaceLoadStatistics,
  RawNode,
  RawEdge,
  RSNode,
  RSEdge
} from './skinspace-adapters';

// Cognitive operations exports
export {
  SkinSpacePatternMiner,
  SkinSpaceAttentionEngine,
  SkinSpaceInferenceEngine,
  DiscoveredPattern,
  AttentionContext,
  AttentionUpdate,
  ActivationSpread,
  InferenceResult
} from './skinspace-cognition';

// Integration exports
export {
  SkinSpaceVessel,
  SkinSpaceInitResult,
  SkinSpaceQueryContext,
  SkinSpaceQueryResult,
  SkinSpaceIntegrationResult,
  SkinSpaceEnhancedVerification,
  SkinSpaceAnalytics
} from './skinspace-integration';

/**
 * Factory function to create and initialize a SkinSpace vessel
 * with vessel data from the file system or API
 */
export async function createSkinSpaceFromVesselData(
  vesselDataPath: string = '/vessels/examples'
): Promise<SkinSpaceVessel> {
  const vessel = new SkinSpaceVessel();
  
  // In a real implementation, this would load data from files
  // For now, return the uninitialized vessel
  console.warn('SkinSpace vessel created but not initialized. Call initializeFromVesselData() with CSV content.');
  
  return vessel;
}

/**
 * Factory function to create a SkinSpace vessel with sample data for testing
 */
export async function createSampleSkinSpace(): Promise<SkinSpaceVessel> {
  const vessel = new SkinSpaceVessel();

  // Sample RAW data (products and ingredients)
  const sampleRawNodes = `Id	Label	timeset	modularity_class
B19PRDSPAMRM000	SpaZone Marine Replenish Masque		
B19PRDSPAORM000	SpaZone Overnight Regenerative Masque		
B19PRDSPAAFO000	SpaZone Active Facial Oil		
B19PRDSPAIFL000	SpaZone Instant Facial Lift Wonder Serum		
B19PRODZNERN000	Rejuvoderm Night Maintenance		
R010000	Water		
R010001	Glycerin		
R010002	Hyaluronic Acid		
R010003	Vitamin C		
R010004	Niacinamide		`;

  const sampleRawEdges = `Source	Target	Type	Id	Label	timeset	Weight
R010000	B19PRDSPAMRM000	Directed	1			65.6000
R010001	B19PRDSPAMRM000	Directed	2			5.0000
R010002	B19PRDSPAMRM000	Directed	3			0.8000
R010000	B19PRDSPAORM000	Directed	4			64.2000
R010003	B19PRDSPAIFL000	Directed	5			15.0000
R010004	B19PRODZNERN000	Directed	6			3.0000`;

  // Sample RS data (suppliers and supply relationships)
  const sampleRSNodes = `Id	Label	timeset	modularity_class
06A0001	06 Agencies		1
AEC001	A&E Connock		2
AKU001	AECI		3
BOT0003	Botanichem		4
R010001	Glycerin		
R010002	Hyaluronic Acid		
R010003	Vitamin C		`;

  const sampleRSEdges = `Source	Target	Type	Id	Label	timeset	Weight
R010001	06A0001	Directed	1			1
R010002	AEC001	Directed	2			1
R010003	AKU001	Directed	3			1
R010004	BOT0003	Directed	4			1`;

  const result = await vessel.initializeFromVesselData(
    sampleRawNodes,
    sampleRawEdges,
    sampleRSNodes,
    sampleRSEdges
  );

  if (!result.success) {
    throw new Error(`Failed to initialize sample SkinSpace: ${result.error}`);
  }

  return vessel;
}

/**
 * Utility functions for common SkinSpace operations
 */
export class SkinSpaceHelpers {
  /**
   * Create a formulation analysis from ingredients list
   */
  public static async analyzeFormulation(
    vessel: SkinSpaceVessel,
    ingredientNames: string[]
  ): Promise<{
    patterns: DiscoveredPattern[];
    synergies: InferenceResult[];
    recommendations: string[];
  }> {
    // Query for each ingredient
    const allPatterns: DiscoveredPattern[] = [];
    const allSynergies: InferenceResult[] = [];
    const allRecommendations: string[] = [];

    for (const ingredientName of ingredientNames) {
      const result = await vessel.query(`formulation with ${ingredientName}`, {
        focus: 'ingredients'
      });

      allPatterns.push(...result.relevantPatterns);
      allSynergies.push(...result.inferences.filter(inf => inf.type === 'inferred_synergy'));
      allRecommendations.push(...result.recommendations);
    }

    // Deduplicate and sort by significance/confidence
    const uniquePatterns = Array.from(
      new Map(allPatterns.map(p => [p.id, p])).values()
    ).sort((a, b) => b.significance - a.significance);

    const uniqueSynergies = Array.from(
      new Map(allSynergies.map(s => [s.description, s])).values()
    ).sort((a, b) => b.confidence - a.confidence);

    const uniqueRecommendations = Array.from(new Set(allRecommendations));

    return {
      patterns: uniquePatterns,
      synergies: uniqueSynergies,
      recommendations: uniqueRecommendations
    };
  }

  /**
   * Analyze supply chain risks for a formulation
   */
  public static async analyzeSupplyChainRisks(
    vessel: SkinSpaceVessel,
    ingredientNames: string[]
  ): Promise<{
    riskScore: number;
    vulnerableIngredients: string[];
    supplierDiversity: number;
    recommendations: string[];
  }> {
    const result = await vessel.query(`supply chain analysis for ${ingredientNames.join(', ')}`, {
      focus: 'supply_chain'
    });

    const analytics = vessel.getAnalytics();
    
    // Calculate overall risk metrics
    const vulnerableIngredients = result.inferences
      .filter(inf => inf.type === 'missing_supply_link')
      .map(inf => inf.description);

    const supplierPatterns = result.relevantPatterns
      .filter(p => p.type === 'supply_vulnerability');

    const riskScore = supplierPatterns.length > 0 
      ? supplierPatterns[0].strength 
      : vulnerableIngredients.length / ingredientNames.length;

    return {
      riskScore,
      vulnerableIngredients,
      supplierDiversity: analytics.networkCoverage.rsNodes,
      recommendations: result.recommendations.filter(rec => 
        rec.toLowerCase().includes('supply') || rec.toLowerCase().includes('risk')
      )
    };
  }

  /**
   * Find alternative ingredients for substitution
   */
  public static async findAlternatives(
    vessel: SkinSpaceVessel,
    targetIngredient: string,
    functionalCategory?: string
  ): Promise<{
    alternatives: string[];
    substitutionGroups: DiscoveredPattern[];
    confidence: number;
  }> {
    const result = await vessel.query(`alternatives for ${targetIngredient}`, {
      focus: 'ingredients'
    });

    const substitutionPatterns = result.relevantPatterns
      .filter(p => p.type === 'substitution_group');

    const alternatives: string[] = [];
    let totalConfidence = 0;

    for (const pattern of substitutionPatterns) {
      for (const atomId of pattern.atoms) {
        const atom = vessel.getSkinSpace().getAtom(atomId);
        if (atom && atom.name !== targetIngredient) {
          if (!functionalCategory || 
              atom.properties.get('category')?.includes(functionalCategory)) {
            alternatives.push(atom.name);
            totalConfidence += pattern.confidence;
          }
        }
      }
    }

    const avgConfidence = alternatives.length > 0 
      ? totalConfidence / alternatives.length 
      : 0;

    return {
      alternatives: Array.from(new Set(alternatives)),
      substitutionGroups: substitutionPatterns,
      confidence: avgConfidence
    };
  }

  /**
   * Generate formulation optimization suggestions
   */
  public static async optimizeFormulation(
    vessel: SkinSpaceVessel,
    currentIngredients: string[],
    targetEffects: string[]
  ): Promise<{
    additions: string[];
    removals: string[];
    modifications: Array<{ ingredient: string; newConcentration: number; reason: string }>;
    reasoning: string[];
  }> {
    const result = await vessel.query(
      `optimize formulation with ${currentIngredients.join(', ')} for ${targetEffects.join(', ')}`,
      { focus: 'formulation' }
    );

    const synergyPatterns = result.relevantPatterns
      .filter(p => p.type === 'formulation_synergy');

    const additions: string[] = [];
    const removals: string[] = [];
    const modifications: Array<{ ingredient: string; newConcentration: number; reason: string }> = [];
    const reasoning: string[] = [];

    // Analyze synergy patterns for additions
    for (const pattern of synergyPatterns) {
      const patternIngredients = pattern.atoms
        .map(atomId => vessel.getSkinSpace().getAtom(atomId)?.name)
        .filter(Boolean) as string[];

      const missingFromFormulation = patternIngredients
        .filter(ing => !currentIngredients.includes(ing));

      if (missingFromFormulation.length > 0 && 
          patternIngredients.some(ing => currentIngredients.includes(ing))) {
        additions.push(...missingFromFormulation);
        reasoning.push(pattern.description);
      }
    }

    // Add recommendations from the query result
    for (const rec of result.recommendations) {
      reasoning.push(rec);
    }

    return {
      additions: Array.from(new Set(additions)),
      removals,
      modifications,
      reasoning
    };
  }
}

/**
 * Export version information
 */
export const SKINSPACE_VERSION = '1.0.0';
export const SKINSPACE_BUILD = Date.now().toString();

/**
 * Default configuration for SkinSpace
 */
export const DEFAULT_SKINSPACE_CONFIG = {
  patternMining: {
    minSupport: 0.1,
    maxPatterns: 100
  },
  attention: {
    decayRate: 0.1,
    focusThreshold: 0.5,
    maxFocusedAtoms: 20
  },
  inference: {
    confidenceThreshold: 0.6,
    maxInferences: 50
  },
  truthValue: {
    defaultStrength: 0.5,
    defaultConfidence: 0.5,
    evidenceWeight: 0.8
  }
};