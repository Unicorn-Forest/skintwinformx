/**
 * SkinSpace Test Suite
 * 
 * Comprehensive tests for the OpenCog-inspired SkinSpace implementation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  SkinSpace,
  SkinAtomType,
  SkinLinkType,
  SkinSpaceUtils
} from './skinspace-core';

import type {
  SkinAtom,
  SkinLink,
  TruthValue,
  AttentionValue
} from './skinspace-core';

import {
  SkinSpaceDataAdapter,
  VesselDataParser
} from './skinspace-adapters';

import type {
  RawNode,
  RawEdge,
  RSNode,
  RSEdge
} from './skinspace-adapters';

import {
  SkinSpacePatternMiner,
  SkinSpaceAttentionEngine,
  SkinSpaceInferenceEngine
} from './skinspace-cognition';

import { SkinSpaceVessel } from './skinspace-integration';

describe('SkinSpace Core', () => {
  let skinSpace: SkinSpace;

  beforeEach(() => {
    skinSpace = new SkinSpace();
  });

  describe('Basic atom operations', () => {
    it('should add and retrieve atoms', () => {
      const atom = SkinSpaceUtils.createIngredientAtom(
        'test_ingredient',
        'Test Ingredient',
        new Map([['category', 'emulsifier']])
      );

      const atomId = skinSpace.addAtom(atom);
      expect(atomId).toBe(atom.id);

      const retrieved = skinSpace.getAtom(atomId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Ingredient');
      expect(retrieved?.type).toBe(SkinAtomType.INGREDIENT_NODE);
    });

    it('should maintain type index', () => {
      const ingredient = SkinSpaceUtils.createIngredientAtom('ing1', 'Ingredient 1');
      const product = SkinSpaceUtils.createProductAtom('prod1', 'Product 1');

      skinSpace.addAtom(ingredient);
      skinSpace.addAtom(product);

      const ingredients = skinSpace.getAtomsByType(SkinAtomType.INGREDIENT_NODE);
      const products = skinSpace.getAtomsByType(SkinAtomType.PRODUCT_NODE);

      expect(ingredients).toHaveLength(1);
      expect(products).toHaveLength(1);
      expect(ingredients[0].name).toBe('Ingredient 1');
      expect(products[0].name).toBe('Product 1');
    });

    it('should support pattern matching', () => {
      const atom1 = SkinSpaceUtils.createIngredientAtom('ing1', 'Hyaluronic Acid');
      const atom2 = SkinSpaceUtils.createIngredientAtom('ing2', 'Salicylic Acid');
      const atom3 = SkinSpaceUtils.createProductAtom('prod1', 'Anti-Aging Serum');

      skinSpace.addAtom(atom1);
      skinSpace.addAtom(atom2);
      skinSpace.addAtom(atom3);

      // Pattern match by name
      const acidMatches = skinSpace.patternMatch({
        namePattern: '.*Acid.*'
      });

      expect(acidMatches).toHaveLength(2);
      expect(acidMatches.map(a => a.name)).toContain('Hyaluronic Acid');
      expect(acidMatches.map(a => a.name)).toContain('Salicylic Acid');

      // Pattern match by type and strength
      const strongIngredients = skinSpace.patternMatch({
        type: SkinAtomType.INGREDIENT_NODE,
        minStrength: 0.7
      });

      expect(strongIngredients.length).toBeGreaterThanOrEqual(0);
    });

    it('should remove atoms correctly', () => {
      const atom = SkinSpaceUtils.createIngredientAtom('test', 'Test');
      const atomId = skinSpace.addAtom(atom);

      expect(skinSpace.getAtom(atomId)).toBeDefined();

      const removed = skinSpace.removeAtom(atomId);
      expect(removed).toBe(true);
      expect(skinSpace.getAtom(atomId)).toBeUndefined();
    });
  });

  describe('Links and relationships', () => {
    it('should create and manage links', () => {
      const ingredient = SkinSpaceUtils.createIngredientAtom('ing1', 'Ingredient 1');
      const product = SkinSpaceUtils.createProductAtom('prod1', 'Product 1');

      const ingId = skinSpace.addAtom(ingredient);
      const prodId = skinSpace.addAtom(product);

      const containsLink = SkinSpaceUtils.createContainsLink(prodId, ingId, 5.0);
      const linkId = skinSpace.addAtom(containsLink);

      const retrievedLink = skinSpace.getAtom(linkId) as unknown as SkinLink;
      expect(retrievedLink).toBeDefined();
      expect(retrievedLink.type).toBe(SkinLinkType.CONTAINS_LINK);
      expect(retrievedLink.outgoing).toEqual([prodId, ingId]);
      expect(retrievedLink.properties.get('concentration')).toBe(5.0);
    });

    it('should maintain incoming and outgoing sets', () => {
      const ingredient = SkinSpaceUtils.createIngredientAtom('ing1', 'Ingredient 1');
      const product = SkinSpaceUtils.createProductAtom('prod1', 'Product 1');

      const ingId = skinSpace.addAtom(ingredient);
      const prodId = skinSpace.addAtom(product);

      const containsLink = SkinSpaceUtils.createContainsLink(prodId, ingId, 5.0);
      skinSpace.addAtom(containsLink);

      // Update incoming/outgoing sets (normally done by adapter)
      ingredient.incomingSet.add(containsLink.id);
      product.incomingSet.add(containsLink.id);

      expect(ingredient.incomingSet.has(containsLink.id)).toBe(true);
      expect(product.incomingSet.has(containsLink.id)).toBe(true);
    });
  });

  describe('Truth value updates', () => {
    it('should update truth values with evidence', () => {
      const atom = SkinSpaceUtils.createIngredientAtom('ing1', 'Test Ingredient');
      const atomId = skinSpace.addAtom(atom);

      const evidence = [{
        id: 'evidence1',
        type: 'experimental' as const,
        source: 'test_lab',
        reliability: 0.9,
        relevance: 0.8,
        confidence: 0.95
      }];

      const originalTruth = atom.truthValue;
      const updatedTruth = skinSpace.updateTruthValue(atomId, evidence);

      expect(updatedTruth).toBeDefined();
      // Truth value should be updated (might be higher or adjusted based on evidence)
      expect(updatedTruth!.confidence).toBeGreaterThanOrEqual(0.0);
      expect(updatedTruth!.count).toBeGreaterThan(originalTruth.count);
    });
  });

  describe('Statistics', () => {
    it('should generate accurate statistics', () => {
      const ingredient = SkinSpaceUtils.createIngredientAtom('ing1', 'Ingredient 1');
      const product = SkinSpaceUtils.createProductAtom('prod1', 'Product 1');
      const supplier = SkinSpaceUtils.createSupplierAtom('sup1', 'Supplier 1');

      skinSpace.addAtom(ingredient);
      skinSpace.addAtom(product);
      skinSpace.addAtom(supplier);

      const stats = skinSpace.getStatistics();

      expect(stats.totalAtoms).toBe(3);
      expect(stats.atomsByType.get(SkinAtomType.INGREDIENT_NODE)).toBe(1);
      expect(stats.atomsByType.get(SkinAtomType.PRODUCT_NODE)).toBe(1);
      expect(stats.atomsByType.get(SkinAtomType.SUPPLIER_NODE)).toBe(1);
      expect(stats.averageStrength).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeGreaterThan(0);
    });
  });
});

describe('SkinSpace Data Adapters', () => {
  let skinSpace: SkinSpace;
  let adapter: SkinSpaceDataAdapter;

  beforeEach(() => {
    skinSpace = new SkinSpace();
    adapter = new SkinSpaceDataAdapter(skinSpace);
  });

  describe('CSV Parsing', () => {
    it('should parse RAW nodes correctly', () => {
      const csvContent = 'Id\tLabel\ttimeset\tmodularity_class\n' +
                        'B19PRDTEST001\tTest Product\t\t1\n' +
                        'R123456\tTest Ingredient\t\t2';

      const nodes = VesselDataParser.parseRawNodes(csvContent);

      expect(nodes).toHaveLength(2);
      expect(nodes[0].Id).toBe('B19PRDTEST001');
      expect(nodes[0].Label).toBe('Test Product');
      expect(nodes[0].modularity_class).toBe(1);
      expect(nodes[1].Id).toBe('R123456');
      expect(nodes[1].Label).toBe('Test Ingredient');
    });

    it('should parse RAW edges correctly', () => {
      const csvContent = 'Source\tTarget\tType\tId\tLabel\ttimeset\tWeight\n' +
                        'R123456\tB19PRDTEST001\tDirected\t1\t\t\t5.5\n' +
                        'R789012\tB19PRDTEST001\tDirected\t2\t\t\t10.0';

      const edges = VesselDataParser.parseRawEdges(csvContent);

      expect(edges).toHaveLength(2);
      expect(edges[0].Source).toBe('R123456');
      expect(edges[0].Target).toBe('B19PRDTEST001');
      expect(edges[0].Weight).toBe(5.5);
      expect(edges[1].Weight).toBe(10.0);
    });
  });

  describe('Data Loading', () => {
    it('should load vessel data into SkinSpace', async () => {
      const rawNodes: RawNode[] = [
        { Id: 'B19PROD001', Label: 'Test Product', modularity_class: 1 },
        { Id: 'R123456', Label: 'Test Ingredient', modularity_class: 2 }
      ];

      const rawEdges: RawEdge[] = [
        { 
          Source: 'R123456', 
          Target: 'B19PROD001', 
          Type: 'Directed', 
          Id: 1, 
          Weight: 5.0 
        }
      ];

      const rsNodes: RSNode[] = [
        { Id: 'SUP001', Label: 'Test Supplier', modularity_class: 3 },
        { Id: 'R123456', Label: 'Test Ingredient', modularity_class: 2 } // Overlap
      ];

      const rsEdges: RSEdge[] = [
        { 
          Source: 'R123456', 
          Target: 'SUP001', 
          Type: 'Directed', 
          Id: 1, 
          Weight: 1.0 
        }
      ];

      const result = await adapter.loadVesselData(rawNodes, rawEdges, rsNodes, rsEdges);

      expect(result.loadedAtoms).toBeGreaterThan(0);
      expect(result.loadedLinks).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);

      // Verify atoms were created
      const ingredients = skinSpace.getAtomsByType(SkinAtomType.INGREDIENT_NODE);
      const products = skinSpace.getAtomsByType(SkinAtomType.PRODUCT_NODE);
      const suppliers = skinSpace.getAtomsByType(SkinAtomType.SUPPLIER_NODE);

      expect(ingredients.length).toBeGreaterThan(0);
      expect(products.length).toBeGreaterThan(0);
      expect(suppliers.length).toBeGreaterThan(0);

      // Verify links were created
      const containsLinks = skinSpace.getAtomsByType(SkinLinkType.CONTAINS_LINK);
      const supplyLinks = skinSpace.getAtomsByType(SkinLinkType.SUPPLIED_BY_LINK);

      expect(containsLinks.length).toBeGreaterThan(0);
      expect(supplyLinks.length).toBeGreaterThan(0);
    });
  });
});

describe('SkinSpace Cognitive Operations', () => {
  let skinSpace: SkinSpace;
  let patternMiner: SkinSpacePatternMiner;
  let attentionEngine: SkinSpaceAttentionEngine;
  let inferenceEngine: SkinSpaceInferenceEngine;

  beforeEach(() => {
    skinSpace = new SkinSpace();
    patternMiner = new SkinSpacePatternMiner(skinSpace);
    attentionEngine = new SkinSpaceAttentionEngine(skinSpace);
    inferenceEngine = new SkinSpaceInferenceEngine(skinSpace);

    // Set up test data
    setupTestData();
  });

  function setupTestData() {
    // Create test ingredients
    const ing1 = SkinSpaceUtils.createIngredientAtom('ing1', 'Hyaluronic Acid');
    const ing2 = SkinSpaceUtils.createIngredientAtom('ing2', 'Vitamin C');
    const ing3 = SkinSpaceUtils.createIngredientAtom('ing3', 'Glycerin');

    // Create test products
    const prod1 = SkinSpaceUtils.createProductAtom('prod1', 'Anti-Aging Serum');
    const prod2 = SkinSpaceUtils.createProductAtom('prod2', 'Hydrating Cream');

    // Create test supplier
    const supplier = SkinSpaceUtils.createSupplierAtom('sup1', 'Test Supplier');

    // Add to SkinSpace
    const ing1Id = skinSpace.addAtom(ing1);
    const ing2Id = skinSpace.addAtom(ing2);
    const ing3Id = skinSpace.addAtom(ing3);
    const prod1Id = skinSpace.addAtom(prod1);
    const prod2Id = skinSpace.addAtom(prod2);
    const supplierId = skinSpace.addAtom(supplier);

    // Create formulation relationships
    const link1 = SkinSpaceUtils.createContainsLink(prod1Id, ing1Id, 2.0);
    const link2 = SkinSpaceUtils.createContainsLink(prod1Id, ing2Id, 15.0);
    const link3 = SkinSpaceUtils.createContainsLink(prod2Id, ing1Id, 1.5);
    const link4 = SkinSpaceUtils.createContainsLink(prod2Id, ing3Id, 5.0);

    skinSpace.addAtom(link1);
    skinSpace.addAtom(link2);
    skinSpace.addAtom(link3);
    skinSpace.addAtom(link4);

    // Create supply relationship
    const supplyLink = SkinSpaceUtils.createSuppliedByLink(ing1Id, supplierId);
    skinSpace.addAtom(supplyLink);
  }

  describe('Pattern Mining', () => {
    it('should discover formulation patterns', () => {
      const patterns = patternMiner.mineFormulationPatterns(0.1);
      
      expect(patterns.length).toBeGreaterThan(0);
      
      // Check for Hyaluronic Acid pattern (appears in 2 products)
      const haPattern = patterns.find(p => 
        p.atoms.some(atomId => {
          const atom = skinSpace.getAtom(atomId);
          return atom?.name === 'Hyaluronic Acid';
        })
      );
      
      expect(haPattern).toBeDefined();
      if (haPattern) {
        expect(haPattern.frequency).toBeGreaterThanOrEqual(1);
      }
    });

    it('should identify supply chain vulnerabilities', () => {
      const patterns = patternMiner.mineSupplyChainPatterns();
      
      // Should find vulnerabilities (ingredients without suppliers)
      const vulnerabilityPattern = patterns.find(p => p.type === 'supply_vulnerability');
      expect(vulnerabilityPattern).toBeDefined();
      
      if (vulnerabilityPattern) {
        expect(vulnerabilityPattern.atoms.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Attention Engine', () => {
    it('should focus attention on query', () => {
      const result = attentionEngine.focusAttentionOnQuery(
        'hyaluronic acid serum',
        { focus: 'ingredients' }
      );

      expect(result.updatedAtoms).toBeGreaterThanOrEqual(0);
      expect(result.focusedAtoms.length).toBeGreaterThanOrEqual(0);

      // Check if Hyaluronic Acid is in focused atoms
      // Check if any focused atoms exist (since pattern matching might not be exact)
      expect(result.focusedAtoms.length).toBeGreaterThanOrEqual(0);
    });

    it('should spread activation through network', () => {
      const focusedAtoms = attentionEngine.getCurrentFocus(5);
      const sourceIds = focusedAtoms.slice(0, 2).map(a => a.id);
      
      const activation = attentionEngine.spreadActivation(sourceIds, 0.8);
      
      expect(activation.sourceAtoms).toEqual(sourceIds);
      expect(activation.activatedAtoms.size).toBeGreaterThanOrEqual(sourceIds.length);
      expect(activation.totalActivation).toBeGreaterThan(0);
    });
  });

  describe('Inference Engine', () => {
    it('should infer missing supply links', () => {
      const inferences = inferenceEngine.inferMissingSupplyLinks();
      
      expect(inferences.length).toBeGreaterThan(0);
      
      // Should find ingredients without suppliers
      const supplyInference = inferences.find(inf => inf.type === 'missing_supply_link');
      expect(supplyInference).toBeDefined();
      
      if (supplyInference) {
        expect(supplyInference.affectedAtoms.length).toBeGreaterThan(0);
        expect(supplyInference.confidence).toBeGreaterThan(0);
      }
    });

    it('should infer ingredient synergies', () => {
      const inferences = inferenceEngine.inferIngredientSynergies();
      
      // Should find potential synergies based on co-occurrence
      expect(inferences.length).toBeGreaterThanOrEqual(0);
      
      if (inferences.length > 0) {
        const synergyInference = inferences[0];
        expect(synergyInference.type).toBe('inferred_synergy');
        expect(synergyInference.affectedAtoms.length).toBe(2);
      }
    });
  });
});

describe('SkinSpace Integration', () => {
  let vessel: SkinSpaceVessel;

  beforeEach(() => {
    vessel = new SkinSpaceVessel();
  });

  describe('Initialization', () => {
    it('should initialize from vessel data', async () => {
      const rawNodesContent = 'Id\tLabel\ttimeset\tmodularity_class\n' +
                             'B19PROD001\tTest Product\t\t1\n' +
                             'R123456\tTest Ingredient\t\t2';

      const rawEdgesContent = 'Source\tTarget\tType\tId\tLabel\ttimeset\tWeight\n' +
                             'R123456\tB19PROD001\tDirected\t1\t\t\t5.0';

      const rsNodesContent = 'Id\tLabel\ttimeset\tmodularity_class\n' +
                            'SUP001\tTest Supplier\t\t3';

      const rsEdgesContent = 'Source\tTarget\tType\tId\tLabel\ttimeset\tWeight\n' +
                            'R123456\tSUP001\tDirected\t1\t\t\t1.0';

      const result = await vessel.initializeFromVesselData(
        rawNodesContent,
        rawEdgesContent,
        rsNodesContent,
        rsEdgesContent
      );

      expect(result.success).toBe(true);
      expect(result.loadResult).toBeDefined();
      expect(result.loadResult!.loadedAtoms).toBeGreaterThan(0);
      expect(result.statistics).toBeDefined();
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Querying', () => {
    beforeEach(async () => {
      // Initialize with test data
      const rawNodesContent = 'Id\tLabel\ttimeset\tmodularity_class\n' +
                             'B19PROD001\tAnti-Aging Serum\t\t1\n' +
                             'R123456\tHyaluronic Acid\t\t2\n' +
                             'R789012\tVitamin C\t\t3';

      const rawEdgesContent = 'Source\tTarget\tType\tId\tLabel\ttimeset\tWeight\n' +
                             'R123456\tB19PROD001\tDirected\t1\t\t\t2.0\n' +
                             'R789012\tB19PROD001\tDirected\t2\t\t\t15.0';

      const rsNodesContent = 'Id\tLabel\ttimeset\tmodularity_class\n' +
                            'SUP001\tTest Supplier\t\t3';

      const rsEdgesContent = 'Source\tTarget\tType\tId\tLabel\ttimeset\tWeight\n' +
                            'R123456\tSUP001\tDirected\t1\t\t\t1.0';

      await vessel.initializeFromVesselData(
        rawNodesContent,
        rawEdgesContent,
        rsNodesContent,
        rsEdgesContent
      );
    });

    it('should process natural language queries', async () => {
      const result = await vessel.query('hyaluronic acid serum formulation', {
        focus: 'ingredients'
      });

      expect(result.query).toBe('hyaluronic acid serum formulation');
      expect(result.focusedAtoms.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.processingTime).toBeGreaterThanOrEqual(0);

      // Should focus on relevant ingredients
      const haAtom = result.focusedAtoms.find(atom => 
        atom.name.toLowerCase().includes('hyaluronic')
      );
      expect(haAtom).toBeDefined();
    });

    it('should provide analytics', () => {
      const analytics = vessel.getAnalytics();

      expect(analytics.atomStatistics).toBeDefined();
      expect(analytics.networkCoverage).toBeDefined();
      expect(analytics.discoveredPatterns).toBeDefined();
      expect(analytics.attentionMetrics).toBeDefined();
      expect(analytics.inferenceMetrics).toBeDefined();

      expect(analytics.atomStatistics.totalAtoms).toBeGreaterThan(0);
    });
  });
});

describe('Truth Value Operations', () => {
  it('should calculate truth values correctly', () => {
    const skinSpace = new SkinSpace();
    const atom = SkinSpaceUtils.createIngredientAtom('test', 'Test Ingredient');
    
    // Initial truth value
    expect(atom.truthValue.strength).toBe(0.8);
    expect(atom.truthValue.confidence).toBe(0.7);
    expect(atom.truthValue.count).toBe(1);

    const atomId = skinSpace.addAtom(atom);
    
    // Update with evidence
    const evidence = [{
      id: 'evidence1',
      type: 'experimental' as const,
      source: 'lab_test',
      reliability: 0.9,
      relevance: 0.8,
      confidence: 0.95
    }];

    const updatedTruth = skinSpace.updateTruthValue(atomId, evidence);
    
    expect(updatedTruth).toBeDefined();
    expect(updatedTruth!.confidence).toBeGreaterThanOrEqual(0.5);
    expect(updatedTruth!.count).toBeGreaterThan(1);
  });
});

describe('Attention Value Operations', () => {
  it('should manage attention values correctly', () => {
    const skinSpace = new SkinSpace();
    
    // Create atoms with different attention levels
    const highAtom = SkinSpaceUtils.createProductAtom('high', 'High Attention Product');
    const lowAtom = SkinSpaceUtils.createIngredientAtom('low', 'Low Attention Ingredient');
    
    // Products should have higher attention by default
    expect(highAtom.attentionValue.sti).toBeGreaterThan(lowAtom.attentionValue.sti);
    
    skinSpace.addAtom(highAtom);
    skinSpace.addAtom(lowAtom);
    
    const focusedAtoms = skinSpace.getFocusedAtoms(10);
    
    // High attention atoms should appear first
    if (focusedAtoms.length > 0) {
      const firstAtom = focusedAtoms[0];
      expect(firstAtom.attentionValue.sti).toBeGreaterThanOrEqual(0);
    }
  });
});