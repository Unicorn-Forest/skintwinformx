/**
 * SkinSpace Cognitive Operations
 * 
 * OpenCog-inspired cognitive processes for the SkinSpace including:
 * - Pattern mining and learning
 * - Attention allocation and focus
 * - Inference and reasoning
 * - Knowledge discovery
 */

import type {
  SkinSpace,
  SkinAtom,
  SkinLink,
  TruthValue,
  AttentionValue,
  SkinAtomPattern
} from './skinspace-core';
import { SkinAtomType, SkinLinkType } from './skinspace-core';

/**
 * Pattern Learning Engine - discovers patterns in the SkinSpace
 */
export class SkinSpacePatternMiner {
  private skinSpace: SkinSpace;
  private patternCache: Map<string, DiscoveredPattern>;
  
  constructor(skinSpace: SkinSpace) {
    this.skinSpace = skinSpace;
    this.patternCache = new Map();
  }

  /**
   * Mine frequent patterns in ingredient-product relationships
   */
  public mineFormulationPatterns(minSupport: number = 0.1): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];
    
    // Get all Contains links (ingredient-product relationships)
    const containsLinks = this.skinSpace.getAtomsByType(SkinLinkType.CONTAINS_LINK) as SkinLink[];
    
    // Group ingredients by products
    const productIngredients = new Map<string, Set<string>>();
    for (const link of containsLinks) {
      const productId = link.outgoing[0];
      const ingredientId = link.outgoing[1];
      
      if (!productIngredients.has(productId)) {
        productIngredients.set(productId, new Set());
      }
      productIngredients.get(productId)!.add(ingredientId);
    }

    // Find frequent ingredient combinations
    const ingredientCombos = this.findFrequentItemsets(
      Array.from(productIngredients.values()),
      minSupport
    );

    // Convert to patterns
    for (const combo of ingredientCombos) {
      if (combo.items.length > 1) {
        const pattern: DiscoveredPattern = {
          id: `formulation_pattern_${Date.now()}_${Math.random()}`,
          type: 'formulation_synergy',
          atoms: combo.items,
          strength: combo.support,
          confidence: this.calculatePatternConfidence(combo, productIngredients),
          description: `Ingredients ${combo.items.map(id => this.getAtomName(id)).join(', ')} frequently co-occur in formulations`,
          frequency: combo.frequency,
          significance: this.calculateSignificance(combo.support, combo.items.length)
        };
        
        patterns.push(pattern);
        this.patternCache.set(pattern.id, pattern);
      }
    }

    return patterns.sort((a, b) => b.significance - a.significance);
  }

  /**
   * Mine supply chain vulnerability patterns
   */
  public mineSupplyChainPatterns(): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];
    
    // Get all supply relationships
    const supplyLinks = this.skinSpace.getAtomsByType(SkinLinkType.SUPPLIED_BY_LINK) as SkinLink[];
    
    // Find single-supplier dependencies
    const ingredientSuppliers = new Map<string, Set<string>>();
    for (const link of supplyLinks) {
      const ingredientId = link.outgoing[0];
      const supplierId = link.outgoing[1];
      
      if (!ingredientSuppliers.has(ingredientId)) {
        ingredientSuppliers.set(ingredientId, new Set());
      }
      ingredientSuppliers.get(ingredientId)!.add(supplierId);
    }

    // Find vulnerable ingredients (single supplier)
    const vulnerableIngredients: string[] = [];
    for (const [ingredientId, suppliers] of ingredientSuppliers) {
      if (suppliers.size === 1) {
        vulnerableIngredients.push(ingredientId);
      }
    }

    if (vulnerableIngredients.length > 0) {
      const pattern: DiscoveredPattern = {
        id: `supply_vulnerability_${Date.now()}`,
        type: 'supply_vulnerability',
        atoms: vulnerableIngredients,
        strength: vulnerableIngredients.length / ingredientSuppliers.size,
        confidence: 0.9, // High confidence in vulnerability assessment
        description: `${vulnerableIngredients.length} ingredients have single-supplier dependencies`,
        frequency: vulnerableIngredients.length,
        significance: this.calculateVulnerabilitySignificance(vulnerableIngredients)
      };
      
      patterns.push(pattern);
      this.patternCache.set(pattern.id, pattern);
    }

    return patterns;
  }

  /**
   * Mine ingredient substitution patterns
   */
  public mineSubstitutionPatterns(): DiscoveredPattern[] {
    const patterns: DiscoveredPattern[] = [];
    
    // Get ingredients by category/function
    const ingredientsByFunction = new Map<string, string[]>();
    const ingredients = this.skinSpace.getAtomsByType(SkinAtomType.INGREDIENT_NODE);
    
    for (const ingredient of ingredients) {
      const category = ingredient.properties.get('category') || 'unknown';
      if (!ingredientsByFunction.has(category)) {
        ingredientsByFunction.set(category, []);
      }
      ingredientsByFunction.get(category)!.push(ingredient.id);
    }

    // Find substitution groups
    for (const [category, ingredientIds] of ingredientsByFunction) {
      if (ingredientIds.length > 1) {
        const pattern: DiscoveredPattern = {
          id: `substitution_${category}_${Date.now()}`,
          type: 'substitution_group',
          atoms: ingredientIds,
          strength: this.calculateSubstitutionStrength(ingredientIds),
          confidence: 0.7, // Moderate confidence in functional similarity
          description: `${ingredientIds.length} ingredients in ${category} category may be substitutable`,
          frequency: ingredientIds.length,
          significance: this.calculateSubstitutionSignificance(ingredientIds)
        };
        
        patterns.push(pattern);
        this.patternCache.set(pattern.id, pattern);
      }
    }

    return patterns;
  }

  /**
   * Apply Apriori algorithm for frequent itemset mining
   */
  private findFrequentItemsets(transactions: Set<string>[], minSupport: number): FrequentItemset[] {
    const totalTransactions = transactions.length;
    const minFrequency = Math.ceil(minSupport * totalTransactions);
    
    // Generate 1-itemsets
    const itemCounts = new Map<string, number>();
    for (const transaction of transactions) {
      for (const item of transaction) {
        itemCounts.set(item, (itemCounts.get(item) || 0) + 1);
      }
    }

    let frequentItemsets: FrequentItemset[] = [];
    
    // Filter frequent 1-itemsets
    for (const [item, count] of itemCounts) {
      if (count >= minFrequency) {
        frequentItemsets.push({
          items: [item],
          frequency: count,
          support: count / totalTransactions
        });
      }
    }

    // Generate larger itemsets (simplified - only 2-itemsets for performance)
    const pairs = new Map<string, number>();
    for (const transaction of transactions) {
      const items = Array.from(transaction);
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pairKey = [items[i], items[j]].sort().join('|');
          pairs.set(pairKey, (pairs.get(pairKey) || 0) + 1);
        }
      }
    }

    for (const [pairKey, count] of pairs) {
      if (count >= minFrequency) {
        frequentItemsets.push({
          items: pairKey.split('|'),
          frequency: count,
          support: count / totalTransactions
        });
      }
    }

    return frequentItemsets;
  }

  private calculatePatternConfidence(
    combo: FrequentItemset,
    productIngredients: Map<string, Set<string>>
  ): number {
    // Calculate confidence as the conditional probability
    if (combo.items.length < 2) return combo.support;
    
    const [first, ...rest] = combo.items;
    let firstOccurrences = 0;
    let bothOccurrences = 0;

    for (const ingredients of productIngredients.values()) {
      if (ingredients.has(first)) {
        firstOccurrences++;
        if (rest.every(item => ingredients.has(item))) {
          bothOccurrences++;
        }
      }
    }

    return firstOccurrences > 0 ? bothOccurrences / firstOccurrences : 0;
  }

  private calculateSignificance(support: number, itemsetSize: number): number {
    // Higher significance for higher support and larger itemsets
    return support * Math.log(itemsetSize + 1);
  }

  private calculateVulnerabilitySignificance(vulnerableIngredients: string[]): number {
    // Calculate based on ingredient usage frequency in formulations
    const containsLinks = this.skinSpace.getAtomsByType(SkinLinkType.CONTAINS_LINK) as SkinLink[];
    let totalUsage = 0;
    
    for (const ingredientId of vulnerableIngredients) {
      const usage = containsLinks.filter(link => link.outgoing[1] === ingredientId).length;
      totalUsage += usage;
    }

    return totalUsage / Math.max(containsLinks.length, 1);
  }

  private calculateSubstitutionStrength(ingredientIds: string[]): number {
    // Simple calculation based on group size
    return Math.min(1, ingredientIds.length / 10);
  }

  private calculateSubstitutionSignificance(ingredientIds: string[]): number {
    return ingredientIds.length > 5 ? 0.8 : 0.4;
  }

  private getAtomName(atomId: string): string {
    const atom = this.skinSpace.getAtom(atomId);
    return atom ? atom.name : atomId;
  }

  /**
   * Get cached patterns
   */
  public getCachedPatterns(): DiscoveredPattern[] {
    return Array.from(this.patternCache.values());
  }
}

/**
 * Attention Allocation Engine - manages focus and relevance in SkinSpace
 */
export class SkinSpaceAttentionEngine {
  private skinSpace: SkinSpace;
  private focusHistory: FocusEvent[];
  private maxHistorySize: number = 1000;
  
  constructor(skinSpace: SkinSpace) {
    this.skinSpace = skinSpace;
    this.focusHistory = [];
  }

  /**
   * Update attention based on query context
   */
  public focusAttentionOnQuery(query: string, context: AttentionContext): AttentionUpdate {
    const relevantAtoms = this.findRelevantAtoms(query, context);
    const updates: Map<string, AttentionValue> = new Map();

    // Boost attention for relevant atoms
    for (const atom of relevantAtoms) {
      const currentAttention = atom.attentionValue;
      const boost = this.calculateAttentionBoost(atom, query, context);
      
      const newAttention: AttentionValue = {
        sti: Math.min(100, currentAttention.sti + boost.sti),
        lti: Math.min(100, currentAttention.lti + boost.lti),
        vlti: Math.min(1, currentAttention.vlti + boost.vlti)
      };

      updates.set(atom.id, newAttention);
      
      // Update the atom in skinSpace (this would need to be implemented)
      atom.attentionValue = newAttention;
    }

    // Decay attention for non-relevant atoms
    this.applyAttentionDecay(relevantAtoms.map(a => a.id));

    // Record focus event
    const focusEvent: FocusEvent = {
      timestamp: new Date(),
      query,
      context,
      affectedAtoms: relevantAtoms.map(a => a.id),
      totalBoost: Array.from(updates.values()).reduce((sum, av) => sum + av.sti, 0)
    };
    
    this.focusHistory.push(focusEvent);
    if (this.focusHistory.length > this.maxHistorySize) {
      this.focusHistory.shift();
    }

    return {
      updatedAtoms: updates.size,
      totalBoostApplied: focusEvent.totalBoost,
      focusedAtoms: relevantAtoms.map(a => ({ id: a.id, name: a.name, attention: a.attentionValue }))
    };
  }

  /**
   * Get atoms in current focus (high attention)
   */
  public getCurrentFocus(limit: number = 20): SkinAtom[] {
    return this.skinSpace.getFocusedAtoms(limit);
  }

  /**
   * Spread activation through the network
   */
  public spreadActivation(sourceAtomIds: string[], strength: number = 0.5): ActivationSpread {
    const activatedAtoms = new Map<string, number>();
    const queue: Array<{ atomId: string; activation: number; depth: number }> = [];
    
    // Initialize with source atoms
    for (const atomId of sourceAtomIds) {
      queue.push({ atomId, activation: strength, depth: 0 });
      activatedAtoms.set(atomId, strength);
    }

    const maxDepth = 3;
    const decayFactor = 0.7;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= maxDepth) continue;

      const atom = this.skinSpace.getAtom(current.atomId);
      if (!atom) continue;

      // Spread to connected atoms
      const connectedAtoms = this.skinSpace.getIncomingSet(current.atomId);
      connectedAtoms.push(...this.skinSpace.getOutgoingSet(current.atomId));

      for (const connectedAtom of connectedAtoms) {
        const newActivation = current.activation * decayFactor;
        const existingActivation = activatedAtoms.get(connectedAtom.id) || 0;
        
        if (newActivation > existingActivation && newActivation > 0.1) {
          activatedAtoms.set(connectedAtom.id, newActivation);
          queue.push({ 
            atomId: connectedAtom.id, 
            activation: newActivation, 
            depth: current.depth + 1 
          });
        }
      }
    }

    return {
      sourceAtoms: sourceAtomIds,
      activatedAtoms: new Map(activatedAtoms),
      totalActivation: Array.from(activatedAtoms.values()).reduce((sum, act) => sum + act, 0)
    };
  }

  private findRelevantAtoms(query: string, context: AttentionContext): SkinAtom[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const relevantAtoms: SkinAtom[] = [];

    // Find atoms by name matching
    for (const term of queryTerms) {
      const pattern: SkinAtomPattern = {
        namePattern: `.*${term}.*`,
        minStrength: 0.3
      };
      
      relevantAtoms.push(...this.skinSpace.patternMatch(pattern));
    }

    // Add context-specific atoms
    if (context.ingredientIds) {
      for (const id of context.ingredientIds) {
        const atom = this.skinSpace.getAtom(id);
        if (atom && !relevantAtoms.includes(atom)) {
          relevantAtoms.push(atom);
        }
      }
    }

    if (context.productIds) {
      for (const id of context.productIds) {
        const atom = this.skinSpace.getAtom(id);
        if (atom && !relevantAtoms.includes(atom)) {
          relevantAtoms.push(atom);
        }
      }
    }

    return relevantAtoms;
  }

  private calculateAttentionBoost(atom: SkinAtom, query: string, context: AttentionContext): AttentionValue {
    const baseBoost = 5;
    let multiplier = 1;

    // Boost based on atom type relevance
    switch (atom.type) {
      case SkinAtomType.INGREDIENT_NODE:
        multiplier = context.focus === 'ingredients' ? 2 : 1;
        break;
      case SkinAtomType.PRODUCT_NODE:
        multiplier = context.focus === 'products' ? 2 : 1;
        break;
      case SkinAtomType.SUPPLIER_NODE:
        multiplier = context.focus === 'supply_chain' ? 2 : 1;
        break;
    }

    // Boost based on truth value
    multiplier *= atom.truthValue.strength * atom.truthValue.confidence;

    return {
      sti: baseBoost * multiplier,
      lti: baseBoost * multiplier * 0.5,
      vlti: 0.05 * multiplier
    };
  }

  private applyAttentionDecay(excludeIds: string[]): void {
    const decayRate = 0.1;
    const excludeSet = new Set(excludeIds);

    // This is conceptual - would need proper implementation
    // Iterate through all atoms and apply decay
    for (const atom of this.skinSpace.getAtomsByType(SkinAtomType.INGREDIENT_NODE)) {
      if (!excludeSet.has(atom.id)) {
        atom.attentionValue = {
          sti: Math.max(-100, atom.attentionValue.sti - decayRate),
          lti: Math.max(-100, atom.attentionValue.lti - decayRate * 0.5),
          vlti: Math.max(0, atom.attentionValue.vlti - decayRate * 0.1)
        };
      }
    }
  }

  /**
   * Get attention focus history
   */
  public getFocusHistory(): FocusEvent[] {
    return [...this.focusHistory];
  }
}

/**
 * Inference Engine for SkinSpace reasoning
 */
export class SkinSpaceInferenceEngine {
  private skinSpace: SkinSpace;
  
  constructor(skinSpace: SkinSpace) {
    this.skinSpace = skinSpace;
  }

  /**
   * Infer missing supply relationships
   */
  public inferMissingSupplyLinks(): InferenceResult[] {
    const results: InferenceResult[] = [];
    
    // Find ingredients without suppliers
    const ingredients = this.skinSpace.getAtomsByType(SkinAtomType.INGREDIENT_NODE);
    const supplyLinks = this.skinSpace.getAtomsByType(SkinLinkType.SUPPLIED_BY_LINK) as SkinLink[];
    
    const suppliedIngredients = new Set(
      supplyLinks.map(link => link.outgoing[0])
    );

    for (const ingredient of ingredients) {
      if (!suppliedIngredients.has(ingredient.id)) {
        // Infer potential suppliers based on similar ingredients
        const potentialSuppliers = this.findPotentialSuppliers(ingredient);
        
        if (potentialSuppliers.length > 0) {
          results.push({
            type: 'missing_supply_link',
            confidence: 0.6,
            description: `Ingredient ${ingredient.name} lacks supply chain data`,
            recommendation: `Consider suppliers: ${potentialSuppliers.map(s => s.name).join(', ')}`,
            affectedAtoms: [ingredient.id, ...potentialSuppliers.map(s => s.id)],
            truthValue: { strength: 0.6, confidence: 0.5, count: 1 }
          });
        }
      }
    }

    return results;
  }

  /**
   * Infer ingredient synergies
   */
  public inferIngredientSynergies(): InferenceResult[] {
    const results: InferenceResult[] = [];
    
    // Find ingredients that frequently co-occur but lack explicit synergy links
    const patternMiner = new SkinSpacePatternMiner(this.skinSpace);
    const patterns = patternMiner.mineFormulationPatterns(0.3);
    
    for (const pattern of patterns) {
      if (pattern.type === 'formulation_synergy' && pattern.atoms.length === 2) {
        const [atom1Id, atom2Id] = pattern.atoms;
        
        // Check if synergy link already exists
        const existingSynergy = this.skinSpace.getAtomsByType(SkinLinkType.SYNERGIZES_LINK)
          .find(link => {
            const l = link as SkinLink;
            return (l.outgoing[0] === atom1Id && l.outgoing[1] === atom2Id) ||
                   (l.outgoing[0] === atom2Id && l.outgoing[1] === atom1Id);
          });

        if (!existingSynergy) {
          results.push({
            type: 'inferred_synergy',
            confidence: pattern.confidence,
            description: `Inferred synergy between ${this.getAtomName(atom1Id)} and ${this.getAtomName(atom2Id)}`,
            recommendation: `Consider creating synergy relationship`,
            affectedAtoms: pattern.atoms,
            truthValue: { 
              strength: pattern.strength, 
              confidence: pattern.confidence, 
              count: pattern.frequency 
            }
          });
        }
      }
    }

    return results;
  }

  private findPotentialSuppliers(ingredient: SkinAtom): SkinAtom[] {
    const suppliers = this.skinSpace.getAtomsByType(SkinAtomType.SUPPLIER_NODE);
    const category = ingredient.properties.get('category');
    
    if (!category) return suppliers.slice(0, 3); // Return first few if no category
    
    // Find suppliers that supply similar ingredients
    const supplyLinks = this.skinSpace.getAtomsByType(SkinLinkType.SUPPLIED_BY_LINK) as SkinLink[];
    const supplierScores = new Map<string, number>();
    
    for (const link of supplyLinks) {
      const suppliedIngredient = this.skinSpace.getAtom(link.outgoing[0]);
      const supplier = this.skinSpace.getAtom(link.outgoing[1]);
      
      if (suppliedIngredient && supplier && 
          suppliedIngredient.properties.get('category') === category) {
        const score = supplierScores.get(supplier.id) || 0;
        supplierScores.set(supplier.id, score + 1);
      }
    }

    return Array.from(supplierScores.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id]) => this.skinSpace.getAtom(id)!)
      .filter(Boolean);
  }

  private getAtomName(atomId: string): string {
    const atom = this.skinSpace.getAtom(atomId);
    return atom ? atom.name : atomId;
  }
}

// Type definitions for cognitive operations

export interface DiscoveredPattern {
  id: string;
  type: 'formulation_synergy' | 'supply_vulnerability' | 'substitution_group';
  atoms: string[];
  strength: number;
  confidence: number;
  description: string;
  frequency: number;
  significance: number;
}

interface FrequentItemset {
  items: string[];
  frequency: number;
  support: number;
}

export interface AttentionContext {
  focus: 'ingredients' | 'products' | 'supply_chain' | 'formulation';
  ingredientIds?: string[];
  productIds?: string[];
  supplierIds?: string[];
}

export interface AttentionUpdate {
  updatedAtoms: number;
  totalBoostApplied: number;
  focusedAtoms: Array<{ id: string; name: string; attention: AttentionValue }>;
}

interface FocusEvent {
  timestamp: Date;
  query: string;
  context: AttentionContext;
  affectedAtoms: string[];
  totalBoost: number;
}

export interface ActivationSpread {
  sourceAtoms: string[];
  activatedAtoms: Map<string, number>;
  totalActivation: number;
}

export interface InferenceResult {
  type: string;
  confidence: number;
  description: string;
  recommendation: string;
  affectedAtoms: string[];
  truthValue: TruthValue;
}