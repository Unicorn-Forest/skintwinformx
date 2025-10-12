/**
 * SkinSpace Data Adapters
 * 
 * Adapters for mapping RAW-Nodes, RAW-Edges, RSNodes, RSEdges 
 * from the vessels data into the unified SkinSpace knowledge representation.
 */

import type { 
  SkinSpace, 
  SkinAtom, 
  SkinLink, 
  TruthValue,
  AttentionValue 
} from './skinspace-core';
import { SkinSpaceUtils, SkinAtomType, SkinLinkType } from './skinspace-core';

/**
 * Raw data structures from CSV files
 */
export interface RawNode {
  Id: string;
  Label: string;
  timeset?: string;
  modularity_class?: number;
}

export interface RawEdge {
  Source: string;
  Target: string;
  Type: string;
  Id: number;
  Label?: string;
  timeset?: string;
  Weight: number;
}

export interface RSNode {
  Id: string;
  Label: string;
  timeset?: string;
  modularity_class?: number;
}

export interface RSEdge {
  Source: string;
  Target: string;
  Type: string;
  Id: number;
  Label?: string;
  timeset?: string;
  Weight: number;
}

/**
 * SkinSpace data loader and mapper
 */
export class SkinSpaceDataAdapter {
  private skinSpace: SkinSpace;
  private nodeIdMapping: Map<string, string>; // Original ID -> SkinSpace ID
  
  constructor(skinSpace: SkinSpace) {
    this.skinSpace = skinSpace;
    this.nodeIdMapping = new Map();
  }

  /**
   * Load all vessel data into SkinSpace
   */
  public async loadVesselData(
    rawNodes: RawNode[],
    rawEdges: RawEdge[],
    rsNodes: RSNode[],
    rsEdges: RSEdge[]
  ): Promise<SkinSpaceLoadResult> {
    const startTime = Date.now();
    const results: SkinSpaceLoadResult = {
      loadedAtoms: 0,
      loadedLinks: 0,
      skippedNodes: 0,
      skippedEdges: 0,
      errors: [],
      processingTime: 0
    };

    try {
      // Step 1: Load RAW nodes (products and ingredients from formulation network)
      const rawNodeResults = await this.loadRawNodes(rawNodes);
      results.loadedAtoms += rawNodeResults.loaded;
      results.skippedNodes += rawNodeResults.skipped;
      results.errors.push(...rawNodeResults.errors);

      // Step 2: Load RS nodes (suppliers and ingredients from supply chain)
      const rsNodeResults = await this.loadRSNodes(rsNodes);
      results.loadedAtoms += rsNodeResults.loaded;
      results.skippedNodes += rsNodeResults.skipped;
      results.errors.push(...rsNodeResults.errors);

      // Step 3: Load RAW edges (formulation relationships)
      const rawEdgeResults = await this.loadRawEdges(rawEdges);
      results.loadedLinks += rawEdgeResults.loaded;
      results.skippedEdges += rawEdgeResults.skipped;
      results.errors.push(...rawEdgeResults.errors);

      // Step 4: Load RS edges (supply relationships)
      const rsEdgeResults = await this.loadRSEdges(rsEdges);
      results.loadedLinks += rsEdgeResults.loaded;
      results.skippedEdges += rsEdgeResults.skipped;
      results.errors.push(...rsEdgeResults.errors);

      results.processingTime = Date.now() - startTime;
      return results;

    } catch (error) {
      results.errors.push(`Critical loading error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.processingTime = Date.now() - startTime;
      return results;
    }
  }

  /**
   * Load RAW nodes (products and ingredients from formulation network)
   */
  private async loadRawNodes(rawNodes: RawNode[]): Promise<LoadResult> {
    const result: LoadResult = { loaded: 0, skipped: 0, errors: [] };

    for (const node of rawNodes) {
      try {
        const skinAtom = this.mapRawNodeToSkinAtom(node);
        if (skinAtom) {
          const atomId = this.skinSpace.addAtom(skinAtom);
          this.nodeIdMapping.set(node.Id, atomId);
          result.loaded++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(`Failed to load RAW node ${node.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.skipped++;
      }
    }

    return result;
  }

  /**
   * Load RS nodes (suppliers and ingredients from supply chain)
   */
  private async loadRSNodes(rsNodes: RSNode[]): Promise<LoadResult> {
    const result: LoadResult = { loaded: 0, skipped: 0, errors: [] };

    for (const node of rsNodes) {
      try {
        const skinAtom = this.mapRSNodeToSkinAtom(node);
        if (skinAtom) {
          // Check if we already have this node from RAW data
          const existingId = this.nodeIdMapping.get(node.Id);
          if (existingId) {
            // Merge with existing atom
            this.mergeNodeData(existingId, node);
            result.loaded++;
          } else {
            const atomId = this.skinSpace.addAtom(skinAtom);
            this.nodeIdMapping.set(node.Id, atomId);
            result.loaded++;
          }
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(`Failed to load RS node ${node.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.skipped++;
      }
    }

    return result;
  }

  /**
   * Load RAW edges (formulation relationships)
   */
  private async loadRawEdges(rawEdges: RawEdge[]): Promise<LoadResult> {
    const result: LoadResult = { loaded: 0, skipped: 0, errors: [] };

    for (const edge of rawEdges) {
      try {
        const skinLink = this.mapRawEdgeToSkinLink(edge);
        if (skinLink) {
          this.skinSpace.addAtom(skinLink);
          this.updateIncomingOutgoingSets(skinLink);
          result.loaded++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(`Failed to load RAW edge ${edge.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.skipped++;
      }
    }

    return result;
  }

  /**
   * Load RS edges (supply relationships)
   */
  private async loadRSEdges(rsEdges: RSEdge[]): Promise<LoadResult> {
    const result: LoadResult = { loaded: 0, skipped: 0, errors: [] };

    for (const edge of rsEdges) {
      try {
        const skinLink = this.mapRSEdgeToSkinLink(edge);
        if (skinLink) {
          this.skinSpace.addAtom(skinLink);
          this.updateIncomingOutgoingSets(skinLink);
          result.loaded++;
        } else {
          result.skipped++;
        }
      } catch (error) {
        result.errors.push(`Failed to load RS edge ${edge.Id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.skipped++;
      }
    }

    return result;
  }

  /**
   * Map RAW node to SkinSpace atom
   */
  private mapRawNodeToSkinAtom(node: RawNode): SkinAtom | null {
    const properties = new Map<string, any>();
    
    if (node.timeset) properties.set('timeset', node.timeset);
    if (node.modularity_class) properties.set('modularity_class', node.modularity_class);
    properties.set('source_network', 'RAW');

    // Determine node type based on ID pattern
    if (node.Id.startsWith('B19')) {
      // Product node
      return SkinSpaceUtils.createProductAtom(node.Id, node.Label, properties);
    } else if (node.Id.startsWith('R')) {
      // Ingredient node
      return SkinSpaceUtils.createIngredientAtom(node.Id, node.Label, properties);
    } else {
      // Unknown node type - create as concept node
      return {
        id: `concept_${node.Id}`,
        type: SkinAtomType.CONCEPT_NODE,
        name: node.Label,
        truthValue: { strength: 0.5, confidence: 0.3, count: 1 },
        attentionValue: { sti: -5, lti: 0, vlti: 0.05 },
        properties,
        incomingSet: new Set(),
        outgoingSet: new Set(),
      };
    }
  }

  /**
   * Map RS node to SkinSpace atom
   */
  private mapRSNodeToSkinAtom(node: RSNode): SkinAtom | null {
    const properties = new Map<string, any>();
    
    if (node.timeset) properties.set('timeset', node.timeset);
    if (node.modularity_class) properties.set('modularity_class', node.modularity_class);
    properties.set('source_network', 'RS');

    // Determine node type based on ID pattern
    if (node.Id.startsWith('R')) {
      // Ingredient node (might already exist from RAW)
      return SkinSpaceUtils.createIngredientAtom(node.Id, node.Label, properties);
    } else {
      // Supplier node
      return SkinSpaceUtils.createSupplierAtom(node.Id, node.Label, properties);
    }
  }

  /**
   * Map RAW edge to SkinSpace link
   */
  private mapRawEdgeToSkinLink(edge: RawEdge): SkinLink | null {
    const sourceAtomId = this.nodeIdMapping.get(edge.Source);
    const targetAtomId = this.nodeIdMapping.get(edge.Target);

    if (!sourceAtomId || !targetAtomId) {
      return null; // Skip edges with missing nodes
    }

    const properties = new Map<string, any>();
    properties.set('weight', edge.Weight);
    properties.set('concentration', edge.Weight); // Weight represents concentration in RAW data
    properties.set('source_network', 'RAW');
    if (edge.Label) properties.set('label', edge.Label);
    if (edge.timeset) properties.set('timeset', edge.timeset);

    // RAW edges represent formulation relationships (ingredient -> product)
    return {
      id: `raw_edge_${edge.Id}`,
      type: SkinLinkType.CONTAINS_LINK,
      name: 'Contains',
      arity: 2,
      outgoing: [targetAtomId, sourceAtomId], // Product contains Ingredient
      truthValue: this.calculateTruthValueFromWeight(edge.Weight, 'formulation'),
      attentionValue: this.calculateAttentionFromWeight(edge.Weight, 'formulation'),
      properties,
      incomingSet: new Set(),
      outgoingSet: new Set(),
    };
  }

  /**
   * Map RS edge to SkinSpace link
   */
  private mapRSEdgeToSkinLink(edge: RSEdge): SkinLink | null {
    const sourceAtomId = this.nodeIdMapping.get(edge.Source);
    const targetAtomId = this.nodeIdMapping.get(edge.Target);

    if (!sourceAtomId || !targetAtomId) {
      return null; // Skip edges with missing nodes
    }

    const properties = new Map<string, any>();
    properties.set('weight', edge.Weight);
    properties.set('supply_strength', edge.Weight);
    properties.set('source_network', 'RS');
    if (edge.Label) properties.set('label', edge.Label);
    if (edge.timeset) properties.set('timeset', edge.timeset);

    // RS edges represent supply relationships (ingredient -> supplier)
    return {
      id: `rs_edge_${edge.Id}`,
      type: SkinLinkType.SUPPLIED_BY_LINK,
      name: 'SuppliedBy',
      arity: 2,
      outgoing: [sourceAtomId, targetAtomId], // Ingredient supplied by Supplier
      truthValue: this.calculateTruthValueFromWeight(edge.Weight, 'supply'),
      attentionValue: this.calculateAttentionFromWeight(edge.Weight, 'supply'),
      properties,
      incomingSet: new Set(),
      outgoingSet: new Set(),
    };
  }

  /**
   * Calculate truth value from edge weight
   */
  private calculateTruthValueFromWeight(weight: number, context: 'formulation' | 'supply'): TruthValue {
    if (context === 'formulation') {
      // For formulation edges, weight represents concentration
      // Higher concentrations have higher strength and confidence
      const normalizedWeight = Math.min(weight / 100, 1); // Assuming max 100% concentration
      return {
        strength: 0.5 + (normalizedWeight * 0.4), // 0.5 to 0.9 range
        confidence: 0.6 + (normalizedWeight * 0.3), // 0.6 to 0.9 range
        count: 1
      };
    } else {
      // For supply edges, weight typically 1 (binary relationship)
      return {
        strength: 0.8, // High strength for existing supply relationships
        confidence: 0.7, // Moderate confidence 
        count: 1
      };
    }
  }

  /**
   * Calculate attention value from edge weight
   */
  private calculateAttentionFromWeight(weight: number, context: 'formulation' | 'supply'): AttentionValue {
    if (context === 'formulation') {
      const normalizedWeight = Math.min(weight / 100, 1);
      return {
        sti: Math.floor(normalizedWeight * 10) - 2, // -2 to 8 range
        lti: Math.floor(normalizedWeight * 5), // 0 to 5 range
        vlti: 0.1 + (normalizedWeight * 0.2) // 0.1 to 0.3 range
      };
    } else {
      return {
        sti: 0, // Neutral short-term importance for supply links
        lti: 3, // Moderate long-term importance
        vlti: 0.2 // Stable very long-term importance
      };
    }
  }

  /**
   * Update incoming and outgoing sets for a link
   */
  private updateIncomingOutgoingSets(link: SkinLink): void {
    for (const atomId of link.outgoing) {
      const atom = this.skinSpace.getAtom(atomId);
      if (atom) {
        atom.incomingSet.add(link.id);
      }
    }
  }

  /**
   * Merge data from RS node with existing RAW node
   */
  private mergeNodeData(existingAtomId: string, rsNode: RSNode): void {
    const atom = this.skinSpace.getAtom(existingAtomId);
    if (!atom) return;

    // Add RS-specific properties
    atom.properties.set('rs_modularity_class', rsNode.modularity_class);
    atom.properties.set('has_supply_chain', true);
    
    // Update attention values - ingredients that appear in both networks are more important
    const currentAttention = atom.attentionValue;
    atom.attentionValue = {
      sti: currentAttention.sti + 2, // Boost short-term importance
      lti: currentAttention.lti + 3, // Boost long-term importance  
      vlti: Math.min(1, currentAttention.vlti + 0.1) // Slightly boost very long-term
    };

    // Update truth value - higher confidence for nodes in both networks
    atom.truthValue = {
      strength: Math.min(1, atom.truthValue.strength + 0.1),
      confidence: Math.min(1, atom.truthValue.confidence + 0.15),
      count: atom.truthValue.count + 1
    };
  }

  /**
   * Get mapping from original IDs to SkinSpace IDs
   */
  public getIdMapping(): Map<string, string> {
    return new Map(this.nodeIdMapping);
  }

  /**
   * Get statistics about the loaded data
   */
  public getLoadStatistics(): SkinSpaceLoadStatistics {
    const stats = this.skinSpace.getStatistics();
    
    return {
      totalNodes: this.nodeIdMapping.size,
      totalAtoms: stats.totalAtoms,
      atomsByType: stats.atomsByType,
      networkCoverage: {
        rawNodes: Array.from(this.skinSpace.getAtomsByType(SkinAtomType.PRODUCT_NODE)).length + 
                  Array.from(this.skinSpace.getAtomsByType(SkinAtomType.INGREDIENT_NODE))
                    .filter(atom => atom.properties.get('source_network') === 'RAW').length,
        rsNodes: Array.from(this.skinSpace.getAtomsByType(SkinAtomType.SUPPLIER_NODE)).length +
                 Array.from(this.skinSpace.getAtomsByType(SkinAtomType.INGREDIENT_NODE))
                   .filter(atom => atom.properties.get('source_network') === 'RS').length,
        overlappingIngredients: Array.from(this.skinSpace.getAtomsByType(SkinAtomType.INGREDIENT_NODE))
          .filter(atom => atom.properties.get('has_supply_chain')).length
      },
      averageStrength: stats.averageStrength,
      averageConfidence: stats.averageConfidence,
    };
  }
}

/**
 * Result interfaces
 */
export interface SkinSpaceLoadResult {
  loadedAtoms: number;
  loadedLinks: number;
  skippedNodes: number;
  skippedEdges: number;
  errors: string[];
  processingTime: number;
}

interface LoadResult {
  loaded: number;
  skipped: number;
  errors: string[];
}

export interface SkinSpaceLoadStatistics {
  totalNodes: number;
  totalAtoms: number;
  atomsByType: Map<string, number>;
  networkCoverage: {
    rawNodes: number;
    rsNodes: number;
    overlappingIngredients: number;
  };
  averageStrength: number;
  averageConfidence: number;
}

/**
 * CSV Parser utilities for loading vessel data
 */
export class VesselDataParser {
  /**
   * Parse RAW nodes from CSV content
   */
  public static parseRawNodes(csvContent: string): RawNode[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split('\t');
    
    return lines.slice(1).map(line => {
      const values = line.split('\t');
      return {
        Id: values[0],
        Label: values[1] || '',
        timeset: values[2] || undefined,
        modularity_class: values[3] ? parseInt(values[3]) : undefined
      };
    });
  }

  /**
   * Parse RAW edges from CSV content
   */
  public static parseRawEdges(csvContent: string): RawEdge[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split('\t');
    
    return lines.slice(1).map(line => {
      const values = line.split('\t');
      return {
        Source: values[0],
        Target: values[1],
        Type: values[2],
        Id: parseInt(values[3]),
        Label: values[4] || undefined,
        timeset: values[5] || undefined,
        Weight: parseFloat(values[6])
      };
    });
  }

  /**
   * Parse RS nodes from CSV content
   */
  public static parseRSNodes(csvContent: string): RSNode[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split('\t');
    
    return lines.slice(1).map(line => {
      const values = line.split('\t');
      return {
        Id: values[0],
        Label: values[1] || '',
        timeset: values[2] || undefined,
        modularity_class: values[3] ? parseInt(values[3]) : undefined
      };
    });
  }

  /**
   * Parse RS edges from CSV content  
   */
  public static parseRSEdges(csvContent: string): RSEdge[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split('\t');
    
    return lines.slice(1).map(line => {
      const values = line.split('\t');
      return {
        Source: values[0],
        Target: values[1],
        Type: values[2],
        Id: parseInt(values[3]),
        Label: values[4] || undefined,
        timeset: values[5] || undefined,
        Weight: parseFloat(values[6])
      };
    });
  }
}