/**
 * SkinSpace: OpenCog-inspired unified knowledge representation
 * 
 * Implements a unified SkinSpace analogous to OpenCog's AtomSpace for mapping
 * RAW-Nodes, RAW-Edges, RSNodes, and RSEdges into a coherent knowledge base
 * for skincare formulation reasoning and supply chain analysis.
 */

import type {
  ProofNode,
  ProofHyperedge,
  Evidence,
} from './types';

/**
 * OpenCog-inspired Atom types for SkinSpace
 */
export interface SkinAtom {
  id: string;
  type: SkinAtomType;
  name: string;
  truthValue: TruthValue;
  attentionValue: AttentionValue;
  properties: Map<string, any>;
  incomingSet: Set<string>; // References to SkinLinks that reference this atom
  outgoingSet: Set<string>; // For compound atoms, references to contained atoms
}

export interface SkinLink extends SkinAtom {
  type: SkinLinkType;
  arity: number;
  outgoing: string[]; // Array of atom IDs this link connects
}

/**
 * OpenCog-inspired truth values with strength and confidence
 */
export interface TruthValue {
  strength: number;    // [0, 1] - degree of truth
  confidence: number;  // [0, 1] - confidence in the truth value
  count: number;       // Evidence count supporting this truth value
}

/**
 * OpenCog-inspired attention values for cognitive focus
 */
export interface AttentionValue {
  sti: number;         // Short-term importance [-100, 100]
  lti: number;         // Long-term importance [-100, 100]
  vlti: number;        // Very long-term importance [0, 1]
}

/**
 * Atom types in SkinSpace (analogous to OpenCog atom types)
 */
export enum SkinAtomType {
  // Basic node types
  INGREDIENT_NODE = 'IngredientNode',
  PRODUCT_NODE = 'ProductNode', 
  SUPPLIER_NODE = 'SupplierNode',
  FORMULATION_NODE = 'FormulationNode',
  EFFECT_NODE = 'EffectNode',
  CONCENTRATION_NODE = 'ConcentrationNode',
  
  // Procedural nodes
  SCHEMA_NODE = 'SchemaNode',
  PREDICATE_NODE = 'PredicateNode',
  
  // Abstract nodes
  CONCEPT_NODE = 'ConceptNode',
  VARIABLE_NODE = 'VariableNode',
}

/**
 * Link types in SkinSpace (analogous to OpenCog link types)
 */
export enum SkinLinkType {
  // Basic links
  INHERITANCE_LINK = 'InheritanceLink',
  SIMILARITY_LINK = 'SimilarityLink',
  
  // Logical links
  AND_LINK = 'AndLink',
  OR_LINK = 'OrLink',
  NOT_LINK = 'NotLink',
  IMPLICATION_LINK = 'ImplicationLink',
  
  // Evaluative links
  EVALUATION_LINK = 'EvaluationLink',
  MEMBER_LINK = 'MemberLink',
  SUBSET_LINK = 'SubsetLink',
  
  // Domain-specific links
  CONTAINS_LINK = 'ContainsLink',        // Product contains Ingredient
  SUPPLIED_BY_LINK = 'SuppliedByLink',   // Ingredient supplied by Supplier
  SYNERGIZES_LINK = 'SynergizesLink',    // Ingredient synergizes with Ingredient
  COMPETES_LINK = 'CompetesLink',        // Ingredient competes with Ingredient
  CONCENTRATION_LINK = 'ConcentrationLink', // Ingredient at Concentration
  EFFECT_LINK = 'EffectLink',            // Ingredient produces Effect
}

/**
 * SkinSpace: The main knowledge container analogous to OpenCog's AtomSpace
 */
export class SkinSpace {
  private atoms: Map<string, SkinAtom>;
  private typeIndex: Map<SkinAtomType | SkinLinkType, Set<string>>;
  private nameIndex: Map<string, Set<string>>;
  private attentionBank: AttentionBank;
  private truthValueUpdater: TruthValueUpdater;
  
  constructor() {
    this.atoms = new Map();
    this.typeIndex = new Map();
    this.nameIndex = new Map();
    this.attentionBank = new AttentionBank();
    this.truthValueUpdater = new TruthValueUpdater();
  }

  /**
   * Add an atom to SkinSpace
   */
  public addAtom(atom: SkinAtom): string {
    this.atoms.set(atom.id, atom);
    
    // Update type index
    if (!this.typeIndex.has(atom.type)) {
      this.typeIndex.set(atom.type, new Set());
    }
    this.typeIndex.get(atom.type)!.add(atom.id);
    
    // Update name index
    if (!this.nameIndex.has(atom.name)) {
      this.nameIndex.set(atom.name, new Set());
    }
    this.nameIndex.get(atom.name)!.add(atom.id);
    
    // Register with attention bank
    this.attentionBank.addAtom(atom.id, atom.attentionValue);
    
    return atom.id;
  }

  /**
   * Get atom by ID
   */
  public getAtom(id: string): SkinAtom | undefined {
    return this.atoms.get(id);
  }

  /**
   * Get all atoms of a specific type
   */
  public getAtomsByType(type: SkinAtomType | SkinLinkType): SkinAtom[] {
    const ids = this.typeIndex.get(type) || new Set();
    return Array.from(ids).map(id => this.atoms.get(id)!).filter(Boolean);
  }

  /**
   * Get atoms by name pattern
   */
  public getAtomsByName(name: string): SkinAtom[] {
    const ids = this.nameIndex.get(name) || new Set();
    return Array.from(ids).map(id => this.atoms.get(id)!).filter(Boolean);
  }

  /**
   * Remove atom from SkinSpace
   */
  public removeAtom(id: string): boolean {
    const atom = this.atoms.get(id);
    if (!atom) return false;

    // Remove from indices
    this.typeIndex.get(atom.type)?.delete(id);
    this.nameIndex.get(atom.name)?.delete(id);
    
    // Remove from attention bank
    this.attentionBank.removeAtom(id);
    
    // Remove from atom map
    this.atoms.delete(id);
    
    return true;
  }

  /**
   * Update truth value for an atom
   */
  public updateTruthValue(atomId: string, evidence: Evidence[]): TruthValue | null {
    const atom = this.atoms.get(atomId);
    if (!atom) return null;

    const newTruthValue = this.truthValueUpdater.update(atom.truthValue, evidence);
    atom.truthValue = newTruthValue;
    
    return newTruthValue;
  }

  /**
   * Get incoming set for an atom (atoms that reference this atom)
   */
  public getIncomingSet(atomId: string): SkinAtom[] {
    const atom = this.atoms.get(atomId);
    if (!atom) return [];

    return Array.from(atom.incomingSet)
      .map(id => this.atoms.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get outgoing set for a link (atoms this link references)
   */
  public getOutgoingSet(linkId: string): SkinAtom[] {
    const link = this.atoms.get(linkId) as SkinLink;
    if (!link || !('outgoing' in link)) return [];

    return link.outgoing
      .map(id => this.atoms.get(id)!)
      .filter(Boolean);
  }

  /**
   * Pattern matching: find atoms matching a given pattern
   */
  public patternMatch(pattern: SkinAtomPattern): SkinAtom[] {
    let candidates = Array.from(this.atoms.values());

    // Filter by type
    if (pattern.type) {
      candidates = candidates.filter(atom => atom.type === pattern.type);
    }

    // Filter by name pattern
    if (pattern.namePattern) {
      const regex = new RegExp(pattern.namePattern);
      candidates = candidates.filter(atom => regex.test(atom.name));
    }

    // Filter by truth value threshold
    if (pattern.minStrength !== undefined) {
      candidates = candidates.filter(atom => atom.truthValue.strength >= pattern.minStrength!);
    }

    // Filter by attention threshold
    if (pattern.minAttention !== undefined) {
      candidates = candidates.filter(atom => atom.attentionValue.sti >= pattern.minAttention!);
    }

    return candidates;
  }

  /**
   * Get focused atoms based on attention values
   */
  public getFocusedAtoms(limit: number = 10): SkinAtom[] {
    return this.attentionBank.getTopAtoms(limit)
      .map(id => this.atoms.get(id)!)
      .filter(Boolean);
  }

  /**
   * Get statistics about the SkinSpace
   */
  public getStatistics(): SkinSpaceStatistics {
    const typeStats = new Map<string, number>();
    
    for (const atom of this.atoms.values()) {
      const count = typeStats.get(atom.type) || 0;
      typeStats.set(atom.type, count + 1);
    }

    return {
      totalAtoms: this.atoms.size,
      atomsByType: typeStats,
      averageStrength: this.calculateAverageStrength(),
      averageConfidence: this.calculateAverageConfidence(),
      attentionSpread: this.attentionBank.getAttentionSpread(),
    };
  }

  private calculateAverageStrength(): number {
    const strengths = Array.from(this.atoms.values()).map(atom => atom.truthValue.strength);
    return strengths.reduce((sum, s) => sum + s, 0) / strengths.length || 0;
  }

  private calculateAverageConfidence(): number {
    const confidences = Array.from(this.atoms.values()).map(atom => atom.truthValue.confidence);
    return confidences.reduce((sum, c) => sum + c, 0) / confidences.length || 0;
  }
}

/**
 * Pattern interface for atom matching
 */
export interface SkinAtomPattern {
  type?: SkinAtomType | SkinLinkType;
  namePattern?: string;
  minStrength?: number;
  minAttention?: number;
  properties?: Map<string, any>;
}

/**
 * Statistics interface for SkinSpace
 */
export interface SkinSpaceStatistics {
  totalAtoms: number;
  atomsByType: Map<string, number>;
  averageStrength: number;
  averageConfidence: number;
  attentionSpread: number;
}

/**
 * Attention Bank: Manages attention allocation across atoms
 */
class AttentionBank {
  private attentionValues: Map<string, AttentionValue>;
  private focusedAtoms: Set<string>;
  
  constructor() {
    this.attentionValues = new Map();
    this.focusedAtoms = new Set();
  }

  public addAtom(atomId: string, attention: AttentionValue): void {
    this.attentionValues.set(atomId, { ...attention });
    
    if (attention.sti > 0) {
      this.focusedAtoms.add(atomId);
    }
  }

  public removeAtom(atomId: string): void {
    this.attentionValues.delete(atomId);
    this.focusedAtoms.delete(atomId);
  }

  public updateAttention(atomId: string, delta: Partial<AttentionValue>): void {
    const current = this.attentionValues.get(atomId);
    if (!current) return;

    const updated: AttentionValue = {
      sti: current.sti + (delta.sti || 0),
      lti: current.lti + (delta.lti || 0),
      vlti: Math.max(0, Math.min(1, current.vlti + (delta.vlti || 0))),
    };

    this.attentionValues.set(atomId, updated);

    if (updated.sti > 0) {
      this.focusedAtoms.add(atomId);
    } else {
      this.focusedAtoms.delete(atomId);
    }
  }

  public getTopAtoms(limit: number): string[] {
    return Array.from(this.attentionValues.entries())
      .sort(([, a], [, b]) => b.sti - a.sti)
      .slice(0, limit)
      .map(([id]) => id);
  }

  public getAttentionSpread(): number {
    const values = Array.from(this.attentionValues.values());
    if (values.length === 0) return 0;

    const stiValues = values.map(av => av.sti);
    const max = Math.max(...stiValues);
    const min = Math.min(...stiValues);
    
    return max - min;
  }
}

/**
 * Truth Value Updater: Updates truth values based on new evidence
 */
class TruthValueUpdater {
  public update(current: TruthValue, evidence: Evidence[]): TruthValue {
    if (evidence.length === 0) return current;

    // Simple Bayesian-inspired update
    let totalStrength = current.strength * current.count;
    let totalCount = current.count;

    for (const ev of evidence) {
      const evidenceStrength = this.evidenceToStrength(ev);
      const evidenceWeight = ev.reliability * ev.relevance;
      
      totalStrength += evidenceStrength * evidenceWeight;
      totalCount += evidenceWeight;
    }

    const newStrength = totalCount > 0 ? totalStrength / totalCount : current.strength;
    const newConfidence = Math.min(1, totalCount / (totalCount + 1));

    return {
      strength: Math.max(0, Math.min(1, newStrength)),
      confidence: Math.max(0, Math.min(1, newConfidence)),
      count: totalCount,
    };
  }

  private evidenceToStrength(evidence: Evidence): number {
    // Convert evidence confidence to strength
    // This is a simplified mapping - could be more sophisticated
    return evidence.confidence;
  }
}

/**
 * Utility functions for creating common atom types
 */
export class SkinSpaceUtils {
  public static createIngredientAtom(
    id: string,
    name: string,
    properties: Map<string, any> = new Map()
  ): SkinAtom {
    return {
      id: `ingredient_${id}`,
      type: SkinAtomType.INGREDIENT_NODE,
      name,
      truthValue: { strength: 0.8, confidence: 0.7, count: 1 },
      attentionValue: { sti: 0, lti: 0, vlti: 0.1 },
      properties,
      incomingSet: new Set(),
      outgoingSet: new Set(),
    };
  }

  public static createProductAtom(
    id: string,
    name: string,
    properties: Map<string, any> = new Map()
  ): SkinAtom {
    return {
      id: `product_${id}`,
      type: SkinAtomType.PRODUCT_NODE,
      name,
      truthValue: { strength: 0.9, confidence: 0.8, count: 1 },
      attentionValue: { sti: 5, lti: 2, vlti: 0.2 },
      properties,
      incomingSet: new Set(),
      outgoingSet: new Set(),
    };
  }

  public static createSupplierAtom(
    id: string,
    name: string,
    properties: Map<string, any> = new Map()
  ): SkinAtom {
    return {
      id: `supplier_${id}`,
      type: SkinAtomType.SUPPLIER_NODE,
      name,
      truthValue: { strength: 0.7, confidence: 0.6, count: 1 },
      attentionValue: { sti: -2, lti: 5, vlti: 0.3 },
      properties,
      incomingSet: new Set(),
      outgoingSet: new Set(),
    };
  }

  public static createContainsLink(
    productId: string,
    ingredientId: string,
    concentration: number
  ): SkinLink {
    return {
      id: `contains_${productId}_${ingredientId}`,
      type: SkinLinkType.CONTAINS_LINK,
      name: `Contains`,
      arity: 2,
      outgoing: [productId, ingredientId],
      truthValue: { strength: 0.95, confidence: 0.9, count: 1 },
      attentionValue: { sti: 2, lti: 1, vlti: 0.1 },
      properties: new Map([['concentration', concentration]]),
      incomingSet: new Set(),
      outgoingSet: new Set(),
    };
  }

  public static createSuppliedByLink(
    ingredientId: string,
    supplierId: string
  ): SkinLink {
    return {
      id: `supplied_by_${ingredientId}_${supplierId}`,
      type: SkinLinkType.SUPPLIED_BY_LINK,
      name: `SuppliedBy`,
      arity: 2,
      outgoing: [ingredientId, supplierId],
      truthValue: { strength: 0.8, confidence: 0.7, count: 1 },
      attentionValue: { sti: 1, lti: 3, vlti: 0.2 },
      properties: new Map(),
      incomingSet: new Set(),
      outgoingSet: new Set(),
    };
  }
}