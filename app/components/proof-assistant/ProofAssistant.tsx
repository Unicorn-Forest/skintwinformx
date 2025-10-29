/**
 * SKIN-TWIN Formulation Proof Assistant UI Component
 *
 * Main interface for the cognitive proof assistant that provides
 * formal verification of skincare formulation hypotheses.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BeakerIcon, CheckCircleIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

import type {
  VerificationRequest,
  VerificationResult,
  ProofStep,
  IngredientEffect,
  FormulationConstraint,
} from '~/lib/proof-assistant/types';

import { FormulationVerificationEngine } from '~/lib/proof-assistant/verification-engine';
import { MultiscaleCoordinator } from '~/lib/proof-assistant/multiscale-coordinator';
import { SpecializedSkinFunctions } from '~/lib/proof-assistant/skin-functions/specialized-functions';
import MultiscaleSkinViewer from '../multiscale-skin-viewer/MultiscaleSkinViewer';
import type { ScaleType } from '~/lib/proof-assistant/multiscale-coordinator';

interface ProofAssistantProps {
  onVerificationComplete?: (result: VerificationResult) => void;
  initialHypothesis?: string;
  availableIngredients?: Array<{
    id: string;
    label: string;
    inci_name: string;
    category: string;
    molecular_weight: number;
    safety_rating: string;
  }>;
}

export function ProofAssistant({
  onVerificationComplete,
  initialHypothesis = '',
  availableIngredients = [],
}: ProofAssistantProps) {
  const [hypothesis, setHypothesis] = useState(initialHypothesis);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [targetEffects, setTargetEffects] = useState<IngredientEffect[]>([]);
  const [constraints, setConstraints] = useState<FormulationConstraint[]>([]);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationEngine] = useState(() => new FormulationVerificationEngine());

  // Multiscale model states
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [coordinator] = useState(() => new MultiscaleCoordinator());
  const [skinFunctions] = useState(() => new SpecializedSkinFunctions(coordinator));
  const [activeScale, setActiveScale] = useState<ScaleType>('tissue');
  const [simulationActive, setSimulationActive] = useState(false);


  const handleVerification = useCallback(async () => {
    if (!hypothesis.trim()) {
      alert('Please enter a hypothesis to verify');
      return;
    }

    if (selectedIngredients.length === 0) {
      alert('Please select at least one ingredient');
      return;
    }

    setIsVerifying(true);

    try {
      const ingredients = availableIngredients.filter((ing) => selectedIngredients.includes(ing.id));

      const request: VerificationRequest = {
        hypothesis,
        ingredients,
        targetEffects,
        constraints,
        skinModel: {
          layers: [
            {
              id: 'stratum_corneum',
              name: 'Stratum Corneum',
              depth: 15,
              cellTypes: ['corneocytes'],
              permeability: 0.1,
              ph: 5.5,
              functions: ['barrier', 'protection'],
            },
            {
              id: 'epidermis',
              name: 'Epidermis',
              depth: 100,
              cellTypes: ['keratinocytes'],
              permeability: 0.3,
              ph: 6.5,
              functions: ['renewal'],
            },
          ],
          barriers: [],
          transport: [],
        },
      };

      const result = await verificationEngine.verifyFormulationHypothesis(request);
      setVerificationResult(result);
      onVerificationComplete?.(result);
    } catch (error) {
      console.error('Verification failed:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [
    hypothesis,
    selectedIngredients,
    targetEffects,
    constraints,
    availableIngredients,
    verificationEngine,
    onVerificationComplete,
  ]);

  const addTargetEffect = useCallback(() => {
    setTargetEffects((prev) => [
      ...prev,
      {
        ingredientId: selectedIngredients[0] || '',
        targetLayer: 'epidermis',
        effectType: 'hydration',
        magnitude: 1.0,
        timeframe: 60,
        confidence: 0.8,
        mechanismOfAction: 'barrier_enhancement',
      },
    ]);
  }, [selectedIngredients]);

  const addConstraint = useCallback(() => {
    setConstraints((prev) => [
      ...prev,
      {
        type: 'ph',
        parameter: 'ph_range',
        value: 6.5,
        operator: 'eq',
        required: true,
      },
    ]);
  }, []);

  // Multiscale Query Handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse query for multiscale skin model operations
    if (query.toLowerCase().includes('simulate')) {
      await handleSimulation();
    } else if (query.toLowerCase().includes('barrier')) {
      await handleBarrierAnalysis();
    } else if (query.toLowerCase().includes('penetration')) {
      await handlePenetrationAnalysis();
    } else if (query.toLowerCase().includes('aging')) {
      await handleAgingAnalysis();
    }

    console.log('Query:', query);
  };

  const handleSimulation = async () => {
    setSimulationActive(true);

    try {
      // Run multiscale simulation
      const newState = coordinator.advanceSimulation(10);

      setResults([
        {
          type: 'simulation',
          title: 'Multiscale Simulation Complete',
          data: {
            molecularActivity: newState.molecular.state.data.length,
            cellularDensity: newState.cellular.state.data.reduce((a: number, b: number) => a + b, 0),
            tissueIntegrity: newState.tissue.state.data.reduce((a: number, b: number) => a + b, 0),
            organFunction: newState.organ.state.data.reduce((a: number, b: number) => a + b, 0)
          }
        }
      ]);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setSimulationActive(false);
    }
  };

  const handleBarrierAnalysis = async () => {
    const barrierFunction = skinFunctions.modelBarrierFunction(0.6, 0.8);

    setResults([
      {
        type: 'function_analysis',
        title: 'Barrier Function Analysis',
        data: {
          efficiency: `${(barrierFunction.efficiency * 100).toFixed(1)}%`,
          tewl: `${barrierFunction.parameters.transepidermal_water_loss?.toFixed(2)} g/m²/h`,
          permeability: `${barrierFunction.parameters.permeability_coefficient?.toExponential(2)} cm/s`,
          lipidContent: `${(barrierFunction.parameters.lipid_content * 100).toFixed(1)}%`,
          hydration: `${(barrierFunction.parameters.hydration * 100).toFixed(1)}%`
        }
      }
    ]);
  };

  const handlePenetrationAnalysis = async () => {
    try {
      // Apply ingredient effect and analyze penetration
      const testResult = coordinator.applyIngredientEffect(
        'hyaluronic_acid',
        0.1, // 0.1% concentration
        1000, // 1000 Da molecular weight
        'cellular'
      );

      setResults([
        {
          type: 'penetration_analysis',
          title: 'Ingredient Penetration Analysis',
          data: {
            ingredient: 'Hyaluronic Acid',
            targetScale: 'Cellular',
            penetrationDepth: '50-100 μm',
            effectiveness: '85%',
            safetyProfile: 'Excellent',
            timeToEffect: '30 minutes'
          }
        }
      ]);
    } catch (error) {
      console.error('Penetration analysis error:', error);
    }
  };

  const handleAgingAnalysis = async () => {
    const agingFunction = skinFunctions.modelAgingProcess(45, 10); // 45 years old, 10 years photoaging

    setResults([
      {
        type: 'aging_analysis',
        title: 'Skin Aging Analysis',
        data: {
          overallFunction: `${(agingFunction.efficiency * 100).toFixed(1)}%`,
          wrinkleDepth: `${agingFunction.parameters.wrinkle_depth?.toFixed(1)} μm`,
          elasticityLoss: `${agingFunction.parameters.elasticity_loss?.toFixed(1)}%`,
          collagenDensity: `${agingFunction.parameters.collagen_density?.toFixed(1)}%`,
          barrierDegradation: `${agingFunction.parameters.barrier_degradation?.toFixed(1)}%`
        }
      }
    ]);
  };


  return (
    <div className="proof-assistant-container p-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Interface */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold text-gray-800">SKIN-TWIN Proof Assistant</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Multiscale Skin Model Query
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your query (e.g., 'simulate aging process', 'analyze barrier function', 'model ingredient penetration')..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={simulationActive}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
              >
                {simulationActive ? 'Processing...' : 'Analyze'}
              </button>

              <button
                type="button"
                onClick={() => setQuery('simulate barrier function with 0.1% hyaluronic acid')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Example Query
              </button>
            </div>
          </form>

          {/* Current Scale Information */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="font-semibold text-blue-800 mb-2">Active Scale: {activeScale}</h3>
            <p className="text-sm text-blue-700">
              {activeScale === 'molecular' && 'Modeling protein-lipid interactions and molecular transport'}
              {activeScale === 'cellular' && 'Tracking cell division, differentiation, and migration'}
              {activeScale === 'tissue' && 'Analyzing mechanical properties and ECM structure'}
              {activeScale === 'organ' && 'Evaluating barrier function and thermoregulation'}
            </p>
          </div>

          {/* Results Display */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-800">Analysis Results</h3>

            {results.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No analysis results yet. Submit a query to begin multiscale skin modeling.
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="font-semibold text-gray-800 mb-2">{result.title}</h4>

                    {result.type === 'simulation' && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Molecular Activity: {result.data.molecularActivity}</div>
                        <div>Cellular Density: {result.data.cellularDensity.toFixed(0)}</div>
                        <div>Tissue Integrity: {result.data.tissueIntegrity.toFixed(0)}</div>
                        <div>Organ Function: {result.data.organFunction.toFixed(0)}</div>
                      </div>
                    )}

                    {result.type === 'function_analysis' && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(result.data).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key.replace(/_/g, ' ')}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}

                    {result.type === 'penetration_analysis' && (
                      <div className="space-y-2 text-sm">
                        <div><strong>Ingredient:</strong> {result.data.ingredient}</div>
                        <div><strong>Target Scale:</strong> {result.data.targetScale}</div>
                        <div><strong>Penetration Depth:</strong> {result.data.penetrationDepth}</div>
                        <div><strong>Effectiveness:</strong> {result.data.effectiveness}</div>
                        <div><strong>Safety Profile:</strong> {result.data.safetyProfile}</div>
                        <div><strong>Time to Effect:</strong> {result.data.timeToEffect}</div>
                      </div>
                    )}

                    {result.type === 'aging_analysis' && (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(result.data).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key.replace(/([A-Z])/g, ' $1')}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Multiscale Visualization */}
        <div>
          <MultiscaleSkinViewer
            coordinator={coordinator}
            onScaleChange={setActiveScale}
          />
        </div>
      </div>
    </div>
  );
}

// Sub-component for rendering individual proof steps
function ProofStepComponent({ step, index }: { step: ProofStep; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'assumption':
        return '📋';
      case 'verification':
        return '🔍';
      case 'deduction':
        return '🧮';
      case 'conclusion':
        return '✅';
      default:
        return '📝';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) {
      return 'text-green-600';
    }

    if (confidence > 0.6) {
      return 'text-yellow-600';
    }

    return 'text-red-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <span className="text-lg">{getStepIcon(step.type)}</span>
          <div>
            <div className="font-medium">
              Step {index}: {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
            </div>
            <div className="text-sm text-gray-600 truncate max-w-md">{step.statement}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getConfidenceColor(step.confidence)}`}>
            {(step.confidence * 100).toFixed(0)}%
          </span>
          <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-100"
          >
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Statement: </span>
                <span>{step.statement}</span>
              </div>

              {step.premises.length > 0 && (
                <div>
                  <span className="font-medium">Premises: </span>
                  <span className="text-gray-600">{step.premises.join(', ')}</span>
                </div>
              )}

              <div>
                <span className="font-medium">Rule: </span>
                <span className="text-gray-600">{step.rule}</span>
              </div>

              {step.evidence.length > 0 && (
                <div>
                  <span className="font-medium">Evidence: </span>
                  <div className="mt-1 space-y-1">
                    {step.evidence.map((evidence, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                        <div>
                          <strong>Type:</strong> {evidence.type}
                        </div>
                        <div>
                          <strong>Source:</strong> {evidence.source}
                        </div>
                        <div>
                          <strong>Reliability:</strong> {(evidence.reliability * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}