'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'
import {
  Play,
  Pause,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit,
  Copy,
  MoreVertical,
  Zap,
  GitBranch,
  Clock,
  Bot,
  Code,
  Mail,
  Phone,
  FileText,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Workflow,
  Brain,
  Target,
  Timer,
  Repeat,
  Share2,
  Database,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { workflowBuilder, NodeType, TriggerType, ActionType } from '@/lib/automation/workflow-builder'

// Node type configurations
const nodeTypeConfig = {
  trigger: {
    icon: Zap,
    color: 'bg-green-100 border-green-300',
    label: 'Trigger',
    description: 'Startar arbetsflödet'
  },
  condition: {
    icon: GitBranch,
    color: 'bg-yellow-100 border-yellow-300',
    label: 'Villkor',
    description: 'Förgrenar flödet baserat på villkor'
  },
  action: {
    icon: Play,
    color: 'bg-blue-100 border-blue-300',
    label: 'Åtgärd',
    description: 'Utför en handling'
  },
  delay: {
    icon: Clock,
    color: 'bg-purple-100 border-purple-300',
    label: 'Fördröjning',
    description: 'Väntar en specificerad tid'
  },
  ai_decision: {
    icon: Brain,
    color: 'bg-pink-100 border-pink-300',
    label: 'AI-beslut',
    description: 'Låt AI fatta beslut'
  },
  parallel: {
    icon: Share2,
    color: 'bg-indigo-100 border-indigo-300',
    label: 'Parallell',
    description: 'Kör flera grenar samtidigt'
  },
  loop: {
    icon: Repeat,
    color: 'bg-orange-100 border-orange-300',
    label: 'Loop',
    description: 'Upprepa tills villkor uppfylls'
  },
  integration: {
    icon: Database,
    color: 'bg-gray-100 border-gray-300',
    label: 'Integration',
    description: 'Anslut till externa system'
  }
}

// Trigger configurations
const triggerConfigs = {
  new_lead: { icon: User, label: 'Ny Lead' },
  lead_score_change: { icon: Target, label: 'Lead Score Ändrad' },
  customer_created: { icon: User, label: 'Ny Kund' },
  quote_sent: { icon: FileText, label: 'Offert Skickad' },
  job_completed: { icon: CheckCircle, label: 'Jobb Slutfört' },
  payment_received: { icon: DollarSign, label: 'Betalning Mottagen' },
  time_based: { icon: Timer, label: 'Tidsbaserad' },
  webhook: { icon: Code, label: 'Webhook' },
  manual: { icon: Play, label: 'Manuell' }
}

// Action configurations  
const actionConfigs = {
  send_email: { icon: Mail, label: 'Skicka E-post' },
  send_sms: { icon: Phone, label: 'Skicka SMS' },
  create_task: { icon: FileText, label: 'Skapa Uppgift' },
  update_record: { icon: Database, label: 'Uppdatera Post' },
  assign_to_user: { icon: User, label: 'Tilldela till Användare' },
  create_quote: { icon: FileText, label: 'Skapa Offert' },
  schedule_job: { icon: Calendar, label: 'Boka Jobb' },
  generate_invoice: { icon: DollarSign, label: 'Generera Faktura' },
  ai_analysis: { icon: Brain, label: 'AI-analys' },
  external_api: { icon: Code, label: 'Externt API' }
}

interface WorkflowNode {
  id: string
  type: NodeType
  name: string
  description?: string
  config: any
  position: { x: number; y: number }
  connections: {
    input?: string[]
    output?: string[]
  }
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: any
}

interface Workflow {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  variables: Record<string, any>
  metrics: {
    executions: number
    successRate: number
    avgExecutionTime: number
  }
}

export function WorkflowBuilderUI() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false)
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isNodeConfigOpen, setIsNodeConfigOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [executionLogs, setExecutionLogs] = useState<any[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  // Load workflow templates on mount
  useEffect(() => {
    const templates = workflowBuilder.getWorkflowTemplates()
    console.log('Available templates:', templates)
  }, [])

  // Create new workflow
  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) {
      toast({
        title: 'Fel',
        description: 'Ange ett namn för arbetsflödet',
        variant: 'destructive'
      })
      return
    }

    try {
      const workflow = await workflowBuilder.createWorkflow(
        workflowName,
        workflowDescription
      )
      
      setWorkflows([...workflows, workflow])
      setSelectedWorkflow(workflow)
      setIsCreatingWorkflow(false)
      setWorkflowName('')
      setWorkflowDescription('')
      
      toast({
        title: 'Arbetsflöde skapat',
        description: `${workflow.name} har skapats`
      })
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte skapa arbetsflöde',
        variant: 'destructive'
      })
    }
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, nodeType: NodeType) => {
    setIsDragging(true)
    setDraggedNodeType(nodeType)
    e.dataTransfer.effectAllowed = 'copy'
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  // Handle drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (!selectedWorkflow || !draggedNodeType || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - canvasOffset.x) / zoom
    const y = (e.clientY - rect.top - canvasOffset.y) / zoom

    try {
      const node = await workflowBuilder.addNode(
        selectedWorkflow.id,
        draggedNodeType,
        `${nodeTypeConfig[draggedNodeType].label} ${selectedWorkflow.nodes.length + 1}`,
        {},
        { x: Math.round(x), y: Math.round(y) }
      )

      setSelectedWorkflow({
        ...selectedWorkflow,
        nodes: [...selectedWorkflow.nodes, node]
      })

      toast({
        title: 'Nod tillagd',
        description: `${node.name} har lagts till i arbetsflödet`
      })
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte lägga till nod',
        variant: 'destructive'
      })
    }
    
    setDraggedNodeType(null)
  }

  // Handle node click
  const handleNodeClick = (node: WorkflowNode) => {
    if (isConnecting && connectingFrom && connectingFrom !== node.id) {
      // Complete connection
      handleConnect(connectingFrom, node.id)
    } else {
      setSelectedNode(node)
      setIsNodeConfigOpen(true)
    }
  }

  // Start connection
  const startConnection = (nodeId: string) => {
    setIsConnecting(true)
    setConnectingFrom(nodeId)
  }

  // Handle connection
  const handleConnect = async (sourceId: string, targetId: string) => {
    if (!selectedWorkflow) return

    try {
      const edge = await workflowBuilder.connectNodes(
        selectedWorkflow.id,
        sourceId,
        targetId
      )

      setSelectedWorkflow({
        ...selectedWorkflow,
        edges: [...selectedWorkflow.edges, edge]
      })

      toast({
        title: 'Noder anslutna',
        description: 'Anslutningen har skapats'
      })
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte ansluta noder',
        variant: 'destructive'
      })
    }

    setIsConnecting(false)
    setConnectingFrom(null)
  }

  // Delete node
  const handleDeleteNode = (nodeId: string) => {
    if (!selectedWorkflow) return

    const updatedNodes = selectedWorkflow.nodes.filter(n => n.id !== nodeId)
    const updatedEdges = selectedWorkflow.edges.filter(
      e => e.source !== nodeId && e.target !== nodeId
    )

    setSelectedWorkflow({
      ...selectedWorkflow,
      nodes: updatedNodes,
      edges: updatedEdges
    })

    toast({
      title: 'Nod borttagen',
      description: 'Noden och dess anslutningar har tagits bort'
    })
  }

  // Execute workflow
  const handleExecuteWorkflow = async () => {
    if (!selectedWorkflow) return

    setIsExecuting(true)
    setExecutionLogs([])

    try {
      // Activate workflow if it's in draft
      if (selectedWorkflow.status === 'draft') {
        selectedWorkflow.status = 'active'
      }

      const execution = await workflowBuilder.executeWorkflow(
        selectedWorkflow.id,
        { manual: true, timestamp: new Date() }
      )

      setExecutionLogs(execution.logs)
      
      toast({
        title: 'Arbetsflöde kört',
        description: `Status: ${execution.status}`,
        variant: execution.status === 'completed' ? 'default' : 'destructive'
      })
    } catch (error) {
      toast({
        title: 'Fel',
        description: 'Kunde inte köra arbetsflöde',
        variant: 'destructive'
      })
    } finally {
      setIsExecuting(false)
    }
  }

  // Render node on canvas
  const renderNode = (node: WorkflowNode) => {
    const config = nodeTypeConfig[node.type]
    const Icon = config.icon
    const isSelected = selectedNode?.id === node.id
    const isHovered = hoveredNode === node.id
    const isConnectingTo = isConnecting && connectingFrom !== node.id

    return (
      <div
        key={node.id}
        className={cn(
          "absolute p-3 rounded-lg border-2 cursor-pointer transition-all",
          config.color,
          isSelected && "ring-2 ring-blue-500 ring-offset-2",
          isHovered && "shadow-lg",
          isConnectingTo && "animate-pulse"
        )}
        style={{
          left: node.position.x * zoom + canvasOffset.x,
          top: node.position.y * zoom + canvasOffset.y,
          transform: `scale(${zoom})`
        }}
        onClick={() => handleNodeClick(node)}
        onMouseEnter={() => setHoveredNode(node.id)}
        onMouseLeave={() => setHoveredNode(null)}
      >
        <div className="flex items-center space-x-2">
          <Icon className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">{node.name}</p>
            {node.description && (
              <p className="text-xs text-gray-600">{node.description}</p>
            )}
          </div>
        </div>
        
        {/* Connection points */}
        {node.type !== 'trigger' && (
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full" />
        )}
        {node.type !== 'action' && node.type !== 'delay' && (
          <div 
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-300 rounded-full cursor-pointer hover:bg-blue-100"
            onClick={(e) => {
              e.stopPropagation()
              startConnection(node.id)
            }}
          />
        )}
        
        {/* Node menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="absolute -top-2 -right-2 h-6 w-6 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {
              setSelectedNode(node)
              setIsNodeConfigOpen(true)
            }}>
              <Edit className="mr-2 h-4 w-4" />
              Konfigurera
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => startConnection(node.id)}>
              <GitBranch className="mr-2 h-4 w-4" />
              Anslut
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteNode(node.id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Ta bort
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // Render edge on canvas
  const renderEdge = (edge: WorkflowEdge) => {
    const sourceNode = selectedWorkflow?.nodes.find(n => n.id === edge.source)
    const targetNode = selectedWorkflow?.nodes.find(n => n.id === edge.target)
    
    if (!sourceNode || !targetNode) return null

    const x1 = sourceNode.position.x * zoom + canvasOffset.x + 100
    const y1 = sourceNode.position.y * zoom + canvasOffset.y + 25
    const x2 = targetNode.position.x * zoom + canvasOffset.x
    const y2 = targetNode.position.y * zoom + canvasOffset.y + 25

    return (
      <svg
        key={edge.id}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: -1 }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6b7280"
            />
          </marker>
        </defs>
        <path
          d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
          stroke="#6b7280"
          strokeWidth="2"
          fill="none"
          markerEnd="url(#arrowhead)"
        />
      </svg>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Workflow className="h-6 w-6 text-purple-600" />
          <h1 className="text-2xl font-bold">Visual Workflow Builder</h1>
        </div>
        <div className="flex items-center space-x-2">
          {selectedWorkflow && (
            <>
              <Badge variant={selectedWorkflow.status === 'active' ? 'default' : 'secondary'}>
                {selectedWorkflow.status}
              </Badge>
              <Button
                onClick={handleExecuteWorkflow}
                disabled={isExecuting || selectedWorkflow.nodes.length === 0}
                variant="default"
              >
                {isExecuting ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Kör...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Kör Arbetsflöde
                  </>
                )}
              </Button>
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Spara
              </Button>
            </>
          )}
          <Button
            onClick={() => setIsCreatingWorkflow(true)}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nytt Arbetsflöde
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r bg-gray-50 p-4 space-y-4">
          {/* Workflow selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arbetsflöden</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                {workflows.length === 0 ? (
                  <p className="text-sm text-gray-500">Inga arbetsflöden än</p>
                ) : (
                  <div className="space-y-2">
                    {workflows.map(wf => (
                      <button
                        key={wf.id}
                        onClick={() => setSelectedWorkflow(wf)}
                        className={cn(
                          "w-full text-left p-2 rounded hover:bg-gray-100",
                          selectedWorkflow?.id === wf.id && "bg-blue-100"
                        )}
                      >
                        <p className="font-medium">{wf.name}</p>
                        <p className="text-xs text-gray-600">{wf.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Node palette */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Komponenter</CardTitle>
              <CardDescription>
                Dra och släpp för att lägga till
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(nodeTypeConfig).map(([type, config]) => {
                  const Icon = config.icon
                  return (
                    <div
                      key={type}
                      draggable
                      onDragStart={(e) => handleDragStart(e, type as NodeType)}
                      className={cn(
                        "p-3 rounded-lg border-2 cursor-move transition-all hover:shadow-md",
                        config.color,
                        isDragging && draggedNodeType === type && "opacity-50"
                      )}
                    >
                      <Icon className="h-5 w-5 mb-1" />
                      <p className="text-xs font-medium">{config.label}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Execution logs */}
          {executionLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Körningslogg</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <div className="space-y-1">
                    {executionLogs.map((log, index) => (
                      <div
                        key={index}
                        className={cn(
                          "text-xs p-1 rounded",
                          log.level === 'error' && "bg-red-100 text-red-700",
                          log.level === 'warning' && "bg-yellow-100 text-yellow-700",
                          log.level === 'info' && "bg-gray-100 text-gray-700"
                        )}
                      >
                        <span className="font-medium">
                          {new Date(log.timestamp).toLocaleTimeString()}:
                        </span>{' '}
                        {log.message}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {selectedWorkflow ? (
            <div
              ref={canvasRef}
              className="absolute inset-0"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              style={{
                backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
                backgroundSize: `${20 * zoom}px ${20 * zoom}px`
              }}
            >
              {/* Render edges */}
              {selectedWorkflow.edges.map(edge => renderEdge(edge))}
              
              {/* Render nodes */}
              {selectedWorkflow.nodes.map(node => renderNode(node))}
              
              {/* Drop zone indicator */}
              {isDragging && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-10 pointer-events-none">
                  <div className="h-full flex items-center justify-center">
                    <p className="text-lg font-medium text-blue-700">
                      Släpp här för att lägga till
                    </p>
                  </div>
                </div>
              )}
              
              {/* Connection line */}
              {isConnecting && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm font-medium text-gray-600 bg-white px-3 py-1 rounded shadow">
                      Klicka på målnod för att ansluta
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Välj ett arbetsflöde eller skapa ett nytt
                </p>
              </div>
            </div>
          )}
          
          {/* Canvas controls */}
          {selectedWorkflow && (
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                -
              </Button>
              <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              >
                +
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Create workflow dialog */}
      <Dialog open={isCreatingWorkflow} onOpenChange={setIsCreatingWorkflow}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa nytt arbetsflöde</DialogTitle>
            <DialogDescription>
              Ge ditt arbetsflöde ett namn och beskrivning
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="workflow-name">Namn</Label>
              <Input
                id="workflow-name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="T.ex. Lead Nurturing"
              />
            </div>
            <div>
              <Label htmlFor="workflow-description">Beskrivning</Label>
              <Textarea
                id="workflow-description"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                placeholder="Beskriv vad arbetsflödet gör..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingWorkflow(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateWorkflow}>
              Skapa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node configuration dialog */}
      <Dialog open={isNodeConfigOpen} onOpenChange={setIsNodeConfigOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Konfigurera {selectedNode?.name}</DialogTitle>
            <DialogDescription>
              Anpassa nodens inställningar och beteende
            </DialogDescription>
          </DialogHeader>
          {selectedNode && (
            <Tabs defaultValue="general">
              <TabsList>
                <TabsTrigger value="general">Allmänt</TabsTrigger>
                <TabsTrigger value="config">Konfiguration</TabsTrigger>
                <TabsTrigger value="conditions">Villkor</TabsTrigger>
              </TabsList>
              <TabsContent value="general" className="space-y-4">
                <div>
                  <Label htmlFor="node-name">Namn</Label>
                  <Input
                    id="node-name"
                    value={selectedNode.name}
                    onChange={(e) => {
                      setSelectedNode({ ...selectedNode, name: e.target.value })
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="node-description">Beskrivning</Label>
                  <Textarea
                    id="node-description"
                    value={selectedNode.description || ''}
                    onChange={(e) => {
                      setSelectedNode({ ...selectedNode, description: e.target.value })
                    }}
                  />
                </div>
              </TabsContent>
              <TabsContent value="config" className="space-y-4">
                {selectedNode.type === 'trigger' && (
                  <div>
                    <Label>Trigger-typ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(triggerConfigs).map(([key, config]) => {
                          const Icon = config.icon
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center">
                                <Icon className="mr-2 h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedNode.type === 'action' && (
                  <div>
                    <Label>Åtgärdstyp</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj åtgärd" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(actionConfigs).map(([key, config]) => {
                          const Icon = config.icon
                          return (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center">
                                <Icon className="mr-2 h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {selectedNode.type === 'delay' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="delay-duration">Varaktighet</Label>
                      <Input
                        id="delay-duration"
                        type="number"
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <Label>Enhet</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj enhet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seconds">Sekunder</SelectItem>
                          <SelectItem value="minutes">Minuter</SelectItem>
                          <SelectItem value="hours">Timmar</SelectItem>
                          <SelectItem value="days">Dagar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="conditions" className="space-y-4">
                <p className="text-sm text-gray-600">
                  Definiera villkor för när denna nod ska köras
                </p>
                {/* Add condition builder here */}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNodeConfigOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={() => {
              // Save node configuration
              setIsNodeConfigOpen(false)
              toast({
                title: 'Konfiguration sparad',
                description: 'Nodens inställningar har uppdaterats'
              })
            }}>
              Spara ändringar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}