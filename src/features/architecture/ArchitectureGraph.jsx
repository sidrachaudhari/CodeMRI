import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MODULE_DATA } from '../../data/mockData';
import { Layers, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

// Custom service node styled with the Dumma Branding Minimal palette
function ServiceNode({ data, selected }) {
  const isHotspot = data.isHotspot;

  return (
    <div
      style={{
        backgroundColor: isHotspot ? '#A28089' : '#ffffff',
        color: isHotspot ? '#ffffff' : '#362B30',
        border: selected
          ? '3px solid #51E2F5'
          : isHotspot
          ? '2px solid #84656D'
          : '2px solid rgba(162, 128, 137, 0.4)',
        borderRadius: '12px',
        padding: '10px 14px',
        minWidth: '185px',
        boxShadow: isHotspot
          ? '0 10px 15px -3px rgba(162, 128, 137, 0.4)'
          : '0 4px 6px -1px rgba(162, 128, 137, 0.1)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        cursor: 'pointer'
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#51E2F5', width: 8, height: 8, borderRadius: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#51E2F5', width: 8, height: 8, borderRadius: '50%' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span
          style={{
            fontSize: '9px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontWeight: '700',
            color: isHotspot ? '#EDF7F6' : '#A28089'
          }}
        >
          {data.category || 'Service'}
        </span>

        {data.riskScore && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '4px',
              backgroundColor: isHotspot ? '#FFA8B6' : '#EDF7F6',
              color: '#1B1618',
              border: isHotspot ? '1px solid #FFA8B6' : '1px solid rgba(162, 128, 137, 0.3)'
            }}
          >
            Risk: {data.riskScore}
          </span>
        )}
      </div>

      <div
        style={{
          fontSize: '13px',
          fontWeight: '800',
          color: isHotspot ? '#ffffff' : '#362B30',
          lineHeight: '1.3'
        }}
      >
        {data.label}
      </div>

      {isHotspot && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: '800',
            color: '#FFA8B6',
            marginTop: '6px',
            textTransform: 'uppercase'
          }}
        >
          <AlertCircle style={{ width: 12, height: 12, color: '#FFA8B6' }} /> Critical Hotspot
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#51E2F5', width: 8, height: 8, borderRadius: '50%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#51E2F5', width: 8, height: 8, borderRadius: '50%' }}
      />
    </div>
  );
}

const ARCHITECTURE_NODES = [
  {
    id: 'frontend',
    type: 'serviceNode',
    data: { label: 'Web Storefront (React)', category: 'Frontend Client' },
    position: { x: 40, y: 160 }
  },
  {
    id: 'api-gateway',
    type: 'serviceNode',
    data: { label: 'API Gateway', category: 'Spring Cloud Gateway' },
    position: { x: 280, y: 160 }
  },
  {
    id: 'auth-service',
    type: 'serviceNode',
    data: { label: 'AuthService', category: 'Security / Auth', riskScore: 32 },
    position: { x: 530, y: 40 }
  },
  {
    id: 'order-service',
    type: 'serviceNode',
    data: { label: 'OrderController', category: 'API / Routing', riskScore: 81 },
    position: { x: 530, y: 150 }
  },
  {
    id: 'payment-service',
    type: 'serviceNode',
    data: { label: 'PaymentService', category: 'Backend Core', riskScore: 87, isHotspot: true },
    position: { x: 530, y: 260 }
  },
  {
    id: 'product-service',
    type: 'serviceNode',
    data: { label: 'ProductService', category: 'Catalog Core', riskScore: 28 },
    position: { x: 530, y: 390 }
  },
  {
    id: 'database',
    type: 'serviceNode',
    data: { label: 'PostgreSQL & Redis DB', category: 'Persistence Layer' },
    position: { x: 820, y: 200 }
  }
];

const ARCHITECTURE_EDGES = [
  { id: 'e1', source: 'frontend', target: 'api-gateway', animated: true, style: { stroke: '#51E2F5', strokeWidth: 2 } },
  { id: 'e2', source: 'api-gateway', target: 'auth-service', style: { stroke: '#A28089', strokeWidth: 1.5 } },
  { id: 'e3', source: 'api-gateway', target: 'order-service', style: { stroke: '#51E2F5', strokeWidth: 2 } },
  { id: 'e4', source: 'api-gateway', target: 'product-service', style: { stroke: '#A28089', strokeWidth: 1.5 } },
  { id: 'e5', source: 'order-service', target: 'payment-service', animated: true, style: { stroke: '#FFA8B6', strokeWidth: 2.5 } },
  { id: 'e6', source: 'payment-service', target: 'database', style: { stroke: '#A28089', strokeWidth: 2 } },
  { id: 'e7', source: 'order-service', target: 'database', style: { stroke: '#A28089', strokeWidth: 1.5 } },
  { id: 'e8', source: 'product-service', target: 'database', style: { stroke: '#A28089', strokeWidth: 1.5 } }
];

export default function ArchitectureGraph({ onSelectModule, onNavigate, isDarkMode = true }) {
  const [nodes, setNodes] = useState(ARCHITECTURE_NODES);
  const [edges, setEdges] = useState(ARCHITECTURE_EDGES);
  const [selectedNode, setSelectedNode] = useState(MODULE_DATA[0]);

  const nodeTypes = useMemo(() => ({ serviceNode: ServiceNode }), []);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onNodeClick = (_, node) => {
    if (node.id === 'payment-service') setSelectedNode(MODULE_DATA[0]);
    else if (node.id === 'order-service') setSelectedNode(MODULE_DATA[1]);
    else if (node.id === 'auth-service') setSelectedNode(MODULE_DATA[3]);
    else if (node.id === 'product-service') setSelectedNode(MODULE_DATA[4]);
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 pb-4">
      {/* Graph Area - CLEAN BLUEPRINT CANVAS ALWAYS READABLE */}
      <div className="h-[360px] sm:h-[450px] lg:h-auto flex-1 border-2 border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden relative flex flex-col bg-white dark:bg-neutral-950 shadow-sm shrink-0 lg:shrink">
        {/* Canvas Header */}
        <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#51E2F5]" />
            <span className="font-bold text-neutral-900 dark:text-white">Architecture & Dependency Map</span>
          </div>
          <Badge variant="secondary" className="font-semibold text-[10px]">
            Minimal Colors Blueprint
          </Badge>
        </div>

        {/* React Flow Viewport - Always high contrast readable */}
        <div className="flex-1 w-full h-full bg-[#f8fbfa] dark:bg-[#111111]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            className="bg-[#f8fbfa] dark:bg-[#111111]"
          >
            <Background color="#A28089" gap={20} size={1.2} />
            <Controls className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white rounded-xl shadow-md" />
          </ReactFlow>
        </div>
      </div>

      {/* Side Detail Panel */}
      <Card className="w-full lg:w-80 p-5 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col justify-between shrink-0 overflow-y-auto">
        {selectedNode ? (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold block text-neutral-500">
                Selected Module
              </span>
              <h3 className="text-base font-bold font-mono text-neutral-900 dark:text-white">
                {selectedNode.name}
              </h3>
              <span className="text-xs text-neutral-500">{selectedNode.category}</span>
            </div>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Risk Score:</span>
                <span className="font-bold font-mono text-neutral-900 dark:text-white">{selectedNode.riskScore} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Cyclomatic Complexity:</span>
                <span className="font-mono text-neutral-900 dark:text-white">{selectedNode.complexity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Coupling Ratio:</span>
                <span className="font-mono text-neutral-900 dark:text-white">{selectedNode.coupling}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Dependents:</span>
                <span className="font-mono text-neutral-900 dark:text-white">{selectedNode.dependents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Technical Debt:</span>
                <span className="font-mono text-neutral-900 dark:text-white">{selectedNode.techDebt}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold mb-1 text-neutral-900 dark:text-white">
                <Sparkles className="h-3.5 w-3.5 text-[#51E2F5]" /> Diagnostic Assessment
              </div>
              <p className="text-xs p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 leading-relaxed text-neutral-800 dark:text-neutral-200">
                {selectedNode.diagnosis}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold block mb-2 text-neutral-900 dark:text-white">
                Grounding Signals:
              </span>
              <ul className="space-y-1.5">
                {selectedNode.ragEvidence.map((ev, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5 text-neutral-500">
                    <span className="font-bold text-[#51E2F5] shrink-0">✓</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-xs text-center text-neutral-500">
            Select a module node to view telemetry and diagnosis.
          </div>
        )}

        {selectedNode && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <Button
              variant="default"
              onClick={() => {
                onSelectModule(selectedNode);
                onNavigate('ai-diagnosis');
              }}
              className="w-full gap-2 text-xs"
            >
              Full Review <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
