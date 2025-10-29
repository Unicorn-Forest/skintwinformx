/**
 * SkinSpace Usage Examples
 * 
 * Comprehensive examples demonstrating how to use the OpenCog-inspired SkinSpace
 * for skincare formulation analysis and supply chain management.
 */

import type {
  DiscoveredPattern,
  InferenceResult
} from './skinspace-cognition';
import {
  SkinSpaceVessel,
  createSampleSkinSpace,
  SkinSpaceHelpers,
  createSkinSpaceFromVesselData
} from './skinspace';

/**
 * Example 1: Basic SkinSpace initialization and querying
 */
export async function basicSkinSpaceExample(): Promise<void> {
  console.log('=== Basic SkinSpace Example ===');

  // Create a sample SkinSpace with test data
  const vessel = await createSampleSkinSpace();
  
  // Get analytics to see what's in our SkinSpace
  const analytics = vessel.getAnalytics();
  console.log('SkinSpace Analytics:', {
    totalAtoms: analytics.atomStatistics.totalAtoms,
    networkCoverage: analytics.networkCoverage,
    discoveredPatterns: analytics.discoveredPatterns
  });

  // Query for ingredient information
  const result = await vessel.query('hyaluronic acid serum formulation', {
    focus: 'ingredients'
  });

  console.log('Query Results:');
  console.log('- Focused Atoms:', result.focusedAtoms.length);
  console.log('- Relevant Patterns:', result.relevantPatterns.length);
  console.log('- Inferences:', result.inferences.length);
  console.log('- Recommendations:', result.recommendations);
}

/**
 * Example 2: Formulation analysis using SkinSpace patterns
 */
export async function formulationAnalysisExample(): Promise<void> {
  console.log('\n=== Formulation Analysis Example ===');

  const vessel = await createSampleSkinSpace();
  
  // Analyze a specific formulation
  const ingredients = ['Hyaluronic Acid', 'Vitamin C', 'Niacinamide'];
  const analysis = await SkinSpaceHelpers.analyzeFormulation(vessel, ingredients);

  console.log('Formulation Analysis Results:');
  console.log('- Discovered Patterns:', analysis.patterns.length);
  
  for (const pattern of analysis.patterns.slice(0, 3)) {
    console.log(`  * ${pattern.type}: ${pattern.description} (confidence: ${pattern.confidence.toFixed(2)})`);
  }

  console.log('- Synergy Inferences:', analysis.synergies.length);
  for (const synergy of analysis.synergies.slice(0, 2)) {
    console.log(`  * ${synergy.description} (confidence: ${synergy.confidence.toFixed(2)})`);
  }

  console.log('- Recommendations:', analysis.recommendations.slice(0, 3));
}

/**
 * Example 3: Supply chain risk analysis
 */
export async function supplyChainAnalysisExample(): Promise<void> {
  console.log('\n=== Supply Chain Analysis Example ===');

  const vessel = await createSampleSkinSpace();
  
  // Analyze supply chain risks for a formulation
  const ingredients = ['Water', 'Glycerin', 'Hyaluronic Acid', 'Vitamin C'];
  const riskAnalysis = await SkinSpaceHelpers.analyzeSupplyChainRisks(vessel, ingredients);

  console.log('Supply Chain Risk Analysis:');
  console.log('- Overall Risk Score:', (riskAnalysis.riskScore * 100).toFixed(1) + '%');
  console.log('- Supplier Diversity:', riskAnalysis.supplierDiversity);
  console.log('- Vulnerable Ingredients:', riskAnalysis.vulnerableIngredients);
  console.log('- Risk Mitigation Recommendations:');
  
  for (const recommendation of riskAnalysis.recommendations) {
    console.log(`  * ${recommendation}`);
  }
}

/**
 * Example 4: Finding ingredient alternatives
 */
export async function ingredientAlternativesExample(): Promise<void> {
  console.log('\n=== Ingredient Alternatives Example ===');

  const vessel = await createSampleSkinSpace();
  
  // Find alternatives for a specific ingredient
  const targetIngredient = 'Hyaluronic Acid';
  const alternatives = await SkinSpaceHelpers.findAlternatives(
    vessel, 
    targetIngredient,
    'moisturizer' // functional category
  );

  console.log(`Alternatives for ${targetIngredient}:`);
  console.log('- Alternative Ingredients:', alternatives.alternatives);
  console.log('- Substitution Confidence:', (alternatives.confidence * 100).toFixed(1) + '%');
  console.log('- Substitution Groups Found:', alternatives.substitutionGroups.length);
  
  for (const group of alternatives.substitutionGroups.slice(0, 2)) {
    console.log(`  * ${group.description}`);
  }
}

/**
 * Example 5: Formulation optimization
 */
export async function formulationOptimizationExample(): Promise<void> {
  console.log('\n=== Formulation Optimization Example ===');

  const vessel = await createSampleSkinSpace();
  
  // Optimize an existing formulation
  const currentIngredients = ['Water', 'Glycerin', 'Hyaluronic Acid'];
  const targetEffects = ['anti-aging', 'hydration', 'skin barrier repair'];
  
  const optimization = await SkinSpaceHelpers.optimizeFormulation(
    vessel,
    currentIngredients,
    targetEffects
  );

  console.log('Formulation Optimization Results:');
  console.log('- Suggested Additions:', optimization.additions);
  console.log('- Suggested Removals:', optimization.removals);
  console.log('- Modifications:', optimization.modifications.length);
  
  console.log('- Optimization Reasoning:');
  for (const reason of optimization.reasoning.slice(0, 3)) {
    console.log(`  * ${reason}`);
  }
}

/**
 * Example 6: Advanced pattern mining and cognitive insights
 */
export async function advancedPatternMiningExample(): Promise<void> {
  console.log('\n=== Advanced Pattern Mining Example ===');

  const vessel = await createSampleSkinSpace();
  
  // Get the pattern miner for more detailed analysis
  const patternMiner = vessel.getPatternMiner();
  
  // Mine different types of patterns
  const formulationPatterns = patternMiner.mineFormulationPatterns(0.05);
  const supplyPatterns = patternMiner.mineSupplyChainPatterns();
  const substitutionPatterns = patternMiner.mineSubstitutionPatterns();

  console.log('Advanced Pattern Analysis:');
  console.log('- Formulation Patterns:', formulationPatterns.length);
  
  // Show top patterns by significance
  const topPatterns = formulationPatterns
    .sort((a, b) => b.significance - a.significance)
    .slice(0, 3);
    
  for (const pattern of topPatterns) {
    console.log(`  * ${pattern.description}`);
    console.log(`    Strength: ${pattern.strength.toFixed(3)}, Significance: ${pattern.significance.toFixed(3)}`);
  }

  console.log('- Supply Chain Vulnerabilities:', supplyPatterns.length);
  for (const pattern of supplyPatterns) {
    console.log(`  * ${pattern.description} (${pattern.atoms.length} affected ingredients)`);
  }

  console.log('- Substitution Groups:', substitutionPatterns.length);
  for (const pattern of substitutionPatterns.slice(0, 2)) {
    console.log(`  * ${pattern.description}`);
  }
}

/**
 * Example 7: Attention and cognitive focus
 */
export async function attentionFocusExample(): Promise<void> {
  console.log('\n=== Attention & Cognitive Focus Example ===');

  const vessel = await createSkinSpaceFromVesselData();
  
  // Initialize with sample data
  await vessel.initializeFromVesselData(
    'Id\tLabel\ttimeset\tmodularity_class\nR001\tHyaluronic Acid\t\t1\nR002\tVitamin C\t\t2\nB001\tAnti-Aging Serum\t\t3',
    'Source\tTarget\tType\tId\tLabel\ttimeset\tWeight\nR001\tB001\tDirected\t1\t\t\t2.0\nR002\tB001\tDirected\t2\t\t\t15.0',
    'Id\tLabel\ttimeset\tmodularity_class\nSUP001\tTest Supplier\t\t1',
    'Source\tTarget\tType\tId\tLabel\ttimeset\tWeight\nR001\tSUP001\tDirected\t1\t\t\t1'
  );

  const attentionEngine = vessel.getAttentionEngine();
  
  // Focus attention on specific query
  const attentionUpdate = attentionEngine.focusAttentionOnQuery(
    'vitamin c anti-aging serum stability',
    { focus: 'ingredients' }
  );

  console.log('Attention Focus Results:');
  console.log('- Updated Atoms:', attentionUpdate.updatedAtoms);
  console.log('- Total Attention Boost:', attentionUpdate.totalBoostApplied);
  console.log('- Currently Focused Atoms:');
  
  for (const atom of attentionUpdate.focusedAtoms.slice(0, 3)) {
    console.log(`  * ${atom.name} (STI: ${atom.attention.sti}, LTI: ${atom.attention.lti})`);
  }

  // Demonstrate activation spreading
  const focusedIds = attentionUpdate.focusedAtoms.slice(0, 2).map(a => a.id);
  const activation = attentionEngine.spreadActivation(focusedIds, 0.8);

  console.log('- Activation Spread:');
  console.log(`  Source atoms: ${activation.sourceAtoms.length}`);
  console.log(`  Activated atoms: ${activation.activatedAtoms.size}`);
  console.log(`  Total activation: ${activation.totalActivation.toFixed(2)}`);
}

/**
 * Example 8: Integration with existing hypergraph proof system
 */
export async function hypergraphIntegrationExample(): Promise<void> {
  console.log('\n=== Hypergraph Integration Example ===');

  const vessel = await createSampleSkinSpace();
  
  // Create a mock proof hypergraph (normally would come from proof assistant)
  const mockProofGraph = {
    nodes: [
      {
        id: 'proof_node_1',
        type: 'ingredient' as const,
        properties: new Map<string, any>([
          ['label', 'Hyaluronic Acid'],
          ['concentration', 2.0]
        ]),
        relevanceScore: 0.8
      },
      {
        id: 'proof_node_2', 
        type: 'effect' as const,
        properties: new Map<string, any>([
          ['label', 'Hydration'],
          ['magnitude', 0.7]
        ]),
        relevanceScore: 0.6
      }
    ],
    hyperedges: [],
    analysis: {
      connectivity: 0.5,
      clustering: 0.3,
      criticalPaths: [],
      vulnerabilities: [],
      opportunities: []
    }
  };

  // Integrate with SkinSpace
  const integration = vessel.integrateWithProofHypergraph(
    mockProofGraph,
    'anti-aging formulation verification'
  );

  console.log('Hypergraph Integration Results:');
  console.log('- Mapped Nodes:', integration.mappedNodes.length);
  console.log('- Enhanced Truth Values:', integration.enhancedTruthValues.size);
  console.log('- Cognitive Insights:', integration.cognitiveInsights);

  for (const mapping of integration.mappedNodes) {
    console.log(`  * Proof node ${mapping.proofNodeId} → SkinSpace atom ${mapping.skinAtomId}`);
    console.log(`    Mapping confidence: ${(mapping.mappingConfidence * 100).toFixed(1)}%`);
  }
}

/**
 * Run all examples
 */
export async function runAllSkinSpaceExamples(): Promise<void> {
  console.log('🧠 SkinSpace: OpenCog-Inspired Knowledge Representation for Skincare\n');
  
  try {
    await basicSkinSpaceExample();
    await formulationAnalysisExample();
    await supplyChainAnalysisExample();
    await ingredientAlternativesExample();
    await formulationOptimizationExample();
    await advancedPatternMiningExample();
    await attentionFocusExample();
    await hypergraphIntegrationExample();
    
    console.log('\n✅ All SkinSpace examples completed successfully!');
    
  } catch (error) {
    console.error('❌ Error running SkinSpace examples:', error);
  }
}

// If running as a script
if (typeof require !== 'undefined' && require.main === module) {
  runAllSkinSpaceExamples().catch(console.error);
}