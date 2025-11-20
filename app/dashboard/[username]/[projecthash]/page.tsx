"use client"

import { useEffect, useState, useCallback, useRef, DragEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { MathTools } from "@/components/math-tools"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  ReactFlowInstance,
} from "reactflow"
import "reactflow/dist/style.css"
import { BlockNode, StartNode, EndNode, nodeTypes, BlockNodeData } from "@/components/block-nodes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Save,
  Play,
  Pause,
  SkipBack,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Timer,
  Code,
  Trash2,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Ruler,
  Move,
  Target,
  Spline,
  Pencil,
  Repeat,
  GitBranch,
  Zap,
  Eye,
  Gauge,
  CircleDot,
  Radar,
  Waypoints,
  RotateCcw,
  Circle,
  Undo2,
  Redo2,
  Copy,
  Grid3x3,
  Compass,
  PanelLeftClose,
  PanelLeft,
  Wrench,
  Maximize2,
  Minimize2,
  RotateCcw as RotateIcon,
  GripVertical,
  GripHorizontal,
  Plus,
  X,
} from "lucide-react"

type Project = {
  id: string
  name: string
  template_type: 'omni-wheel' | 'mecanum-wheel'
  motor_config: any
  workflow_data: any
}

type ActionBlock = {
  id: string
  type: string
  label: string
  distance?: number
  power?: number
  angle?: number
  duration?: number
  targetX?: number
  targetY?: number
  targetHeading?: number
  curveType?: 'linear' | 'spline' | 'bezier'
  servo?: string
  servoName?: string
  motorName?: string
  position?: number
  customCode?: string
  score?: number
  condition?: string
  loopCount?: number
}

type Motor = {
  name: string
  port: number
  reversed: boolean
  hub: 'control' | 'expansion'
  enabled: boolean
  encoderEnabled: boolean
}

type Servo = {
  name: string
  port: number
  hub: 'control' | 'expansion'
  type: 'standard' | 'continuous'
  enabled: boolean
}

type I2CDevice = {
  name: string
  type: 'imu' | 'distance' | 'color' | 'servo-controller' | 'color-range'
  address: string
  bus: number
  hub: 'control' | 'expansion'
  enabled: boolean
}

type DigitalDevice = {
  name: string
  type: 'touch' | 'limit-switch' | 'magnetic' | 'led'
  port: number
  hub: 'control' | 'expansion'
  enabled: boolean
}

type AnalogDevice = {
  name: string
  type: 'potentiometer' | 'light-sensor' | 'ultrasonic'
  port: number
  hub: 'control' | 'expansion'
  enabled: boolean
}

// FTC Hardware Port Configuration
// Control Hub and Expansion Hub each have:
// - 4 Motor ports (0-3)
// - 6 Servo ports (0-5)
// - 4 I2C buses (0-3, bus 0 has built-in IMU)
// - 8 Digital I/O ports (0-7)
// - 4 Analog Input ports (0-3)

const BLOCK_TYPES = {
  movement: [
    { id: 'moveToPosition', label: 'Move to Position', icon: Target, description: 'Move to specific coordinates' },
    { id: 'splineTo', label: 'Spline to Position', icon: Spline, description: 'Smooth curve to position' },
    { id: 'forward', label: 'Move Forward', icon: ArrowUp, description: 'Move forward by distance' },
    { id: 'backward', label: 'Move Backward', icon: ArrowDown, description: 'Move backward by distance' },
    { id: 'strafeLeft', label: 'Strafe Left', icon: ArrowLeft, description: 'Strafe left by distance' },
    { id: 'strafeRight', label: 'Strafe Right', icon: ArrowRight, description: 'Strafe right by distance' },
    { id: 'turnLeft', label: 'Turn Left', icon: RotateCcw, description: 'Turn left by angle' },
    { id: 'turnRight', label: 'Turn Right', icon: RotateCw, description: 'Turn right by angle' },
    { id: 'turnToHeading', label: 'Turn to Heading', icon: Target, description: 'Turn to specific heading' },
    { id: 'pivotTurn', label: 'Pivot Turn', icon: CircleDot, description: 'Turn around one wheel' },
    { id: 'followPath', label: 'Follow Path', icon: Waypoints, description: 'Follow complex path' },
  ],
  mechanisms: [
    { id: 'setServo', label: 'Set Servo Position', icon: Settings, description: 'Set servo to position' },
    { id: 'continuousServo', label: 'Continuous Servo', icon: RotateCw, description: 'Run continuous servo' },
    { id: 'runMotor', label: 'Run Motor', icon: Zap, description: 'Run mechanism motor' },
    { id: 'stopMotor', label: 'Stop Motor', icon: Pause, description: 'Stop mechanism motor' },
    { id: 'setMotorPower', label: 'Set Motor Power', icon: Gauge, description: 'Set motor power level' },
  ],
  sensors: [
    { id: 'readIMU', label: 'Read IMU', icon: Radar, description: 'Read IMU orientation' },
    { id: 'readDistance', label: 'Read Distance', icon: Eye, description: 'Read distance sensor' },
    { id: 'readColor', label: 'Read Color', icon: CircleDot, description: 'Read color sensor' },
    { id: 'waitForSensor', label: 'Wait for Sensor', icon: Timer, description: 'Wait until sensor condition' },
    { id: 'readTouch', label: 'Read Touch', icon: CircleDot, description: 'Read touch sensor' },
  ],
  control: [
    { id: 'wait', label: 'Wait', icon: Timer, description: 'Wait for duration' },
    { id: 'waitUntil', label: 'Wait Until', icon: Timer, description: 'Wait until condition' },
    { id: 'loop', label: 'Loop', icon: Repeat, description: 'Repeat actions' },
    { id: 'if', label: 'If/Else', icon: GitBranch, description: 'Conditional execution' },
    { id: 'parallel', label: 'Run Parallel', icon: Zap, description: 'Run actions in parallel' },
    { id: 'everynode', label: 'For Every Node', icon: Grid3x3, description: 'Execute actions for each node in collection' },
    { id: 'custom', label: 'Custom Code', icon: Code, description: 'Insert custom Java code' },
  ]
}

// Cubic bezier curve calculation
function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

// Generate smooth curve through points
function generateSpline(points: {x: number, y: number, heading: number}[], steps: number = 50): {x: number, y: number, heading: number}[] {
  if (points.length < 2) return points
  if (points.length === 2) {
    // Linear interpolation
    const result: {x: number, y: number, heading: number}[] = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      result.push({
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
        heading: points[0].heading + (points[1].heading - points[0].heading) * t,
      })
    }
    return result
  }

  // Catmull-Rom spline for smooth curves
  const result: {x: number, y: number, heading: number}[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1]

    const segmentSteps = Math.ceil(steps / (points.length - 1))

    for (let j = 0; j <= segmentSteps; j++) {
      const t = j / segmentSteps
      const t2 = t * t
      const t3 = t2 * t

      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
      )

      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
      )

      const heading = p1.heading + (p2.heading - p1.heading) * t

      result.push({ x, y, heading })
    }
  }

  return result
}

function CurvesEditorInner() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | undefined>(undefined)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [showRuler, setShowRuler] = useState(false)
  const [showProtractor, setShowProtractor] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [gridSize, setGridSize] = useState(24)
  const [protractorLockToRobot, setProtractorLockToRobot] = useState(false)
  const [selectedField, setSelectedField] = useState<'intothedeep' | 'centerstage' | 'decode'>('intothedeep')
  const [fieldImage, setFieldImage] = useState<HTMLImageElement | null>(null)
  const [activeTab, setActiveTab] = useState<'movement' | 'mechanisms' | 'sensors' | 'control'>('movement')
  const [pathMode, setPathMode] = useState<'roadrunner' | 'pedropathing' | 'simple'>('simple')
  const [blockSearchQuery, setBlockSearchQuery] = useState('')
  const [useCurves, setUseCurves] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [selectedExportMode, setSelectedExportMode] = useState<'roadrunner' | 'pedropathing' | 'simple' | 'encoder'>('simple')
  const [saveExportPreference, setSaveExportPreference] = useState(false)

  // Load saved export preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('vingvis-export-mode')
    const savedPreference = localStorage.getItem('vingvis-save-export-preference')

    if (savedMode && savedPreference === 'true') {
      setSelectedExportMode(savedMode as 'roadrunner' | 'pedropathing' | 'simple' | 'encoder')
      setSaveExportPreference(true)
    }
  }, [])

  // Sidebar drag and resize states
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [sidebarPosition, setSidebarPosition] = useState({ x: 0, y: 0 })
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false)
  const [isSidebarFloating, setIsSidebarFloating] = useState(false)

  // Refs for smooth dragging/resizing without causing re-renders
  const sidebarRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const sidebarAnimationFrameRef = useRef<number | null>(null)
  const currentWidthRef = useRef(320)
  const currentPositionRef = useRef({ x: 0, y: 0 })

  // Map field panel states
  const [mapFieldCollapsed, setMapFieldCollapsed] = useState(false)
  const [mapFieldHeight, setMapFieldHeight] = useState(450)
  const [isResizingMapField, setIsResizingMapField] = useState(false)
  const mapFieldRef = useRef<HTMLDivElement>(null)
  const mapFieldAnimationFrameRef = useRef<number | null>(null)
  const currentMapFieldHeightRef = useRef(450)

  // Hardware status panel states
  const [hardwareStatusCollapsed, setHardwareStatusCollapsed] = useState(false)
  const [hardwareStatusHeight, setHardwareStatusHeight] = useState(200)
  const [isResizingHardwareStatus, setIsResizingHardwareStatus] = useState(false)
  const hardwareStatusRef = useRef<HTMLDivElement>(null)
  const hardwareStatusAnimationFrameRef = useRef<number | null>(null)
  const currentHardwareStatusHeightRef = useRef(200)

  // Right sidebar states
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(384)
  const [isResizingRightSidebar, setIsResizingRightSidebar] = useState(false)
  const rightSidebarRef = useRef<HTMLDivElement>(null)
  const rightSidebarAnimationFrameRef = useRef<number | null>(null)
  const currentRightSidebarWidthRef = useRef(384)

  // Hardware configuration dialog states
  type ConfigDialogType = 'motor' | 'servo' | 'i2c' | 'digital' | 'analog' | 'expansion-hub' | null
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [configDialogType, setConfigDialogType] = useState<ConfigDialogType>(null)
  const [configDialogHub, setConfigDialogHub] = useState<'control' | 'expansion'>('control')
  const [configDialogPort, setConfigDialogPort] = useState(0)

  const [actions, setActions] = useState<ActionBlock[]>([])
  const [selectedAction, setSelectedAction] = useState<ActionBlock | null>(null)

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([
    {
      id: 'start',
      type: 'startNode',
      position: { x: 50, y: 200 },
      data: { label: 'Start', type: 'start' } as BlockNodeData,
    },
  ])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node<BlockNodeData> | null>(null)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  const [isAnimating, setIsAnimating] = useState(false)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [animationSpeed, setAnimationSpeed] = useState(1)

  // Node preview states
  const [isNodePreviewing, setIsNodePreviewing] = useState(false)
  const [currentPreviewNodeIndex, setCurrentPreviewNodeIndex] = useState(0)
  const [nodePreviewSpeed, setNodePreviewSpeed] = useState(1)
  const nodePreviewTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Field preview animation states
  const [fieldAnimationProgress, setFieldAnimationProgress] = useState(0)
  const [isFieldAnimating, setIsFieldAnimating] = useState(false)
  const fieldAnimationRef = useRef<number | null>(null)

  const [robotX, setRobotX] = useState(72)
  const [robotY, setRobotY] = useState(72)
  const [robotHeading, setRobotHeading] = useState(0)
  const [isDraggingRobot, setIsDraggingRobot] = useState(false)
  const [path, setPath] = useState<{x: number, y: number, heading: number}[]>([])

  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastDrawnPoint, setLastDrawnPoint] = useState<{ x: number; y: number } | null>(null)
  const [drawnPoints, setDrawnPoints] = useState<{x: number, y: number}[]>([])

  // Fullscreen and waypoint interaction states
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showWaypoints, setShowWaypoints] = useState(true)
  const [draggedWaypointIndex, setDraggedWaypointIndex] = useState<number | null>(null)
  const [isRotatingRobot, setIsRotatingRobot] = useState(false)
  const fieldContainerRef = useRef<HTMLDivElement>(null)

  // Initialize all hardware ports as empty/disabled
  // FTC Control Hub/Expansion Hub have fixed port counts
  const initializeMotorPorts = (hub: 'control' | 'expansion'): Motor[] =>
    Array.from({ length: 4 }, (_, i) => ({
      name: `motor${i}`,
      port: i,
      reversed: false,
      hub,
      enabled: false,
      encoderEnabled: false
    }))

  const initializeServoPorts = (hub: 'control' | 'expansion'): Servo[] =>
    Array.from({ length: 6 }, (_, i) => ({
      name: `servo${i}`,
      port: i,
      hub,
      type: 'standard' as const,
      enabled: false
    }))

  const initializeI2CPorts = (hub: 'control' | 'expansion'): I2CDevice[] =>
    Array.from({ length: 4 }, (_, i) => ({
      name: i === 0 ? 'imu' : `i2c${i}`,
      type: i === 0 ? ('imu' as const) : ('distance' as const),
      address: i === 0 ? '0x28' : '0x00',
      bus: i,
      hub,
      enabled: i === 0 // Built-in IMU on bus 0 is enabled by default
    }))

  const initializeDigitalPorts = (hub: 'control' | 'expansion'): DigitalDevice[] =>
    Array.from({ length: 8 }, (_, i) => ({
      name: `digital${i}`,
      type: 'touch' as const,
      port: i,
      hub,
      enabled: false
    }))

  const initializeAnalogPorts = (hub: 'control' | 'expansion'): AnalogDevice[] =>
    Array.from({ length: 4 }, (_, i) => ({
      name: `analog${i}`,
      type: 'potentiometer' as const,
      port: i,
      hub,
      enabled: false
    }))

  const [controlMotors, setControlMotors] = useState<Motor[]>(initializeMotorPorts('control'))
  const [expansionMotors, setExpansionMotors] = useState<Motor[]>(initializeMotorPorts('expansion'))

  const [controlServos, setControlServos] = useState<Servo[]>(initializeServoPorts('control'))
  const [expansionServos, setExpansionServos] = useState<Servo[]>(initializeServoPorts('expansion'))

  const [controlI2C, setControlI2C] = useState<I2CDevice[]>(initializeI2CPorts('control'))
  const [expansionI2C, setExpansionI2C] = useState<I2CDevice[]>(initializeI2CPorts('expansion'))

  const [controlDigital, setControlDigital] = useState<DigitalDevice[]>(initializeDigitalPorts('control'))
  const [expansionDigital, setExpansionDigital] = useState<DigitalDevice[]>(initializeDigitalPorts('expansion'))

  const [controlAnalog, setControlAnalog] = useState<AnalogDevice[]>(initializeAnalogPorts('control'))
  const [expansionAnalog, setExpansionAnalog] = useState<AnalogDevice[]>(initializeAnalogPorts('expansion'))

  const [hasExpansionHub, setHasExpansionHub] = useState(false)

  // Helper to get all enabled devices of a type
  const motors = [...controlMotors, ...(hasExpansionHub ? expansionMotors : [])].filter(m => m.enabled)
  const servos = [...controlServos, ...(hasExpansionHub ? expansionServos : [])].filter(s => s.enabled)
  const i2cDevices = [...controlI2C, ...(hasExpansionHub ? expansionI2C : [])].filter(d => d.enabled)
  const digitalDevices = [...controlDigital, ...(hasExpansionHub ? expansionDigital : [])].filter(d => d.enabled)
  const analogDevices = [...controlAnalog, ...(hasExpansionHub ? expansionAnalog : [])].filter(d => d.enabled)

  // Undo/Redo
  const [actionHistory, setActionHistory] = useState<ActionBlock[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Servo/Motor preview states
  const [servoPositions, setServoPositions] = useState<{[key: string]: number}>({})
  const [motorSpeeds, setMotorSpeeds] = useState<{[key: string]: number}>({})

  // Sidebar resize handlers - optimized with RAF and refs
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingSidebar(true)
    currentWidthRef.current = sidebarWidth
  }

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingSidebar || !sidebarRef.current) return

    // Cancel any pending animation frame
    if (sidebarAnimationFrameRef.current) {
      cancelAnimationFrame(sidebarAnimationFrameRef.current)
    }

    // Use RAF for smooth updates
    sidebarAnimationFrameRef.current = requestAnimationFrame(() => {
      const baseX = isSidebarFloating ? currentPositionRef.current.x : 0
      const newWidth = Math.max(250, Math.min(600, e.clientX - baseX))
      currentWidthRef.current = newWidth

      // Update DOM directly for performance
      if (sidebarRef.current) {
        sidebarRef.current.style.width = `${newWidth}px`
      }
    })
  }, [isResizingSidebar, isSidebarFloating])

  const handleResizeEnd = useCallback(() => {
    if (sidebarAnimationFrameRef.current) {
      cancelAnimationFrame(sidebarAnimationFrameRef.current)
    }
    setIsResizingSidebar(false)
    // Update state once at the end
    setSidebarWidth(currentWidthRef.current)
  }, [])

  // Sidebar drag handlers - optimized with RAF and refs
  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingSidebar(true)

    // Get the sidebar element position, not the drag handle
    if (sidebarRef.current) {
      const sidebarRect = sidebarRef.current.getBoundingClientRect()
      dragOffsetRef.current = {
        x: e.clientX - sidebarRect.left,
        y: e.clientY - sidebarRect.top
      }
    }
    currentPositionRef.current = sidebarPosition
  }

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDraggingSidebar || !sidebarRef.current) return

    // Cancel any pending animation frame
    if (sidebarAnimationFrameRef.current) {
      cancelAnimationFrame(sidebarAnimationFrameRef.current)
    }

    // Use RAF for smooth updates
    sidebarAnimationFrameRef.current = requestAnimationFrame(() => {
      const newX = e.clientX - dragOffsetRef.current.x
      const newY = e.clientY - dragOffsetRef.current.y
      currentPositionRef.current = { x: newX, y: newY }

      // Update DOM directly for performance
      if (sidebarRef.current) {
        sidebarRef.current.style.left = `${newX}px`
        sidebarRef.current.style.top = `${newY}px`
      }
    })
  }, [isDraggingSidebar])

  const handleDragEnd = useCallback(() => {
    if (sidebarAnimationFrameRef.current) {
      cancelAnimationFrame(sidebarAnimationFrameRef.current)
    }
    setIsDraggingSidebar(false)
    // Update state once at the end
    setSidebarPosition(currentPositionRef.current)
  }, [])

  // Map field resize handlers
  const handleMapFieldResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingMapField(true)
    currentMapFieldHeightRef.current = mapFieldHeight
  }

  const handleMapFieldResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingMapField || !mapFieldRef.current) return

    if (mapFieldAnimationFrameRef.current) {
      cancelAnimationFrame(mapFieldAnimationFrameRef.current)
    }

    mapFieldAnimationFrameRef.current = requestAnimationFrame(() => {
      if (!mapFieldRef.current) return
      const rect = mapFieldRef.current.getBoundingClientRect()
      const newHeight = Math.max(300, Math.min(800, rect.bottom - e.clientY))
      currentMapFieldHeightRef.current = newHeight

      if (mapFieldRef.current) {
        mapFieldRef.current.style.height = `${newHeight}px`
      }
    })
  }, [isResizingMapField])

  const handleMapFieldResizeEnd = useCallback(() => {
    if (mapFieldAnimationFrameRef.current) {
      cancelAnimationFrame(mapFieldAnimationFrameRef.current)
    }
    setIsResizingMapField(false)
    setMapFieldHeight(currentMapFieldHeightRef.current)
  }, [])

  // Hardware status resize handlers
  const handleHardwareStatusResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingHardwareStatus(true)
    currentHardwareStatusHeightRef.current = hardwareStatusHeight
  }

  const handleHardwareStatusResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingHardwareStatus || !hardwareStatusRef.current) return

    if (hardwareStatusAnimationFrameRef.current) {
      cancelAnimationFrame(hardwareStatusAnimationFrameRef.current)
    }

    hardwareStatusAnimationFrameRef.current = requestAnimationFrame(() => {
      if (!hardwareStatusRef.current) return
      const rect = hardwareStatusRef.current.getBoundingClientRect()
      const newHeight = Math.max(150, Math.min(500, e.clientY - rect.top))
      currentHardwareStatusHeightRef.current = newHeight

      if (hardwareStatusRef.current) {
        hardwareStatusRef.current.style.height = `${newHeight}px`
      }
    })
  }, [isResizingHardwareStatus])

  const handleHardwareStatusResizeEnd = useCallback(() => {
    if (hardwareStatusAnimationFrameRef.current) {
      cancelAnimationFrame(hardwareStatusAnimationFrameRef.current)
    }
    setIsResizingHardwareStatus(false)
    setHardwareStatusHeight(currentHardwareStatusHeightRef.current)
  }, [])

  // Right sidebar resize handlers
  const handleRightSidebarResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizingRightSidebar(true)
    currentRightSidebarWidthRef.current = rightSidebarWidth
  }

  const handleRightSidebarResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingRightSidebar || !rightSidebarRef.current) return

    if (rightSidebarAnimationFrameRef.current) {
      cancelAnimationFrame(rightSidebarAnimationFrameRef.current)
    }

    rightSidebarAnimationFrameRef.current = requestAnimationFrame(() => {
      if (!rightSidebarRef.current) return
      const rect = rightSidebarRef.current.getBoundingClientRect()
      const newWidth = Math.max(300, Math.min(600, rect.right - e.clientX))
      currentRightSidebarWidthRef.current = newWidth

      if (rightSidebarRef.current) {
        rightSidebarRef.current.style.width = `${newWidth}px`
      }
    })
  }, [isResizingRightSidebar])

  const handleRightSidebarResizeEnd = useCallback(() => {
    if (rightSidebarAnimationFrameRef.current) {
      cancelAnimationFrame(rightSidebarAnimationFrameRef.current)
    }
    setIsResizingRightSidebar(false)
    setRightSidebarWidth(currentRightSidebarWidthRef.current)
  }, [])

  // Add mouse move and up listeners
  useEffect(() => {
    if (isResizingSidebar) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleResizeMove)
        document.removeEventListener('mouseup', handleResizeEnd)
      }
    }
  }, [isResizingSidebar, handleResizeMove, handleResizeEnd])

  useEffect(() => {
    if (isDraggingSidebar) {
      document.addEventListener('mousemove', handleDragMove)
      document.addEventListener('mouseup', handleDragEnd)
      return () => {
        document.removeEventListener('mousemove', handleDragMove)
        document.removeEventListener('mouseup', handleDragEnd)
      }
    }
  }, [isDraggingSidebar, handleDragMove, handleDragEnd])

  // Sync refs with state
  useEffect(() => {
    currentWidthRef.current = sidebarWidth
    currentPositionRef.current = sidebarPosition
  }, [sidebarWidth, sidebarPosition])

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (sidebarAnimationFrameRef.current) {
        cancelAnimationFrame(sidebarAnimationFrameRef.current)
      }
    }
  }, [])

  // Map field resize listeners
  useEffect(() => {
    if (isResizingMapField) {
      document.addEventListener('mousemove', handleMapFieldResizeMove)
      document.addEventListener('mouseup', handleMapFieldResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleMapFieldResizeMove)
        document.removeEventListener('mouseup', handleMapFieldResizeEnd)
      }
    }
  }, [isResizingMapField, handleMapFieldResizeMove, handleMapFieldResizeEnd])

  // Hardware status resize listeners
  useEffect(() => {
    if (isResizingHardwareStatus) {
      document.addEventListener('mousemove', handleHardwareStatusResizeMove)
      document.addEventListener('mouseup', handleHardwareStatusResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleHardwareStatusResizeMove)
        document.removeEventListener('mouseup', handleHardwareStatusResizeEnd)
      }
    }
  }, [isResizingHardwareStatus, handleHardwareStatusResizeMove, handleHardwareStatusResizeEnd])

  // Right sidebar resize listeners
  useEffect(() => {
    if (isResizingRightSidebar) {
      document.addEventListener('mousemove', handleRightSidebarResizeMove)
      document.addEventListener('mouseup', handleRightSidebarResizeEnd)
      return () => {
        document.removeEventListener('mousemove', handleRightSidebarResizeMove)
        document.removeEventListener('mouseup', handleRightSidebarResizeEnd)
      }
    }
  }, [isResizingRightSidebar, handleRightSidebarResizeMove, handleRightSidebarResizeEnd])

  // Sync refs with state for map field and hardware status
  useEffect(() => {
    currentMapFieldHeightRef.current = mapFieldHeight
    currentHardwareStatusHeightRef.current = hardwareStatusHeight
    currentRightSidebarWidthRef.current = rightSidebarWidth
  }, [mapFieldHeight, hardwareStatusHeight, rightSidebarWidth])

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (mapFieldAnimationFrameRef.current) {
        cancelAnimationFrame(mapFieldAnimationFrameRef.current)
      }
      if (hardwareStatusAnimationFrameRef.current) {
        cancelAnimationFrame(hardwareStatusAnimationFrameRef.current)
      }
      if (rightSidebarAnimationFrameRef.current) {
        cancelAnimationFrame(rightSidebarAnimationFrameRef.current)
      }
    }
  }, [])

  // Prevent text selection during drag/resize
  useEffect(() => {
    if (isDraggingSidebar || isResizingSidebar || isResizingMapField || isResizingHardwareStatus || isResizingRightSidebar) {
      document.body.style.userSelect = 'none'
      if (isDraggingSidebar) {
        document.body.style.cursor = 'move'
      } else if (isResizingSidebar || isResizingRightSidebar) {
        document.body.style.cursor = 'col-resize'
      } else if (isResizingMapField || isResizingHardwareStatus) {
        document.body.style.cursor = 'row-resize'
      }
    } else {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
    return () => {
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [isDraggingSidebar, isResizingSidebar, isResizingMapField, isResizingHardwareStatus, isResizingRightSidebar])

  // Hardware configuration dialog helper
  const openConfigDialog = (type: ConfigDialogType, hub: 'control' | 'expansion', port: number) => {
    setConfigDialogType(type)
    setConfigDialogHub(hub)
    setConfigDialogPort(port)
    setConfigDialogOpen(true)
  }

  const closeConfigDialog = () => {
    setConfigDialogOpen(false)
  }

  useEffect(() => {
    // Determine guest mode from URL (reliable) or sessionStorage (fallback)
    const isGuestProject = params.username === 'guest'
    if (typeof window !== 'undefined') {
      // If URL indicates guest mode, set sessionStorage for consistency
      if (isGuestProject) {
        sessionStorage.setItem('guestMode', 'true')
      }
      setIsGuest(isGuestProject)
    }
  }, [params.username])

  // Load field image when selected field changes
  useEffect(() => {
    const img = new Image()
    img.src = `/fields/${selectedField}.webp`
    img.onload = () => {
      setFieldImage(img)
    }
    img.onerror = () => {
      console.error('Failed to load field image:', selectedField)
    }
  }, [selectedField])

  useEffect(() => {
    if (params.projecthash) {
      // Check if this is a guest project by looking at the URL (more reliable than sessionStorage)
      const isGuestProject = params.username === 'guest'

      if (user && !isGuestProject) {
        // Authenticated user loading their own project
        loadProject()
      } else if (!authLoading && isGuestProject) {
        // Guest mode - load from localStorage
        // Set sessionStorage for consistency with other parts of the app
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('guestMode', 'true')
        }
        loadGuestProject()
      } else if (!authLoading && !user && !isGuestProject) {
        // Not authenticated, not a guest project - redirect to dashboard
        console.log('Not authenticated and not a guest project, redirecting to dashboard')
        router.push('/dashboard')
      }
    }
  }, [user, params.projecthash, params.username, authLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Safety timeout: if loading takes more than 10 seconds, redirect to dashboard
  useEffect(() => {
    if (loading && !authLoading) {
      const timeout = setTimeout(() => {
        console.error('Loading timeout - redirecting to dashboard')
        router.push('/dashboard')
      }, 10000) // 10 second timeout

      return () => clearTimeout(timeout)
    }
  }, [loading, authLoading])

  // Apply motor configuration from project to hardware ports
  useEffect(() => {
    if (!project || !project.motor_config) return

    const motorConfig = project.motor_config

    // Helper to update motors based on motor_config
    const applyMotorConfig = () => {
      // Map of motor config keys to their data
      const configMap: { [key: string]: { name: string; port: number; hub: 'control' | 'expansion' } } = {
        fl: motorConfig.fl,
        fr: motorConfig.fr,
        bl: motorConfig.bl,
        br: motorConfig.br,
        cl: motorConfig.cl,
        cr: motorConfig.cr,
      }

      // Update control hub motors
      setControlMotors(prevMotors => {
        const updatedMotors = [...prevMotors]

        // Apply FL motor (port 0)
        if (configMap.fl && configMap.fl.hub === 'control') {
          updatedMotors[configMap.fl.port] = {
            ...updatedMotors[configMap.fl.port],
            name: configMap.fl.name,
            port: configMap.fl.port,
            enabled: true,
          }
        }

        // Apply FR motor (port 1)
        if (configMap.fr && configMap.fr.hub === 'control') {
          updatedMotors[configMap.fr.port] = {
            ...updatedMotors[configMap.fr.port],
            name: configMap.fr.name,
            port: configMap.fr.port,
            enabled: true,
          }
        }

        // Apply BL motor (port 2)
        if (configMap.bl && configMap.bl.hub === 'control') {
          updatedMotors[configMap.bl.port] = {
            ...updatedMotors[configMap.bl.port],
            name: configMap.bl.name,
            port: configMap.bl.port,
            enabled: true,
          }
        }

        // Apply BR motor (port 3)
        if (configMap.br && configMap.br.hub === 'control') {
          updatedMotors[configMap.br.port] = {
            ...updatedMotors[configMap.br.port],
            name: configMap.br.name,
            port: configMap.br.port,
            enabled: true,
          }
        }

        // Apply CL motor (for H-Drive)
        if (configMap.cl && configMap.cl.hub === 'control') {
          updatedMotors[configMap.cl.port] = {
            ...updatedMotors[configMap.cl.port],
            name: configMap.cl.name,
            port: configMap.cl.port,
            enabled: true,
          }
        }

        // Apply CR motor (for Swerve)
        if (configMap.cr && configMap.cr.hub === 'control') {
          updatedMotors[configMap.cr.port] = {
            ...updatedMotors[configMap.cr.port],
            name: configMap.cr.name,
            port: configMap.cr.port,
            enabled: true,
          }
        }

        return updatedMotors
      })

      // Update expansion hub motors
      setExpansionMotors(prevMotors => {
        const updatedMotors = [...prevMotors]

        // Apply FL motor
        if (configMap.fl && configMap.fl.hub === 'expansion') {
          updatedMotors[configMap.fl.port] = {
            ...updatedMotors[configMap.fl.port],
            name: configMap.fl.name,
            port: configMap.fl.port,
            enabled: true,
          }
        }

        // Apply FR motor
        if (configMap.fr && configMap.fr.hub === 'expansion') {
          updatedMotors[configMap.fr.port] = {
            ...updatedMotors[configMap.fr.port],
            name: configMap.fr.name,
            port: configMap.fr.port,
            enabled: true,
          }
        }

        // Apply BL motor
        if (configMap.bl && configMap.bl.hub === 'expansion') {
          updatedMotors[configMap.bl.port] = {
            ...updatedMotors[configMap.bl.port],
            name: configMap.bl.name,
            port: configMap.bl.port,
            enabled: true,
          }
        }

        // Apply BR motor
        if (configMap.br && configMap.br.hub === 'expansion') {
          updatedMotors[configMap.br.port] = {
            ...updatedMotors[configMap.br.port],
            name: configMap.br.name,
            port: configMap.br.port,
            enabled: true,
          }
        }

        // Apply CL motor (for H-Drive)
        if (configMap.cl && configMap.cl.hub === 'expansion') {
          updatedMotors[configMap.cl.port] = {
            ...updatedMotors[configMap.cl.port],
            name: configMap.cl.name,
            port: configMap.cl.port,
            enabled: true,
          }
        }

        // Apply CR motor (for Swerve)
        if (configMap.cr && configMap.cr.hub === 'expansion') {
          updatedMotors[configMap.cr.port] = {
            ...updatedMotors[configMap.cr.port],
            name: configMap.cr.name,
            port: configMap.cr.port,
            enabled: true,
          }
        }

        return updatedMotors
      })

      // Enable expansion hub if any motors are configured on it
      const hasExpansion = Object.values(configMap).some(
        (config) => config && config.hub === 'expansion'
      )
      if (hasExpansion) {
        setHasExpansionHub(true)
      }
    }

    applyMotorConfig()
  }, [project])

  const drawField = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const scale = canvas.width / 144

    // Draw field background image if loaded
    if (fieldImage) {
      ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height)
    } else {
      // Fallback background if image not loaded
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 1
      for (let i = 0; i <= 6; i++) {
        const pos = i * 24 * scale
        ctx.beginPath()
        ctx.moveTo(pos, 0)
        ctx.lineTo(pos, canvas.height)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(0, pos)
        ctx.lineTo(canvas.width, pos)
        ctx.stroke()
      }

      // Border
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 3
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
    }

    // Node preview mode - show path up to current node
    if (isNodePreviewing) {
      // Get waypoints for previous and current node
      const prevNodeIndex = Math.max(0, currentPreviewNodeIndex - 1)
      const prevWaypoints = currentPreviewNodeIndex > 0 ? getWaypointsUpToNode(prevNodeIndex) : [{x: robotX, y: robotY, heading: robotHeading}]
      const currentWaypoints = getWaypointsUpToNode(currentPreviewNodeIndex)

      // Calculate paths for previous and current states
      let prevPath: {x: number, y: number, heading: number}[] = []
      let currentPath: {x: number, y: number, heading: number}[] = []

      // Generate previous path
      if (useCurves && prevWaypoints.length > 2) {
        prevPath = generateSpline(prevWaypoints, 100)
      } else {
        for (let i = 0; i < prevWaypoints.length - 1; i++) {
          const start = prevWaypoints[i]
          const end = prevWaypoints[i + 1]
          const steps = 20
          for (let j = 0; j <= steps; j++) {
            const t = j / steps
            prevPath.push({
              x: start.x + (end.x - start.x) * t,
              y: start.y + (end.y - start.y) * t,
              heading: start.heading + (end.heading - start.heading) * t,
            })
          }
        }
      }

      // Generate current path
      if (useCurves && currentWaypoints.length > 2) {
        currentPath = generateSpline(currentWaypoints, 100)
      } else {
        for (let i = 0; i < currentWaypoints.length - 1; i++) {
          const start = currentWaypoints[i]
          const end = currentWaypoints[i + 1]
          const steps = 20
          for (let j = 0; j <= steps; j++) {
            const t = j / steps
            currentPath.push({
              x: start.x + (end.x - start.x) * t,
              y: start.y + (end.y - start.y) * t,
              heading: start.heading + (end.heading - start.heading) * t,
            })
          }
        }
      }

      // Interpolate between previous and current path during animation
      const animProgress = isFieldAnimating ? fieldAnimationProgress : 1
      let displayPath: {x: number, y: number, heading: number}[] = []

      if (prevPath.length === 0) {
        displayPath = currentPath
      } else {
        // Interpolate the path as it grows
        const targetLength = currentPath.length
        const startLength = prevPath.length
        const currentLength = Math.floor(startLength + (targetLength - startLength) * animProgress)

        for (let i = 0; i < currentLength; i++) {
          if (i < prevPath.length) {
            // Interpolate existing points
            const prevPoint = prevPath[i]
            const currPoint = currentPath[Math.min(i, currentPath.length - 1)]
            displayPath.push({
              x: prevPoint.x + (currPoint.x - prevPoint.x) * animProgress,
              y: prevPoint.y + (currPoint.y - prevPoint.y) * animProgress,
              heading: prevPoint.heading + (currPoint.heading - prevPoint.heading) * animProgress,
            })
          } else {
            // Add new points from current path
            displayPath.push(currentPath[Math.min(i, currentPath.length - 1)])
          }
        }
      }

      // Draw full path in faded color
      if (path.length > 1) {
        ctx.strokeStyle = '#444'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        path.forEach((point, i) => {
          const x = (point.x / 144) * canvas.width
          const y = (point.y / 144) * canvas.height
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Draw animated preview path (up to current node) in highlighted color
      if (displayPath.length > 1) {
        ctx.strokeStyle = '#10b981'
        ctx.lineWidth = 3
        ctx.beginPath()
        displayPath.forEach((point, i) => {
          const x = (point.x / 144) * canvas.width
          const y = (point.y / 144) * canvas.height
          if (i === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        })
        ctx.stroke()
      }

      // Draw waypoints with different colors for completed vs upcoming
      const allWaypoints = getWaypoints()
      allWaypoints.forEach((waypoint, index) => {
        const x = (waypoint.x / 144) * canvas.width
        const y = (waypoint.y / 144) * canvas.height

        // Check if this waypoint is part of the preview (with animation consideration)
        const targetCompleted = index <= currentWaypoints.length - 1
        const prevCompleted = index <= prevWaypoints.length - 1
        const isCompleted = prevCompleted || (targetCompleted && animProgress > 0.5)

        // Draw waypoint circle
        ctx.fillStyle = isCompleted ? '#10b981' : '#666'
        ctx.strokeStyle = isCompleted ? '#ffffff' : '#888'
        ctx.lineWidth = isCompleted ? 2 : 1
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Draw waypoint number
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(index.toString(), x, y)

        // Draw heading indicator for completed waypoints
        if (index > 0 && isCompleted) {
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 2
          ctx.beginPath()
          const headingX = x + 15 * Math.cos((waypoint.heading * Math.PI) / 180)
          const headingY = y + 15 * Math.sin((waypoint.heading * Math.PI) / 180)
          ctx.moveTo(x, y)
          ctx.lineTo(headingX, headingY)
          ctx.stroke()
        }
      })

      // Draw robot at animated position
      if (displayPath.length > 0) {
        const currentPos = displayPath[displayPath.length - 1]
        drawRobot(ctx, currentPos.x, currentPos.y, currentPos.heading, scale)
      } else if (prevWaypoints.length > 0) {
        const prevPos = prevWaypoints[prevWaypoints.length - 1]
        const currPos = currentWaypoints.length > 0 ? currentWaypoints[currentWaypoints.length - 1] : prevPos
        const x = prevPos.x + (currPos.x - prevPos.x) * animProgress
        const y = prevPos.y + (currPos.y - prevPos.y) * animProgress
        const heading = prevPos.heading + (currPos.heading - prevPos.heading) * animProgress
        drawRobot(ctx, x, y, heading, scale)
      } else {
        drawRobot(ctx, robotX, robotY, robotHeading, scale)
      }
      return
    }

    // Draw path
    if (path.length > 1) {
      // Full path (static)
      ctx.strokeStyle = useCurves ? '#3b82f6' : '#666'
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      path.forEach((point, i) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()
      ctx.globalAlpha = 1

      // Animated portion
      if (isAnimating && animationProgress > 0) {
        const numPoints = path.length
        const currentIndex = Math.floor(animationProgress * (numPoints - 1))
        const nextIndex = Math.min(currentIndex + 1, numPoints - 1)
        const t = (animationProgress * (numPoints - 1)) - currentIndex

        if (currentIndex < path.length && nextIndex < path.length) {
          const current = path[currentIndex]
          const next = path[nextIndex]
          const interpX = current.x + (next.x - current.x) * t
          const interpY = current.y + (next.y - current.y) * t
          const interpHeading = current.heading + (next.heading - current.heading) * t

          // Animated path
          ctx.strokeStyle = '#10b981'
          ctx.lineWidth = 3
          ctx.beginPath()
          for (let i = 0; i <= currentIndex; i++) {
            const x = (path[i].x / 144) * canvas.width
            const y = (path[i].y / 144) * canvas.height
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          const finalX = (interpX / 144) * canvas.width
          const finalY = (interpY / 144) * canvas.height
          ctx.lineTo(finalX, finalY)
          ctx.stroke()

          drawRobot(ctx, interpX, interpY, interpHeading, scale)
          return
        }
      }
    }

    drawRobot(ctx, robotX, robotY, robotHeading, scale)

    // Draw current drawing path
    if (isDrawing && drawnPoints.length > 0) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 3
      ctx.beginPath()
      drawnPoints.forEach((point, i) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      // Draw points
      drawnPoints.forEach((point) => {
        const x = (point.x / 144) * canvas.width
        const y = (point.y / 144) * canvas.height
        ctx.fillStyle = '#fbbf24'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Draw waypoint markers for each node block
    if (showWaypoints && !isAnimating) {
      const waypoints = getWaypoints()
      waypoints.forEach((waypoint, index) => {
        const x = (waypoint.x / 144) * canvas.width
        const y = (waypoint.y / 144) * canvas.height

        // Draw waypoint circle
        ctx.fillStyle = index === 0 ? '#10b981' : '#3b82f6'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Draw waypoint number
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(index.toString(), x, y)

        // Draw heading indicator
        if (index > 0) {
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 2
          ctx.beginPath()
          const headingX = x + 15 * Math.cos((waypoint.heading * Math.PI) / 180)
          const headingY = y + 15 * Math.sin((waypoint.heading * Math.PI) / 180)
          ctx.moveTo(x, y)
          ctx.lineTo(headingX, headingY)
          ctx.stroke()
        }
      })
    }

    // Ruler
    if (showRuler) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo((robotX / 144) * canvas.width, 0)
      ctx.lineTo((robotX / 144) * canvas.width, canvas.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, (robotY / 144) * canvas.height)
      ctx.lineTo(canvas.width, (robotY / 144) * canvas.height)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [robotX, robotY, robotHeading, path, showRuler, animationProgress, isAnimating, useCurves, fieldImage, isDrawing, drawnPoints, showWaypoints, nodes, edges, isNodePreviewing, currentPreviewNodeIndex, isFieldAnimating, fieldAnimationProgress])

  useEffect(() => {
    drawField()
  }, [drawField])

  const drawRobot = (ctx: CanvasRenderingContext2D, x: number, y: number, heading: number, scale: number) => {
    const canvasX = (x / 144) * ctx.canvas.width
    const canvasY = (y / 144) * ctx.canvas.height
    const robotSize = (18 / 144) * ctx.canvas.width

    ctx.save()
    ctx.translate(canvasX, canvasY)
    ctx.rotate((heading * Math.PI) / 180)

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(-robotSize / 2 + 2, -robotSize / 2 + 2, robotSize, robotSize)

    // Body
    ctx.fillStyle = '#10b981'
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 2
    ctx.fillRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)
    ctx.strokeRect(-robotSize / 2, -robotSize / 2, robotSize, robotSize)

    // Front indicator
    ctx.fillStyle = '#fbbf24'
    ctx.beginPath()
    ctx.moveTo(robotSize / 2, 0)
    ctx.lineTo(robotSize / 2 - 10, -8)
    ctx.lineTo(robotSize / 2 - 10, 8)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  const getWaypoints = (): {x: number, y: number, heading: number}[] => {
    const waypoints: {x: number, y: number, heading: number}[] = [{x: robotX, y: robotY, heading: robotHeading}]

    let currentX = robotX
    let currentY = robotY
    let currentHeading = robotHeading

    // Build ordered list of nodes by following edges from start
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    const traverseNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (node && node.type === 'blockNode') {
        orderedNodes.push(node)
      }

      // Find outgoing edges
      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => traverseNodes(edge.target))
    }

    traverseNodes('start')

    // Process each node in order
    orderedNodes.forEach(node => {
      const data = node.data

      if (data.type === 'moveToPosition' || data.type === 'splineTo') {
        currentX = data.targetX || currentX
        currentY = data.targetY || currentY
        currentHeading = data.targetHeading !== undefined ? data.targetHeading : currentHeading
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'forward') {
        const distance = data.distance || 24
        currentX += distance * Math.cos((currentHeading * Math.PI) / 180)
        currentY += distance * Math.sin((currentHeading * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'backward') {
        const distance = data.distance || 24
        currentX -= distance * Math.cos((currentHeading * Math.PI) / 180)
        currentY -= distance * Math.sin((currentHeading * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'strafeLeft') {
        const distance = data.distance || 24
        currentX += distance * Math.cos(((currentHeading - 90) * Math.PI) / 180)
        currentY += distance * Math.sin(((currentHeading - 90) * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'strafeRight') {
        const distance = data.distance || 24
        currentX += distance * Math.cos(((currentHeading + 90) * Math.PI) / 180)
        currentY += distance * Math.sin(((currentHeading + 90) * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnLeft') {
        currentHeading -= data.angle || 90
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnRight') {
        currentHeading += data.angle || 90
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnToHeading') {
        currentHeading = data.targetHeading || currentHeading
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      }
    })

    return waypoints
  }

  // Get nodes in execution order by following edges from StartNode
  const getNodesInExecutionOrder = (): Node<BlockNodeData>[] => {
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    // Find the start node
    const startNode = nodes.find(node => node.type === 'startNode')
    if (!startNode) return orderedNodes

    let currentNodeId: string | null = startNode.id

    // Follow edges from start to end
    while (currentNodeId && !visited.has(currentNodeId)) {
      const currentNode = nodes.find(node => node.id === currentNodeId)
      if (!currentNode) break

      // Skip start and end nodes in the preview
      if (currentNode.type !== 'startNode' && currentNode.type !== 'endNode') {
        orderedNodes.push(currentNode)
      }
      visited.add(currentNodeId)

      // Find the next node by following edges
      const outgoingEdge = edges.find(edge => edge.source === currentNodeId)
      currentNodeId = outgoingEdge?.target || null
    }

    return orderedNodes
  }

  // Get waypoints up to a specific node index for preview mode
  const getWaypointsUpToNode = (nodeIndex: number): {x: number, y: number, heading: number}[] => {
    const waypoints: {x: number, y: number, heading: number}[] = []
    let currentX = robotX
    let currentY = robotY
    let currentHeading = robotHeading

    // Start position
    waypoints.push({x: currentX, y: currentY, heading: currentHeading})

    // Get ordered nodes
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    const traverseNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (node && node.type === 'blockNode') {
        orderedNodes.push(node)
      }

      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => traverseNodes(edge.target))
    }

    traverseNodes('start')

    // Process nodes up to the specified index
    const nodesToProcess = orderedNodes.slice(0, nodeIndex + 1)
    nodesToProcess.forEach(node => {
      const data = node.data

      if (data.type === 'moveToPosition' || data.type === 'splineTo') {
        currentX = data.targetX || currentX
        currentY = data.targetY || currentY
        currentHeading = data.targetHeading !== undefined ? data.targetHeading : currentHeading
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'forward') {
        const distance = data.distance || 24
        currentX += distance * Math.cos((currentHeading * Math.PI) / 180)
        currentY += distance * Math.sin((currentHeading * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'backward') {
        const distance = data.distance || 24
        currentX -= distance * Math.cos((currentHeading * Math.PI) / 180)
        currentY -= distance * Math.sin((currentHeading * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'strafeLeft') {
        const distance = data.distance || 24
        currentX += distance * Math.cos(((currentHeading - 90) * Math.PI) / 180)
        currentY += distance * Math.sin(((currentHeading - 90) * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'strafeRight') {
        const distance = data.distance || 24
        currentX += distance * Math.cos(((currentHeading + 90) * Math.PI) / 180)
        currentY += distance * Math.sin(((currentHeading + 90) * Math.PI) / 180)
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnLeft') {
        currentHeading -= data.angle || 90
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnRight') {
        currentHeading += data.angle || 90
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      } else if (data.type === 'turnToHeading') {
        currentHeading = data.targetHeading || currentHeading
        waypoints.push({x: currentX, y: currentY, heading: currentHeading})
      }
    })

    return waypoints
  }

  const calculatePath = () => {
    const waypoints = getWaypoints()

    if (useCurves && waypoints.length > 2) {
      // Use spline interpolation for smooth curves
      const smoothPath = generateSpline(waypoints, 100)
      setPath(smoothPath)
      return smoothPath
    } else {
      // Linear interpolation
      const linearPath: {x: number, y: number, heading: number}[] = []
      for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i]
        const end = waypoints[i + 1]
        const steps = 20
        for (let j = 0; j <= steps; j++) {
          const t = j / steps
          linearPath.push({
            x: start.x + (end.x - start.x) * t,
            y: start.y + (end.y - start.y) * t,
            heading: start.heading + (end.heading - start.heading) * t,
          })
        }
      }
      setPath(linearPath)
      return linearPath
    }
  }

  const updateWaypointPosition = (waypointIndex: number, newX: number, newY: number) => {
    // Get current waypoints and find which node corresponds to this waypoint
    const waypoints = getWaypoints()
    if (waypointIndex >= waypoints.length) return

    // Build ordered list of nodes
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    const traverseNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (node && node.type === 'blockNode') {
        orderedNodes.push(node)
      }

      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => traverseNodes(edge.target))
    }

    traverseNodes('start')

    // The waypoint index (minus 1 since index 0 is robot start) maps to the node
    const nodeIndex = waypointIndex - 1
    if (nodeIndex < 0 || nodeIndex >= orderedNodes.length) return

    const targetNode = orderedNodes[nodeIndex]

    // Update the node's target position
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === targetNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              targetX: newX,
              targetY: newY,
            },
          }
        }
        return node
      })
    )
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 144
    const y = ((e.clientY - rect.top) / rect.height) * 144

    // Drawing mode - start drawing
    if (isDrawingMode) {
      setIsDrawing(true)
      setLastDrawnPoint({ x, y })
      setDrawnPoints([{ x, y }])
      return
    }

    // Check if clicking on robot - shift+click to rotate, otherwise drag
    const robotDistance = Math.sqrt(Math.pow(x - robotX, 2) + Math.pow(y - robotY, 2))
    if (robotDistance < 15) {
      if (e.shiftKey) {
        setIsRotatingRobot(true)
      } else {
        setIsDraggingRobot(true)
      }
      return
    }

    // Check if clicking on a waypoint
    if (showWaypoints && !isAnimating) {
      const waypoints = getWaypoints()
      for (let i = 1; i < waypoints.length; i++) { // Skip first waypoint (robot start position)
        const waypoint = waypoints[i]
        const distance = Math.sqrt(Math.pow(x - waypoint.x, 2) + Math.pow(y - waypoint.y, 2))
        if (distance < 10) {
          setDraggedWaypointIndex(i)
          return
        }
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = Math.max(9, Math.min(135, ((e.clientX - rect.left) / rect.width) * 144))
    const y = Math.max(9, Math.min(135, ((e.clientY - rect.top) / rect.height) * 144))

    // Drawing mode - continuously add points
    if (isDrawing && lastDrawnPoint) {
      const dist = Math.sqrt(Math.pow(x - lastDrawnPoint.x, 2) + Math.pow(y - lastDrawnPoint.y, 2))
      // Add point every 5 inches of distance
      if (dist > 5) {
        setDrawnPoints(prev => [...prev, { x, y }])
        setLastDrawnPoint({ x, y })
      }
      return
    }

    // Rotate robot
    if (isRotatingRobot) {
      const angle = Math.atan2(y - robotY, x - robotX) * (180 / Math.PI)
      setRobotHeading(angle)
      return
    }

    // Drag robot
    if (isDraggingRobot) {
      setRobotX(x)
      setRobotY(y)
      return
    }

    // Drag waypoint
    if (draggedWaypointIndex !== null) {
      updateWaypointPosition(draggedWaypointIndex, x, y)
      return
    }
  }

  const handleCanvasMouseUp = () => {
    // Convert drawn points to actions when drawing ends
    if (isDrawing && drawnPoints.length > 1) {
      convertDrawnPointsToActions()
    }

    setIsDraggingRobot(false)
    setIsRotatingRobot(false)
    setIsDrawing(false)
    setLastDrawnPoint(null)
    setDrawnPoints([])
    setDraggedWaypointIndex(null)
  }

  // Ramer-Douglas-Peucker algorithm for intelligent path simplification
  const simplifyPath = (points: {x: number, y: number}[], epsilon: number = 2): {x: number, y: number}[] => {
    if (points.length < 3) return points

    // Find the point with the maximum distance from the line between start and end
    const getPerpendicularDistance = (point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number => {
      const dx = lineEnd.x - lineStart.x
      const dy = lineEnd.y - lineStart.y

      // If the line is actually a point
      if (dx === 0 && dy === 0) {
        return Math.sqrt(Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2))
      }

      // Calculate perpendicular distance
      const numerator = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x)
      const denominator = Math.sqrt(dx * dx + dy * dy)
      return numerator / denominator
    }

    let maxDistance = 0
    let maxIndex = 0
    const start = points[0]
    const end = points[points.length - 1]

    // Find the point with maximum distance
    for (let i = 1; i < points.length - 1; i++) {
      const distance = getPerpendicularDistance(points[i], start, end)
      if (distance > maxDistance) {
        maxDistance = distance
        maxIndex = i
      }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (maxDistance > epsilon) {
      // Recursive call on both segments
      const leftSegment = simplifyPath(points.slice(0, maxIndex + 1), epsilon)
      const rightSegment = simplifyPath(points.slice(maxIndex), epsilon)

      // Combine results (remove duplicate middle point)
      return [...leftSegment.slice(0, -1), ...rightSegment]
    } else {
      // All points between start and end can be removed
      return [start, end]
    }
  }

  const convertDrawnPointsToActions = () => {
    if (drawnPoints.length < 2) return

    // Use Ramer-Douglas-Peucker algorithm for intelligent path simplification
    // This preserves the path shape while using fewer points
    // Epsilon value of 2 inches provides good balance between accuracy and simplification
    const simplified = simplifyPath(drawnPoints, 2)

    // Convert to nodes and create connections
    const newNodes: any[] = []
    const newEdges: any[] = []
    const timestamp = Date.now()

    // Find the last node in the current flow to connect from
    let lastNodeId = 'start'
    let startX = 300 // Default starting X position
    let startY = 200 // Default starting Y position

    if (nodes.length > 1) {
      // Find nodes that don't have outgoing edges
      const nodesWithoutOutgoingEdges = nodes.filter(
        n => n.type === 'blockNode' && !edges.some(e => e.source === n.id)
      )
      if (nodesWithoutOutgoingEdges.length > 0) {
        const lastNode = nodesWithoutOutgoingEdges[nodesWithoutOutgoingEdges.length - 1]
        lastNodeId = lastNode.id
        // Start from the last node's position
        startX = lastNode.position.x + 300
        startY = lastNode.position.y
      }
    }

    // Layout configuration
    const nodeWidth = 280 // Approximate node width
    const nodeHeight = 120 // Approximate node height
    const horizontalSpacing = 350 // Space between nodes horizontally
    const verticalSpacing = 180 // Space between rows
    const nodesPerRow = 4 // Maximum nodes per row before wrapping

    simplified.forEach((point, index) => {
      const nodeId = `moveToPosition-${timestamp}_${index}`

      // Create flowing layout that wraps to new rows
      const row = Math.floor(index / nodesPerRow)
      const col = index % nodesPerRow

      // Calculate position with better flow layout
      const nodeX = startX + (col * horizontalSpacing)
      const nodeY = startY + (row * verticalSpacing)

      newNodes.push({
        id: nodeId,
        type: 'blockNode',
        position: { x: nodeX, y: nodeY },
        data: {
          label: 'Move to Position',
          type: 'moveToPosition',
          targetX: point.x,
          targetY: point.y,
          targetHeading: robotHeading,
          curveType: useCurves ? 'spline' : 'linear',
          distance: 24,
          power: 0.5,
          angle: 90,
          duration: 1,
          position: 0.5,
          score: 0,
        } as BlockNodeData,
      })

      // Create edge from previous node
      if (index === 0) {
        newEdges.push({
          id: `${lastNodeId}-${nodeId}`,
          source: lastNodeId,
          target: nodeId,
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        })
      } else {
        const prevNodeId = `moveToPosition-${timestamp}_${index - 1}`
        newEdges.push({
          id: `${prevNodeId}-${nodeId}`,
          source: prevNodeId,
          target: nodeId,
          animated: true,
          type: 'smoothstep',
          style: { stroke: '#3b82f6', strokeWidth: 2 },
        })
      }
    })

    // Add nodes and edges to the flow
    setNodes((nds) => [...nds, ...newNodes])
    setEdges((eds) => [...eds, ...newEdges])
  }

  const handleCanvasContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault() // Prevent default context menu
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Double-click functionality removed
  }

  const toggleFullscreen = () => {
    if (!fieldContainerRef.current) return

    if (!isFullscreen) {
      if (fieldContainerRef.current.requestFullscreen) {
        fieldContainerRef.current.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Resize canvas for fullscreen to maintain quality
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isFullscreen) {
      // Calculate the maximum size while maintaining aspect ratio
      const maxSize = Math.min(window.innerWidth, window.innerHeight)
      // Use high resolution for better quality
      const resolution = Math.min(maxSize * window.devicePixelRatio, 2048)
      canvas.width = resolution
      canvas.height = resolution
    } else {
      // Reset to default size for normal view
      canvas.width = 400
      canvas.height = 400
    }

    // Redraw after resizing
    drawField()
  }, [isFullscreen, drawField])

  const loadGuestProject = () => {
    try {
      setLoading(true)
      // Load from localStorage (same as dashboard)
      const guestProjects = localStorage.getItem('guestProjects')
      if (guestProjects) {
        const projects = JSON.parse(guestProjects)
        const foundProject = projects.find((p: any) => p.project_hash === params.projecthash)
        if (foundProject) {
          setProject(foundProject)
          if (foundProject.workflow_data?.actions) {
            setActions(foundProject.workflow_data.actions)
          }
          if (foundProject.workflow_data?.nodes) {
            setNodes(foundProject.workflow_data.nodes)
          }
          if (foundProject.workflow_data?.edges) {
            setEdges(foundProject.workflow_data.edges)
          }
          setLoading(false)
        } else {
          // Project not found, redirect to dashboard
          console.log('Guest project not found in localStorage, redirecting to dashboard')
          setLoading(false)
          router.push('/dashboard')
        }
      } else {
        // No guest projects, redirect to dashboard
        console.log('No guest projects in localStorage, redirecting to dashboard')
        setLoading(false)
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Error loading guest project:', err)
      setLoading(false)
      router.push('/dashboard')
    }
  }

  const loadProject = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('project_hash', params.projecthash as string)
        .eq('user_id', user!.id)
        .single()

      if (error) throw error
      setProject(data)
      if (data.workflow_data?.actions) {
        setActions(data.workflow_data.actions)
      }
      if (data.workflow_data?.nodes) {
        setNodes(data.workflow_data.nodes)
      }
      if (data.workflow_data?.edges) {
        setEdges(data.workflow_data.edges)
      }
    } catch (err: any) {
      console.error('Error loading project:', err)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!project) {
      console.warn('Cannot save: no project loaded')
      toast.error('Cannot save: no project loaded')
      return
    }
    try {
      setSaving(true)
      toast.loading('Saving project...', { id: 'save-project' })

      if (isGuest) {
        console.log('Saving guest project to localStorage:', params.projecthash)
        // Save to localStorage (same as dashboard)
        const guestProjects = localStorage.getItem('guestProjects')
        let projects = guestProjects ? JSON.parse(guestProjects) : []

        const projectIndex = projects.findIndex((p: any) =>
          p.project_hash === project.id || p.project_hash === params.projecthash
        )

        if (projectIndex >= 0) {
          // Update existing project
          console.log('Updating existing guest project at index', projectIndex)
          projects[projectIndex] = {
            ...projects[projectIndex],
            workflow_data: { actions, nodes, edges },
            updated_at: new Date().toISOString()
          }
        } else {
          // Add new project if it doesn't exist
          console.log('Adding new guest project to localStorage')
          projects.push({
            ...project,
            workflow_data: { actions, nodes, edges },
            updated_at: new Date().toISOString()
          })
        }

        localStorage.setItem('guestProjects', JSON.stringify(projects))
        console.log('Guest project saved successfully')
        toast.success('Project saved successfully!', { id: 'save-project' })
      } else {
        console.log('Saving authenticated project to Supabase:', project.id)
        const { error } = await supabase
          .from('projects')
          .update({ workflow_data: { actions, nodes, edges } })
          .eq('id', project.id)
        if (error) throw error
        console.log('Authenticated project saved successfully')
        toast.success('Project saved successfully!', { id: 'save-project' })
      }
    } catch (err: any) {
      console.error('Failed to save:', err)
      toast.error('Failed to save project: ' + err.message, { id: 'save-project' })
    } finally {
      setSaving(false)
    }
  }

  // Auto-save functionality with debouncing
  useEffect(() => {
    if (!project || loading) return // Don't auto-save during initial loading

    const autoSaveTimer = setTimeout(() => {
      // Auto-save with subtle notification
      if (isGuest) {
        try {
          console.log('Auto-saving guest project...')
          toast.loading('Auto-saving...', { id: 'auto-save', duration: 1000 })

          const guestProjects = localStorage.getItem('guestProjects')
          let projects = guestProjects ? JSON.parse(guestProjects) : []

          const projectIndex = projects.findIndex((p: any) =>
            p.project_hash === project.id || p.project_hash === params.projecthash
          )

          if (projectIndex >= 0) {
            projects[projectIndex] = {
              ...projects[projectIndex],
              workflow_data: { actions, nodes, edges },
              updated_at: new Date().toISOString()
            }
          } else {
            projects.push({
              ...project,
              workflow_data: { actions, nodes, edges },
              updated_at: new Date().toISOString()
            })
          }

          localStorage.setItem('guestProjects', JSON.stringify(projects))
          console.log('Auto-save completed')
          toast.success('Auto-saved', { id: 'auto-save', duration: 1500 })
        } catch (err) {
          console.error('Auto-save failed:', err)
          toast.error('Auto-save failed', { id: 'auto-save', duration: 2000 })
        }
      } else {
        // Auto-save for authenticated users
        console.log('Auto-saving authenticated project...')
        toast.loading('Auto-saving...', { id: 'auto-save', duration: 1000 })

        supabase
          .from('projects')
          .update({ workflow_data: { actions, nodes, edges } })
          .eq('id', project.id)
          .then(({ error }) => {
            if (error) {
              console.error('Auto-save failed:', error)
              toast.error('Auto-save failed', { id: 'auto-save', duration: 2000 })
            } else {
              console.log('Auto-save completed')
              toast.success('Auto-saved', { id: 'auto-save', duration: 1500 })
            }
          })
      }
    }, 2000) // Auto-save 2 seconds after last change

    return () => clearTimeout(autoSaveTimer)
  }, [actions, nodes, edges, project, isGuest, loading, params.projecthash]) // eslint-disable-line react-hooks/exhaustive-deps

  // Legacy action functions - kept for backward compatibility but not used with nodes
  const addAction = (blockType: any) => {
    // This function is no longer used - blocks are now dragged and dropped
  }

  const saveToHistory = (newActions: ActionBlock[]) => {
    const newHistory = actionHistory.slice(0, historyIndex + 1)
    newHistory.push(newActions)
    setActionHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setActions(actionHistory[historyIndex - 1])
    }
  }

  const redo = () => {
    if (historyIndex < actionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setActions(actionHistory[historyIndex + 1])
    }
  }

  const cloneAction = (action: ActionBlock) => {
    const cloned: ActionBlock = {
      ...action,
      id: Date.now().toString(),
    }
    const newActions = [...actions, cloned]
    saveToHistory(newActions)
    setActions(newActions)
  }

  const deleteAction = (id: string) => {
    const newActions = actions.filter(a => a.id !== id)
    saveToHistory(newActions)
    setActions(newActions)
    if (selectedAction?.id === id) setSelectedAction(null)
  }

  const updateAction = (id: string, updates: Partial<ActionBlock>) => {
    const newActions = actions.map(a => a.id === id ? { ...a, ...updates } : a)
    setActions(newActions)
    if (selectedAction?.id === id) {
      setSelectedAction({ ...selectedAction, ...updates })
    }
  }

  const startAnimation = () => {
    const newPath = calculatePath()
    setPath(newPath)
    setAnimationProgress(0)
    setIsAnimating(true)

    const duration = 3000 / animationSpeed
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimationProgress(progress)

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
        if (newPath.length > 0) {
          const final = newPath[newPath.length - 1]
          setRobotX(final.x)
          setRobotY(final.y)
          setRobotHeading(final.heading)
        }
      }
    }

    animate()
  }

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setIsAnimating(false)
  }

  // Node preview functions
  const startNodePreview = () => {
    const orderedNodes = getNodesInExecutionOrder()
    if (orderedNodes.length === 0) return

    setIsNodePreviewing(true)
    setCurrentPreviewNodeIndex(0)
    setFieldAnimationProgress(0)
    setIsFieldAnimating(false)
    zoomToNode(orderedNodes[0])
  }

  const stopNodePreview = () => {
    setIsNodePreviewing(false)
    setCurrentPreviewNodeIndex(0)
    if (nodePreviewTimeoutRef.current) {
      clearTimeout(nodePreviewTimeoutRef.current)
      nodePreviewTimeoutRef.current = null
    }
    // Stop field animation
    setIsFieldAnimating(false)
    setFieldAnimationProgress(0)
    if (fieldAnimationRef.current) {
      cancelAnimationFrame(fieldAnimationRef.current)
      fieldAnimationRef.current = null
    }
    // Clear node selection
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: false,
      }))
    )
    // Fit view to show all nodes
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2, duration: 800 })
    }
  }

  const nextPreviewNode = () => {
    const orderedNodes = getNodesInExecutionOrder()
    if (orderedNodes.length === 0) return

    const nextIndex = currentPreviewNodeIndex + 1
    if (nextIndex < orderedNodes.length) {
      setCurrentPreviewNodeIndex(nextIndex)
      zoomToNode(orderedNodes[nextIndex])
    } else {
      // Loop back to first node
      setCurrentPreviewNodeIndex(0)
      zoomToNode(orderedNodes[0])
    }
  }

  const previousPreviewNode = () => {
    const orderedNodes = getNodesInExecutionOrder()
    if (orderedNodes.length === 0) return

    const prevIndex = currentPreviewNodeIndex - 1
    if (prevIndex >= 0) {
      setCurrentPreviewNodeIndex(prevIndex)
      zoomToNode(orderedNodes[prevIndex])
    } else {
      // Loop to last node
      const lastIndex = orderedNodes.length - 1
      setCurrentPreviewNodeIndex(lastIndex)
      zoomToNode(orderedNodes[lastIndex])
    }
  }

  const zoomToNode = (node: Node<BlockNodeData>) => {
    if (!reactFlowInstance) return

    // Select the node to highlight it
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        selected: n.id === node.id,
      }))
    )

    // Zoom to the node with smooth animation
    reactFlowInstance.setCenter(
      node.position.x + 150, // Offset to center the node (node width ~300px)
      node.position.y + 100, // Offset to center the node (node height ~200px)
      { zoom: 1.2, duration: 800 }
    )
  }

  // Auto-advance node preview
  useEffect(() => {
    if (!isNodePreviewing) return

    const delay = 2000 / nodePreviewSpeed // Base delay of 2 seconds adjusted by speed
    nodePreviewTimeoutRef.current = setTimeout(() => {
      nextPreviewNode()
    }, delay)

    return () => {
      if (nodePreviewTimeoutRef.current) {
        clearTimeout(nodePreviewTimeoutRef.current)
      }
    }
  }, [isNodePreviewing, currentPreviewNodeIndex, nodePreviewSpeed]) // eslint-disable-line react-hooks/exhaustive-deps

  // Field preview animation when node changes
  useEffect(() => {
    if (!isNodePreviewing) return

    // Start animation from 0
    setFieldAnimationProgress(0)
    setIsFieldAnimating(true)

    const animationDuration = 800 // milliseconds
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / animationDuration, 1)

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setFieldAnimationProgress(eased)

      if (progress < 1) {
        fieldAnimationRef.current = requestAnimationFrame(animate)
      } else {
        setIsFieldAnimating(false)
      }
    }

    fieldAnimationRef.current = requestAnimationFrame(animate)

    return () => {
      if (fieldAnimationRef.current) {
        cancelAnimationFrame(fieldAnimationRef.current)
      }
    }
  }, [isNodePreviewing, currentPreviewNodeIndex])

  const resetPosition = () => {
    setRobotX(72)
    setRobotY(72)
    setRobotHeading(0)
    setPath([])
    setAnimationProgress(0)
    stopAnimation()
  }

  // Helper function to generate combined action code (secondary actions with movement)
  const generateCombinedAction = (data: BlockNodeData, indent: string): string => {
    let code = ''

    if (!data.enableSecondaryAction) return code

    code += `${indent}.addTemporalMarker(() -> {\n`
    code += `${indent}    // Combined action\n`

    if (data.secondaryActionType === 'servo' && data.secondaryServoName) {
      code += `${indent}    Servo ${data.secondaryServoName} = hardwareMap.get(Servo.class, "${data.secondaryServoName}");\n`
      code += `${indent}    ${data.secondaryServoName}.setPosition(${data.secondaryServoPosition || 0.5});\n`
    } else if (data.secondaryActionType === 'motor' && data.secondaryMotorName) {
      code += `${indent}    DcMotor ${data.secondaryMotorName} = hardwareMap.get(DcMotor.class, "${data.secondaryMotorName}");\n`
      code += `${indent}    ${data.secondaryMotorName}.setPower(${data.secondaryMotorPower || 0.5});\n`
    } else if (data.secondaryActionType === 'sensor') {
      code += `${indent}    telemetry.addData("Sensor", "Reading...");\n`
      code += `${indent}    telemetry.update();\n`
    }

    code += `${indent}})\n`
    return code
  }

  // Helper function to generate code for individual actions (used in parallel blocks and combined actions)
  const generateActionCode = (data: BlockNodeData, indent: string): string => {
    let code = ''

    // Mechanism blocks
    if (data.type === 'setServo') {
      code += `${indent}Servo ${data.servoName || 'servo'} = hardwareMap.get(Servo.class, "${data.servoName || 'servo'}");\n`
      code += `${indent}${data.servoName || 'servo'}.setPosition(${data.position || 0.5});\n`
    } else if (data.type === 'runMotor') {
      code += `${indent}DcMotor ${data.motorName || 'motor'} = hardwareMap.get(DcMotor.class, "${data.motorName || 'motor'}");\n`
      code += `${indent}${data.motorName || 'motor'}.setPower(${data.power || 0.5});\n`
    } else if (data.type === 'stopMotor') {
      code += `${indent}DcMotor ${data.motorName || 'motor'} = hardwareMap.get(DcMotor.class, "${data.motorName || 'motor'}");\n`
      code += `${indent}${data.motorName || 'motor'}.setPower(0);\n`
    } else if (data.type === 'custom' && data.customCode) {
      code += `${indent}${data.customCode}\n`
    }
    // Add sensor reads
    else if (data.type === 'readIMU') {
      code += `${indent}telemetry.addData("IMU", "Reading...");\n`
      code += `${indent}telemetry.update();\n`
    } else if (data.type === 'readDistance') {
      code += `${indent}telemetry.addData("Distance", "Reading...");\n`
      code += `${indent}telemetry.update();\n`
    } else if (data.type === 'readColor') {
      code += `${indent}telemetry.addData("Color", "Reading...");\n`
      code += `${indent}telemetry.update();\n`
    }

    return code
  }

  // Helper function to generate code for a sequence of nodes
  const generateNodeCode = (nodeId: string, visitedInPath: Set<string>, indent: string = '            '): { code: string, hasTrajectoryCommands: boolean } => {
    let code = ''
    let hasTrajectoryCommands = false

    // Prevent infinite loops
    if (visitedInPath.has(nodeId)) {
      return { code: `${indent}// Cycle detected, skipping\n`, hasTrajectoryCommands: false }
    }

    const newVisited = new Set(visitedInPath)
    newVisited.add(nodeId)

    const node = nodes.find(n => n.id === nodeId)
    if (!node || node.type !== 'blockNode') {
      // Check if there's an edge from this node
      const outgoingEdges = edges.filter(e => e.source === nodeId)
      if (outgoingEdges.length > 0) {
        const result = generateNodeCode(outgoingEdges[0].target, newVisited, indent)
        return result
      }
      return { code, hasTrajectoryCommands }
    }

    const data = node.data

    // Handle if/else blocks
    if (data.type === 'if') {
      const condition = data.condition || 'true'
      const trueEdge = edges.find(e => e.source === node.id && e.sourceHandle === 'true')
      const falseEdge = edges.find(e => e.source === node.id && e.sourceHandle === 'false')

      code += `${indent}.addTemporalMarker(() -> {\n`
      code += `${indent}    if (${condition}) {\n`

      if (trueEdge) {
        const trueResult = generateNodeCode(trueEdge.target, newVisited, indent + '        ')
        code += trueResult.code
        hasTrajectoryCommands = hasTrajectoryCommands || trueResult.hasTrajectoryCommands
      } else {
        code += `${indent}        // True branch\n`
      }

      code += `${indent}    }`

      if (falseEdge) {
        code += ` else {\n`
        const falseResult = generateNodeCode(falseEdge.target, newVisited, indent + '        ')
        code += falseResult.code
        hasTrajectoryCommands = hasTrajectoryCommands || falseResult.hasTrajectoryCommands
        code += `${indent}    }\n`
      } else {
        code += `\n`
      }

      code += `${indent}})\n`
      hasTrajectoryCommands = true

      // Continue with next node if any
      const nextEdge = edges.find(e => e.source === node.id && !e.sourceHandle)
      if (nextEdge) {
        const nextResult = generateNodeCode(nextEdge.target, newVisited, indent)
        code += nextResult.code
        hasTrajectoryCommands = hasTrajectoryCommands || nextResult.hasTrajectoryCommands
      }

      return { code, hasTrajectoryCommands }
    }

    // Handle loop blocks
    if (data.type === 'loop') {
      const loopCount = data.loopCount || 1
      const loopEdge = edges.find(e => e.source === node.id && e.sourceHandle === 'loop')

      code += `${indent}.addTemporalMarker(() -> {\n`
      code += `${indent}    for (int loopIndex = 0; loopIndex < ${loopCount}; loopIndex++) {\n`

      if (loopEdge) {
        const loopResult = generateNodeCode(loopEdge.target, newVisited, indent + '        ')
        code += loopResult.code
        hasTrajectoryCommands = hasTrajectoryCommands || loopResult.hasTrajectoryCommands
      } else {
        code += `${indent}        // Loop body\n`
      }

      code += `${indent}    }\n`
      code += `${indent}})\n`
      hasTrajectoryCommands = true

      // Continue with next node after loop
      const nextEdge = edges.find(e => e.source === node.id && e.sourceHandle === 'next')
      if (nextEdge) {
        const nextResult = generateNodeCode(nextEdge.target, newVisited, indent)
        code += nextResult.code
        hasTrajectoryCommands = hasTrajectoryCommands || nextResult.hasTrajectoryCommands
      }

      return { code, hasTrajectoryCommands }
    }

    // Handle parallel blocks
    if (data.type === 'parallel') {
      const action1Edge = edges.find(e => e.source === node.id && e.sourceHandle === 'action1')
      const action2Edge = edges.find(e => e.source === node.id && e.sourceHandle === 'action2')
      const action3Edge = edges.find(e => e.source === node.id && e.sourceHandle === 'action3')

      // Generate code for all parallel actions at the same trajectory point
      const parallelActions: string[] = []

      if (action1Edge) {
        const action1Node = nodes.find(n => n.id === action1Edge.target)
        if (action1Node?.data) {
          parallelActions.push(generateActionCode(action1Node.data, indent + '    '))
        }
      }

      if (action2Edge) {
        const action2Node = nodes.find(n => n.id === action2Edge.target)
        if (action2Node?.data) {
          parallelActions.push(generateActionCode(action2Node.data, indent + '    '))
        }
      }

      if (action3Edge) {
        const action3Node = nodes.find(n => n.id === action3Edge.target)
        if (action3Node?.data) {
          parallelActions.push(generateActionCode(action3Node.data, indent + '    '))
        }
      }

      if (parallelActions.length > 0) {
        code += `${indent}.addTemporalMarker(() -> {\n`
        code += `${indent}    // Parallel actions\n`
        parallelActions.forEach(action => {
          code += action
        })
        code += `${indent}})\n`
        hasTrajectoryCommands = true
      }

      // Continue with next node
      const nextEdge = edges.find(e => e.source === node.id && e.sourceHandle === 'next')
      if (nextEdge) {
        const nextResult = generateNodeCode(nextEdge.target, newVisited, indent)
        code += nextResult.code
        hasTrajectoryCommands = hasTrajectoryCommands || nextResult.hasTrajectoryCommands
      }

      return { code, hasTrajectoryCommands }
    }

    // Handle everynode blocks
    if (data.type === 'everynode') {
      hasTrajectoryCommands = true
      const iterVar = data.iteratorVariable || 'i'

      if (data.collectionType === 'range') {
        const start = data.startRange || 0
        const end = data.endRange || 10
        code += `${indent}.addTemporalMarker(() -> {\n`
        code += `${indent}    for (int ${iterVar} = ${start}; ${iterVar} < ${end}; ${iterVar}++) {\n`
        code += `${indent}        telemetry.addData("Iterator", ${iterVar});\n`
        code += `${indent}        telemetry.update();\n`
        code += `${indent}    }\n`
        code += `${indent}})\n`
      } else if (data.collectionType === 'array') {
        const arrayName = data.collectionName || 'items'
        code += `${indent}.addTemporalMarker(() -> {\n`
        code += `${indent}    for (var ${iterVar} : ${arrayName}) {\n`
        code += `${indent}        telemetry.addData("Current Item", ${iterVar});\n`
        code += `${indent}        telemetry.update();\n`
        code += `${indent}    }\n`
        code += `${indent}})\n`
      } else {
        code += `${indent}.addTemporalMarker(() -> {\n`
        code += `${indent}    telemetry.addData("Info", "Processing waypoints");\n`
        code += `${indent}    telemetry.update();\n`
        code += `${indent}})\n`
      }
    }
    // Handle movement blocks
    else if (data.type === 'moveToPosition') {
      hasTrajectoryCommands = true
      code += `${indent}.lineTo(new Vector2d(${data.targetX || 0}, ${data.targetY || 0}))\n`
      if (data.targetHeading !== undefined) {
        code += `${indent}.turn(Math.toRadians(${data.targetHeading}))\n`
      }
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    } else if (data.type === 'splineTo') {
      hasTrajectoryCommands = true
      code += `${indent}.splineTo(new Vector2d(${data.targetX || 0}, ${data.targetY || 0}), Math.toRadians(${data.targetHeading || 0}))\n`
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    } else if (data.type === 'forward') {
      hasTrajectoryCommands = true
      code += `${indent}.forward(${data.distance || 24})\n`
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    } else if (data.type === 'backward') {
      hasTrajectoryCommands = true
      code += `${indent}.back(${data.distance || 24})\n`
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    } else if (data.type === 'strafeLeft') {
      hasTrajectoryCommands = true
      code += `${indent}.strafeLeft(${data.distance || 24})\n`
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    } else if (data.type === 'strafeRight') {
      hasTrajectoryCommands = true
      code += `${indent}.strafeRight(${data.distance || 24})\n`
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    } else if (data.type === 'turnLeft') {
      hasTrajectoryCommands = true
      code += `${indent}.turn(Math.toRadians(${-(data.angle || 90)}))\n`
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    } else if (data.type === 'turnRight') {
      hasTrajectoryCommands = true
      code += `${indent}.turn(Math.toRadians(${data.angle || 90}))\n`
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    } else if (data.type === 'turnToHeading') {
      hasTrajectoryCommands = true
      code += `${indent}.turn(Math.toRadians(${data.targetHeading || 0}))\n`
      // Add combined action if enabled
      if (data.enableSecondaryAction) {
        code += generateCombinedAction(data, indent)
      }
    }
    // Handle control blocks
    else if (data.type === 'wait') {
      hasTrajectoryCommands = true
      code += `${indent}.waitSeconds(${data.duration || 1})\n`
    }
    // Handle mechanism blocks
    else if (data.type === 'setServo') {
      hasTrajectoryCommands = true
      code += `${indent}.addTemporalMarker(() -> {\n`
      code += `${indent}    Servo ${data.servoName || 'servo'} = hardwareMap.get(Servo.class, "${data.servoName || 'servo'}");\n`
      code += `${indent}    ${data.servoName || 'servo'}.setPosition(${data.position || 0.5});\n`
      code += `${indent}})\n`
    } else if (data.type === 'runMotor') {
      hasTrajectoryCommands = true
      code += `${indent}.addTemporalMarker(() -> {\n`
      code += `${indent}    DcMotor ${data.motorName || 'motor'} = hardwareMap.get(DcMotor.class, "${data.motorName || 'motor'}");\n`
      code += `${indent}    ${data.motorName || 'motor'}.setPower(${data.power || 0.5});\n`
      code += `${indent}})\n`
    } else if (data.type === 'stopMotor') {
      hasTrajectoryCommands = true
      code += `${indent}.addTemporalMarker(() -> {\n`
      code += `${indent}    DcMotor ${data.motorName || 'motor'} = hardwareMap.get(DcMotor.class, "${data.motorName || 'motor'}");\n`
      code += `${indent}    ${data.motorName || 'motor'}.setPower(0);\n`
      code += `${indent}})\n`
    } else if (data.type === 'custom' && data.customCode) {
      hasTrajectoryCommands = true
      code += `${indent}.addTemporalMarker(() -> {\n`
      code += `${indent}    ${data.customCode}\n`
      code += `${indent}})\n`
    }

    // Continue to next node
    const nextEdges = edges.filter(e => e.source === node.id && !e.sourceHandle)
    if (nextEdges.length > 0) {
      const nextResult = generateNodeCode(nextEdges[0].target, newVisited, indent)
      code += nextResult.code
      hasTrajectoryCommands = hasTrajectoryCommands || nextResult.hasTrajectoryCommands
    }

    return { code, hasTrajectoryCommands }
  }

  const exportRoadRunner = () => {
    // Find start node
    const startEdges = edges.filter(e => e.source === 'start')
    if (startEdges.length === 0) {
      toast.error('No nodes connected to START node')
      return
    }

    // Start building code
    let code = `package org.firstinspires.ftc.teamcode;

import com.acmerobotics.roadrunner.geometry.Pose2d;
import com.acmerobotics.roadrunner.geometry.Vector2d;
import com.acmerobotics.roadrunner.trajectory.Trajectory;
import com.acmerobotics.roadrunner.trajectory.TrajectorySequence;
import com.acmerobotics.roadrunner.trajectory.TrajectorySequenceBuilder;
import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.Servo;

@Autonomous(name = "${project?.name || 'Auto'} (RoadRunner)", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}RR extends LinearOpMode {

    @Override
    public void runOpMode() {
        SampleMecanumDrive drive = new SampleMecanumDrive(hardwareMap);

        Pose2d startPose = new Pose2d(${robotX}, ${robotY}, Math.toRadians(${robotHeading}));
        drive.setPoseEstimate(startPose);

        waitForStart();

        if (opModeIsActive()) {
            // Build trajectory
            TrajectorySequenceBuilder builder = drive.trajectorySequenceBuilder(startPose);
`

    // Generate code using the new recursive system
    const result = generateNodeCode(startEdges[0].target, new Set())
    code += result.code
    const hasTrajectoryCommands = result.hasTrajectoryCommands

    if (hasTrajectoryCommands) {
      code += `;

            TrajectorySequence trajSeq = builder.build();
            drive.followTrajectorySequence(trajSeq);
`
    }

    code += `        }
    }
}
`

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}RR.java`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportPedroPathing = () => {
    // Build ordered list of nodes by following edges from start
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    const traverseNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (node && node.type === 'blockNode') {
        orderedNodes.push(node)
      }

      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => traverseNodes(edge.target))
    }

    traverseNodes('start')

    // Start building code
    let code = `package org.firstinspires.ftc.teamcode;

import com.pedropathing.follower.Follower;
import com.pedropathing.geometry.BezierLine;
import com.pedropathing.geometry.Pose;
import com.pedropathing.paths.Path;
import com.pedropathing.paths.PathChain;
import com.pedropathing.util.Timer;
import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.OpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.Servo;

@Autonomous(name = "${project?.name || 'Auto'} (PedroPathing)", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}Pedro extends OpMode {
    private Follower follower;
    private PathChain pathChain;
    private int pathState = 0;
    private Timer timer = new Timer();
`

    // Add hardware declarations based on blocks
    const hasServoBlocks = orderedNodes.some(n => n.data.type === 'setServo' || n.data.type === 'continuousServo')
    const hasMotorBlocks = orderedNodes.some(n => n.data.type === 'runMotor' || n.data.type === 'stopMotor' || n.data.type === 'setMotorPower')

    if (hasServoBlocks || hasMotorBlocks) {
      orderedNodes.forEach(node => {
        if ((node.data.type === 'setServo' || node.data.type === 'continuousServo') && node.data.servoName) {
          code += `    private Servo ${node.data.servoName};\n`
        }
        if ((node.data.type === 'runMotor' || node.data.type === 'stopMotor' || node.data.type === 'setMotorPower') && node.data.motorName) {
          code += `    private DcMotor ${node.data.motorName};\n`
        }
      })
    }

    code += `
    @Override
    public void init() {
        follower = new Follower(hardwareMap);
`

    // Initialize hardware
    if (hasServoBlocks || hasMotorBlocks) {
      orderedNodes.forEach(node => {
        if ((node.data.type === 'setServo' || node.data.type === 'continuousServo') && node.data.servoName) {
          code += `        ${node.data.servoName} = hardwareMap.get(Servo.class, "${node.data.servoName}");\n`
        }
        if ((node.data.type === 'runMotor' || node.data.type === 'stopMotor' || node.data.type === 'setMotorPower') && node.data.motorName) {
          code += `        ${node.data.motorName} = hardwareMap.get(DcMotor.class, "${node.data.motorName}");\n`
        }
      })
      code += `\n`
    }

    // Build path waypoints
    let currentX = robotX
    let currentY = robotY
    let currentHeading = robotHeading
    let pathPoses: string[] = []

    orderedNodes.forEach(node => {
      const data = node.data

      // Movement blocks that contribute to path
      if (data.type === 'moveToPosition' || data.type === 'splineTo') {
        currentX = data.targetX || currentX
        currentY = data.targetY || currentY
        pathPoses.push(`new Pose(${currentX}, ${currentY}, Math.toRadians(${currentHeading}))`)
      } else if (data.type === 'forward') {
        const distance = data.distance || 24
        currentY += distance
        pathPoses.push(`new Pose(${currentX}, ${currentY}, Math.toRadians(${currentHeading}))`)
      } else if (data.type === 'backward') {
        const distance = data.distance || 24
        currentY -= distance
        pathPoses.push(`new Pose(${currentX}, ${currentY}, Math.toRadians(${currentHeading}))`)
      } else if (data.type === 'strafeLeft') {
        const distance = data.distance || 24
        currentX -= distance
        pathPoses.push(`new Pose(${currentX}, ${currentY}, Math.toRadians(${currentHeading}))`)
      } else if (data.type === 'strafeRight') {
        const distance = data.distance || 24
        currentX += distance
        pathPoses.push(`new Pose(${currentX}, ${currentY}, Math.toRadians(${currentHeading}))`)
      } else if (data.type === 'turnLeft') {
        const degrees = data.angle || 90
        currentHeading -= degrees
        pathPoses.push(`new Pose(${currentX}, ${currentY}, Math.toRadians(${currentHeading}))`)
      } else if (data.type === 'turnRight') {
        const degrees = data.angle || 90
        currentHeading += degrees
        pathPoses.push(`new Pose(${currentX}, ${currentY}, Math.toRadians(${currentHeading}))`)
      }
    })

    code += `        // Set start pose\n`
    code += `        Pose startPose = new Pose(${robotX}, ${robotY}, Math.toRadians(${robotHeading}));\n`
    code += `        follower.setStartingPose(startPose);\n\n`

    // Build path if there are waypoints
    if (pathPoses.length > 0) {
      code += `        // Build autonomous path\n`
      code += `        pathChain = follower.pathBuilder()\n`

      const startPoseStr = `new Pose(${robotX}, ${robotY}, Math.toRadians(${robotHeading}))`
      for (let i = 0; i < pathPoses.length; i++) {
        const fromPose = i === 0 ? startPoseStr : pathPoses[i - 1]
        code += `            .addPath(new BezierLine(${fromPose}, ${pathPoses[i]}))\n`
      }
      code += `            .setLinearHeadingInterpolation(startPose.getHeading(), Math.toRadians(${currentHeading}))\n`
      code += `            .build();\n`
    }

    code += `    }

    @Override
    public void start() {
        super.start();`

    if (pathPoses.length > 0) {
      code += `\n        follower.followPath(pathChain);`
    }

    code += `\n        timer.resetTimer();
    }

    @Override
    public void loop() {
        follower.update();

        // State machine for autonomous
        switch (pathState) {
            case 0: // Following path
                if (!follower.isBusy()) {
                    pathState = 1;
                }
                break;
            case 1: // Path complete, execute mechanisms
`

    // Add mechanism control in state 1
    if (hasServoBlocks || hasMotorBlocks) {
      orderedNodes.forEach(node => {
        const data = node.data

        if (data.type === 'setServo' && data.servoName) {
          code += `                ${data.servoName}.setPosition(${data.position || 0.5});\n`
        } else if (data.type === 'runMotor' && data.motorName) {
          code += `                ${data.motorName}.setPower(${data.power || 0.5});\n`
        } else if (data.type === 'stopMotor' && data.motorName) {
          code += `                ${data.motorName}.setPower(0);\n`
        } else if (data.type === 'setMotorPower' && data.motorName) {
          code += `                ${data.motorName}.setPower(${data.power || 0.5});\n`
        } else if (data.type === 'custom' && data.customCode) {
          code += `                ${data.customCode}\n`
        }
      })
    }

    code += `                pathState = 2;
                break;
            case 2: // Autonomous complete
                break;
        }

        // Telemetry
        telemetry.addData("Path State", pathState);
        telemetry.addData("X", follower.getPose().getX());
        telemetry.addData("Y", follower.getPose().getY());
        telemetry.addData("Heading (deg)", Math.toDegrees(follower.getPose().getHeading()));
        telemetry.update();
    }
}
`

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}Pedro.java`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportSimpleCode = () => {
    // Build ordered list of nodes
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    const traverseNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (node && node.type === 'blockNode') {
        orderedNodes.push(node)
      }

      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => traverseNodes(edge.target))
    }

    traverseNodes('start')

    // Get all enabled motors from drivetrain based on template type
    const enabledDriveMotors = [
      { varName: 'frontLeft', port: '0', enabled: true, reversed: false },
      { varName: 'frontRight', port: '1', enabled: true, reversed: false },
      { varName: 'backLeft', port: '2', enabled: true, reversed: false },
      { varName: 'backRight', port: '3', enabled: true, reversed: false },
    ]

    // Get all mechanism motors and servos
    const enabledControlMotors = controlMotors.filter(m => m.enabled)
    const enabledExpansionMotors = expansionMotors.filter(m => m.enabled)
    const allMechanismMotors = [...enabledControlMotors, ...enabledExpansionMotors]

    const enabledControlServos = controlServos.filter(s => s.enabled)
    const enabledExpansionServos = expansionServos.filter(s => s.enabled)
    const allServos = [...enabledControlServos, ...enabledExpansionServos]

    // Start building code
    let code = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.Servo;
import com.qualcomm.robotcore.hardware.IMU;
import com.qualcomm.hardware.rev.RevHubOrientationOnRobot;
import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;

@Autonomous(name = "${project?.name || 'Auto'} (Simple)", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}Simple extends LinearOpMode {
`

    // Declare drivetrain motors
    if (enabledDriveMotors.length > 0) {
      code += `    // Drivetrain motors\n`
      enabledDriveMotors.forEach(motor => {
        code += `    private DcMotor ${motor.varName};\n`
      })
      code += `\n`
    }

    // Declare mechanism motors
    if (allMechanismMotors.length > 0) {
      code += `    // Mechanism motors\n`
      allMechanismMotors.forEach(motor => {
        code += `    private DcMotor ${motor.name};\n`
      })
      code += `\n`
    }

    // Declare servos
    if (allServos.length > 0) {
      code += `    // Servos\n`
      allServos.forEach(servo => {
        code += `    private Servo ${servo.name};\n`
      })
      code += `\n`
    }

    code += `    private IMU imu;\n\n`

    code += `    @Override
    public void runOpMode() {
        // Initialize drivetrain motors\n`

    // Initialize drivetrain motors
    enabledDriveMotors.forEach(motor => {
      code += `        ${motor.varName} = hardwareMap.get(DcMotor.class, "${motor.varName}");\n`
      if (motor.reversed) {
        code += `        ${motor.varName}.setDirection(DcMotor.Direction.REVERSE);\n`
      }
      code += `        ${motor.varName}.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);\n`
    })

    if (enabledDriveMotors.length > 0) code += `\n`

    // Initialize mechanism motors
    if (allMechanismMotors.length > 0) {
      code += `        // Initialize mechanism motors\n`
      allMechanismMotors.forEach(motor => {
        code += `        ${motor.name} = hardwareMap.get(DcMotor.class, "${motor.name}");\n`
        if (motor.reversed) {
          code += `        ${motor.name}.setDirection(DcMotor.Direction.REVERSE);\n`
        }
        code += `        ${motor.name}.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);\n`
      })
      code += `\n`
    }

    // Initialize servos
    if (allServos.length > 0) {
      code += `        // Initialize servos\n`
      allServos.forEach(servo => {
        code += `        ${servo.name} = hardwareMap.get(Servo.class, "${servo.name}");\n`
      })
      code += `\n`
    }

    // Initialize IMU
    code += `        // Initialize IMU
        imu = hardwareMap.get(IMU.class, "imu");
        IMU.Parameters parameters = new IMU.Parameters(new RevHubOrientationOnRobot(
            RevHubOrientationOnRobot.LogoFacingDirection.UP,
            RevHubOrientationOnRobot.UsbFacingDirection.FORWARD));
        imu.initialize(parameters);

        telemetry.addData("Status", "Initialized");
        telemetry.update();

        waitForStart();

        if (opModeIsActive()) {
`

    // Generate movement and action code
    orderedNodes.forEach(node => {
      const data = node.data

      // Movement blocks - time-based
      if (data.type === 'forward') {
        const distance = data.distance || 24
        const time = (distance / 24) * 1000 // Assume ~24 inches per second
        code += `\n            // Move forward ${distance} inches\n`
        enabledDriveMotors.forEach(motor => {
          code += `            ${motor.varName}.setPower(0.5);\n`
        })
        code += `            sleep(${time});\n`
        enabledDriveMotors.forEach(motor => {
          code += `            ${motor.varName}.setPower(0);\n`
        })
      } else if (data.type === 'backward') {
        const distance = data.distance || 24
        const time = (distance / 24) * 1000
        code += `\n            // Move backward ${distance} inches\n`
        enabledDriveMotors.forEach(motor => {
          code += `            ${motor.varName}.setPower(-0.5);\n`
        })
        code += `            sleep(${time});\n`
        enabledDriveMotors.forEach(motor => {
          code += `            ${motor.varName}.setPower(0);\n`
        })
      } else if (data.type === 'strafeLeft') {
        const distance = data.distance || 24
        const time = (distance / 24) * 1000
        code += `\n            // Strafe left ${distance} inches\n`
        code += `            // Note: Adjust motor powers based on your drivetrain configuration\n`
        if (enabledDriveMotors.length >= 4) {
          code += `            frontLeft.setPower(-0.5);\n`
          code += `            frontRight.setPower(0.5);\n`
          code += `            backLeft.setPower(0.5);\n`
          code += `            backRight.setPower(-0.5);\n`
        }
        code += `            sleep(${time});\n`
        enabledDriveMotors.forEach(motor => {
          code += `            ${motor.varName}.setPower(0);\n`
        })
      } else if (data.type === 'strafeRight') {
        const distance = data.distance || 24
        const time = (distance / 24) * 1000
        code += `\n            // Strafe right ${distance} inches\n`
        code += `            // Note: Adjust motor powers based on your drivetrain configuration\n`
        if (enabledDriveMotors.length >= 4) {
          code += `            frontLeft.setPower(0.5);\n`
          code += `            frontRight.setPower(-0.5);\n`
          code += `            backLeft.setPower(-0.5);\n`
          code += `            backRight.setPower(0.5);\n`
        }
        code += `            sleep(${time});\n`
        enabledDriveMotors.forEach(motor => {
          code += `            ${motor.varName}.setPower(0);\n`
        })
      } else if (data.type === 'turnLeft' || data.type === 'turnRight') {
        const degrees = data.angle || 90
        const time = (degrees / 90) * 800 // Approximate time for 90 degree turn
        const direction = data.type === 'turnLeft' ? 'left' : 'right'
        const powerMultiplier = data.type === 'turnLeft' ? -1 : 1
        code += `\n            // Turn ${direction} ${degrees} degrees\n`
        enabledDriveMotors.forEach(motor => {
          const isLeft = motor.varName.includes('Left')
          const power = (isLeft ? -powerMultiplier : powerMultiplier) * 0.5
          code += `            ${motor.varName}.setPower(${power});\n`
        })
        code += `            sleep(${time});\n`
        enabledDriveMotors.forEach(motor => {
          code += `            ${motor.varName}.setPower(0);\n`
        })
      } else if (data.type === 'wait') {
        const duration = data.duration || 1000
        code += `\n            // Wait ${duration}ms\n`
        code += `            sleep(${duration});\n`
      } else if (data.type === 'setServo' && data.servoName) {
        code += `\n            // Set servo ${data.servoName}\n`
        code += `            ${data.servoName}.setPosition(${data.position || 0.5});\n`
      } else if (data.type === 'runMotor' && data.motorName) {
        code += `\n            // Run motor ${data.motorName}\n`
        code += `            ${data.motorName}.setPower(${data.power || 0.5});\n`
      } else if (data.type === 'stopMotor' && data.motorName) {
        code += `\n            // Stop motor ${data.motorName}\n`
        code += `            ${data.motorName}.setPower(0);\n`
      } else if (data.type === 'setMotorPower' && data.motorName) {
        code += `\n            // Set motor power ${data.motorName}\n`
        code += `            ${data.motorName}.setPower(${data.power || 0.5});\n`
      } else if (data.type === 'custom' && data.customCode) {
        code += `\n            // Custom code\n`
        code += `            ${data.customCode}\n`
      }
    })

    code += `        }
    }
}
`

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}Simple.java`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportEncoderCode = () => {
    // Build ordered list of nodes
    const orderedNodes: Node<BlockNodeData>[] = []
    const visited = new Set<string>()

    const traverseNodes = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = nodes.find(n => n.id === nodeId)
      if (node && node.type === 'blockNode') {
        orderedNodes.push(node)
      }

      const outgoingEdges = edges.filter(e => e.source === nodeId)
      outgoingEdges.forEach(edge => traverseNodes(edge.target))
    }

    traverseNodes('start')

    // Get all enabled motors from drivetrain based on template type
    const enabledDriveMotors = [
      { varName: 'frontLeft', port: '0', enabled: true, reversed: false },
      { varName: 'frontRight', port: '1', enabled: true, reversed: false },
      { varName: 'backLeft', port: '2', enabled: true, reversed: false },
      { varName: 'backRight', port: '3', enabled: true, reversed: false },
    ]

    // Get all mechanism motors
    const enabledControlMotors = controlMotors.filter(m => m.enabled)
    const enabledExpansionMotors = expansionMotors.filter(m => m.enabled)
    const allMechanismMotors = [...enabledControlMotors, ...enabledExpansionMotors]

    const enabledControlServos = controlServos.filter(s => s.enabled)
    const enabledExpansionServos = expansionServos.filter(s => s.enabled)
    const allServos = [...enabledControlServos, ...enabledExpansionServos]

    // Constants for encoder calculations
    const COUNTS_PER_MOTOR_REV = 537.7  // goBILDA 5202/5203 series
    const DRIVE_GEAR_REDUCTION = 1.0
    const WHEEL_DIAMETER_INCHES = 4.0
    const COUNTS_PER_INCH = (COUNTS_PER_MOTOR_REV * DRIVE_GEAR_REDUCTION) / (WHEEL_DIAMETER_INCHES * Math.PI)

    // Start building code
    let code = `package org.firstinspires.ftc.teamcode;

import com.qualcomm.robotcore.eventloop.opmode.Autonomous;
import com.qualcomm.robotcore.eventloop.opmode.LinearOpMode;
import com.qualcomm.robotcore.hardware.DcMotor;
import com.qualcomm.robotcore.hardware.Servo;
import com.qualcomm.robotcore.hardware.IMU;
import com.qualcomm.hardware.rev.RevHubOrientationOnRobot;
import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;

@Autonomous(name = "${project?.name || 'Auto'} (Encoder)", group = "Auto")
public class ${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}Encoder extends LinearOpMode {

    // Encoder constants - ADJUST THESE FOR YOUR ROBOT
    static final double COUNTS_PER_MOTOR_REV = ${COUNTS_PER_MOTOR_REV};
    static final double DRIVE_GEAR_REDUCTION = ${DRIVE_GEAR_REDUCTION};
    static final double WHEEL_DIAMETER_INCHES = ${WHEEL_DIAMETER_INCHES};
    static final double COUNTS_PER_INCH = (COUNTS_PER_MOTOR_REV * DRIVE_GEAR_REDUCTION) / (WHEEL_DIAMETER_INCHES * Math.PI);
    static final double DRIVE_SPEED = 0.6;
    static final double TURN_SPEED = 0.5;
`

    // Declare drivetrain motors
    if (enabledDriveMotors.length > 0) {
      code += `\n    // Drivetrain motors\n`
      enabledDriveMotors.forEach(motor => {
        code += `    private DcMotor ${motor.varName};\n`
      })
    }

    // Declare mechanism motors
    if (allMechanismMotors.length > 0) {
      code += `\n    // Mechanism motors\n`
      allMechanismMotors.forEach(motor => {
        code += `    private DcMotor ${motor.name};\n`
      })
    }

    // Declare servos
    if (allServos.length > 0) {
      code += `\n    // Servos\n`
      allServos.forEach(servo => {
        code += `    private Servo ${servo.name};\n`
      })
    }

    code += `\n    private IMU imu;\n\n`

    code += `    @Override
    public void runOpMode() {
        // Initialize drivetrain motors\n`

    // Initialize drivetrain motors with encoder setup
    enabledDriveMotors.forEach(motor => {
      code += `        ${motor.varName} = hardwareMap.get(DcMotor.class, "${motor.varName}");\n`
      if (motor.reversed) {
        code += `        ${motor.varName}.setDirection(DcMotor.Direction.REVERSE);\n`
      }
      code += `        ${motor.varName}.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER);\n`
      code += `        ${motor.varName}.setMode(DcMotor.RunMode.RUN_USING_ENCODER);\n`
      code += `        ${motor.varName}.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);\n`
    })

    if (enabledDriveMotors.length > 0) code += `\n`

    // Initialize mechanism motors
    if (allMechanismMotors.length > 0) {
      code += `        // Initialize mechanism motors\n`
      allMechanismMotors.forEach(motor => {
        code += `        ${motor.name} = hardwareMap.get(DcMotor.class, "${motor.name}");\n`
        if (motor.reversed) {
          code += `        ${motor.name}.setDirection(DcMotor.Direction.REVERSE);\n`
        }
        code += `        ${motor.name}.setZeroPowerBehavior(DcMotor.ZeroPowerBehavior.BRAKE);\n`
        // Add encoder setup for mechanism motors that have encoders enabled
        if (motor.encoderEnabled) {
          code += `        ${motor.name}.setMode(DcMotor.RunMode.STOP_AND_RESET_ENCODER);\n`
          code += `        ${motor.name}.setMode(DcMotor.RunMode.RUN_USING_ENCODER);\n`
        }
      })
      code += `\n`
    }

    // Initialize servos
    if (allServos.length > 0) {
      code += `        // Initialize servos\n`
      allServos.forEach(servo => {
        code += `        ${servo.name} = hardwareMap.get(Servo.class, "${servo.name}");\n`
      })
      code += `\n`
    }

    // Initialize IMU
    code += `        // Initialize IMU
        imu = hardwareMap.get(IMU.class, "imu");
        IMU.Parameters parameters = new IMU.Parameters(new RevHubOrientationOnRobot(
            RevHubOrientationOnRobot.LogoFacingDirection.UP,
            RevHubOrientationOnRobot.UsbFacingDirection.FORWARD));
        imu.initialize(parameters);

        telemetry.addData("Status", "Initialized");
        telemetry.update();

        waitForStart();

        if (opModeIsActive()) {
`

    // Generate movement code with encoder-based movements
    orderedNodes.forEach(node => {
      const data = node.data

      // Movement blocks - encoder-based
      if (data.type === 'forward') {
        const distance = data.distance || 24
        code += `\n            // Move forward ${distance} inches\n`
        code += `            encoderDrive(DRIVE_SPEED, ${distance}, ${distance}, ${distance}, ${distance}, 5.0);\n`
      } else if (data.type === 'backward') {
        const distance = data.distance || 24
        code += `\n            // Move backward ${distance} inches\n`
        code += `            encoderDrive(DRIVE_SPEED, ${-distance}, ${-distance}, ${-distance}, ${-distance}, 5.0);\n`
      } else if (data.type === 'strafeLeft') {
        const distance = data.distance || 24
        code += `\n            // Strafe left ${distance} inches\n`
        code += `            encoderDrive(DRIVE_SPEED, ${-distance}, ${distance}, ${distance}, ${-distance}, 5.0);\n`
      } else if (data.type === 'strafeRight') {
        const distance = data.distance || 24
        code += `\n            // Strafe right ${distance} inches\n`
        code += `            encoderDrive(DRIVE_SPEED, ${distance}, ${-distance}, ${-distance}, ${distance}, 5.0);\n`
      } else if (data.type === 'turnLeft') {
        const degrees = data.angle || 90
        const turnInches = (degrees / 360) * (12 * Math.PI) // Assuming ~12" wheelbase
        code += `\n            // Turn left ${degrees} degrees\n`
        code += `            encoderDrive(TURN_SPEED, ${-turnInches}, ${turnInches}, ${-turnInches}, ${turnInches}, 5.0);\n`
      } else if (data.type === 'turnRight') {
        const degrees = data.angle || 90
        const turnInches = (degrees / 360) * (12 * Math.PI)
        code += `\n            // Turn right ${degrees} degrees\n`
        code += `            encoderDrive(TURN_SPEED, ${turnInches}, ${-turnInches}, ${turnInches}, ${-turnInches}, 5.0);\n`
      } else if (data.type === 'wait') {
        const duration = data.duration || 1000
        code += `\n            // Wait ${duration}ms\n`
        code += `            sleep(${duration});\n`
      } else if (data.type === 'setServo' && data.servoName) {
        code += `\n            // Set servo ${data.servoName}\n`
        code += `            ${data.servoName}.setPosition(${data.position || 0.5});\n`
      } else if (data.type === 'runMotor' && data.motorName) {
        code += `\n            // Run motor ${data.motorName}\n`
        code += `            ${data.motorName}.setPower(${data.power || 0.5});\n`
      } else if (data.type === 'stopMotor' && data.motorName) {
        code += `\n            // Stop motor ${data.motorName}\n`
        code += `            ${data.motorName}.setPower(0);\n`
      } else if (data.type === 'setMotorPower' && data.motorName) {
        code += `\n            // Set motor power ${data.motorName}\n`
        code += `            ${data.motorName}.setPower(${data.power || 0.5});\n`
      } else if (data.type === 'custom' && data.customCode) {
        code += `\n            // Custom code\n`
        code += `            ${data.customCode}\n`
      }
    })

    code += `        }
    }

    // Encoder drive method
    public void encoderDrive(double speed, double frontLeftInches, double frontRightInches,
                            double backLeftInches, double backRightInches, double timeoutS) {
        int newFrontLeftTarget;
        int newFrontRightTarget;
        int newBackLeftTarget;
        int newBackRightTarget;

        if (opModeIsActive()) {
            // Calculate new target positions
`

    if (enabledDriveMotors.find(m => m.varName === 'frontLeft')) {
      code += `            newFrontLeftTarget = frontLeft.getCurrentPosition() + (int)(frontLeftInches * COUNTS_PER_INCH);\n`
    }
    if (enabledDriveMotors.find(m => m.varName === 'frontRight')) {
      code += `            newFrontRightTarget = frontRight.getCurrentPosition() + (int)(frontRightInches * COUNTS_PER_INCH);\n`
    }
    if (enabledDriveMotors.find(m => m.varName === 'backLeft')) {
      code += `            newBackLeftTarget = backLeft.getCurrentPosition() + (int)(backLeftInches * COUNTS_PER_INCH);\n`
    }
    if (enabledDriveMotors.find(m => m.varName === 'backRight')) {
      code += `            newBackRightTarget = backRight.getCurrentPosition() + (int)(backRightInches * COUNTS_PER_INCH);\n`
    }

    code += `
            // Set target positions
`

    if (enabledDriveMotors.find(m => m.varName === 'frontLeft')) {
      code += `            frontLeft.setTargetPosition(newFrontLeftTarget);\n`
    }
    if (enabledDriveMotors.find(m => m.varName === 'frontRight')) {
      code += `            frontRight.setTargetPosition(newFrontRightTarget);\n`
    }
    if (enabledDriveMotors.find(m => m.varName === 'backLeft')) {
      code += `            backLeft.setTargetPosition(newBackLeftTarget);\n`
    }
    if (enabledDriveMotors.find(m => m.varName === 'backRight')) {
      code += `            backRight.setTargetPosition(newBackRightTarget);\n`
    }

    code += `
            // Turn on RUN_TO_POSITION
`

    enabledDriveMotors.forEach(motor => {
      code += `            ${motor.varName}.setMode(DcMotor.RunMode.RUN_TO_POSITION);\n`
    })

    code += `
            // Start motion
`

    enabledDriveMotors.forEach(motor => {
      code += `            ${motor.varName}.setPower(Math.abs(speed));\n`
    })

    code += `
            // Wait until motors reach target or timeout
            runtime.reset();
            while (opModeIsActive() &&
                   (runtime.seconds() < timeoutS) &&\n`

    const motorChecks = enabledDriveMotors.map(m => `                   (${m.varName}.isBusy())`).join(' &&\n')
    code += motorChecks

    code += `) {
                // Display telemetry
                telemetry.addData("Running to", "Target");
`

    enabledDriveMotors.forEach(motor => {
      code += `                telemetry.addData("${motor.varName}", "${motor.varName} at %7d", ${motor.varName}.getCurrentPosition());\n`
    })

    code += `                telemetry.update();
            }

            // Stop all motion
`

    enabledDriveMotors.forEach(motor => {
      code += `            ${motor.varName}.setPower(0);\n`
    })

    code += `
            // Turn off RUN_TO_POSITION
`

    enabledDriveMotors.forEach(motor => {
      code += `            ${motor.varName}.setMode(DcMotor.RunMode.RUN_USING_ENCODER);\n`
    })

    code += `
            sleep(250);   // Pause after each move
        }
    }
}
`

    // Need to add runtime variable declaration
    code = code.replace('private IMU imu;', 'private IMU imu;\n    private ElapsedTime runtime = new ElapsedTime();')
    code = code.replace('import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;',
      'import org.firstinspires.ftc.robotcore.external.navigation.AngleUnit;\nimport com.qualcomm.robotcore.util.ElapsedTime;')

    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(project?.name || 'Auto').replace(/[^a-zA-Z0-9]/g, '')}Encoder.java`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportCode = () => {
    setShowExportDialog(true)
  }

  const handleExportConfirm = () => {
    setShowExportDialog(false)

    // Save preference if checkbox is checked
    if (saveExportPreference) {
      localStorage.setItem('vingvis-export-mode', selectedExportMode)
      localStorage.setItem('vingvis-save-export-preference', 'true')
    } else {
      localStorage.removeItem('vingvis-export-mode')
      localStorage.removeItem('vingvis-save-export-preference')
    }

    if (selectedExportMode === 'roadrunner') {
      exportRoadRunner()
    } else if (selectedExportMode === 'pedropathing') {
      exportPedroPathing()
    } else if (selectedExportMode === 'simple') {
      exportSimpleCode()
    } else if (selectedExportMode === 'encoder') {
      exportEncoderCode()
    }
  }

  // Helper function to get block category
  const getBlockCategory = (nodeId: string): string | null => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || !node.data?.type) return null

    // Check which category the block belongs to
    for (const [category, blocks] of Object.entries(BLOCK_TYPES)) {
      if (blocks.some((block: any) => block.id === node.data.type)) {
        return category
      }
    }
    return null
  }

  // ReactFlow handlers
  // Helper to detect cycles
  const wouldCreateCycle = (sourceId: string, targetId: string, currentEdges: Edge[]): boolean => {
    const visited = new Set<string>()

    const dfs = (nodeId: string): boolean => {
      if (nodeId === sourceId) return true
      if (visited.has(nodeId)) return false
      visited.add(nodeId)

      const outgoing = currentEdges.filter(e => e.source === nodeId)
      for (const edge of outgoing) {
        if (dfs(edge.target)) return true
      }
      return false
    }

    return dfs(targetId)
  }

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const { source, target, sourceHandle } = params

      // Validation 1: Prevent self-connections
      if (source === target) {
        toast.error('A node cannot connect to itself!')
        return
      }

      // Validation 2: Prevent duplicate connections between same nodes
      const duplicateConnection = edges.find(e =>
        e.source === source &&
        e.target === target &&
        e.sourceHandle === sourceHandle
      )
      if (duplicateConnection) {
        toast.error('These blocks are already connected!')
        return
      }

      // Validation 3: Prevent cycles (infinite loops in the graph)
      if (wouldCreateCycle(source!, target!, edges)) {
        toast.error('This connection would create a cycle! To create a loop, use the Loop block.')
        return
      }

      // Validation 4: Ensure each handle can only have one connection
      const sourceNode = nodes.find(n => n.id === source)
      if (sourceNode && sourceNode.data.type === 'if' && sourceHandle) {
        // Check if this handle already has a connection
        const existingConnection = edges.find(e =>
          e.source === source && e.sourceHandle === sourceHandle
        )
        if (existingConnection) {
          toast.error(`The ${sourceHandle.toUpperCase()} branch already has a connection!`)
          return
        }
      } else if (sourceNode && sourceNode.data.type === 'loop' && sourceHandle) {
        // Check if this handle already has a connection
        const existingConnection = edges.find(e =>
          e.source === source && e.sourceHandle === sourceHandle
        )
        if (existingConnection) {
          toast.error(`The ${sourceHandle.toUpperCase()} path already has a connection!`)
          return
        }
      } else if (sourceNode && sourceNode.data.type === 'parallel' && sourceHandle) {
        // For parallel blocks, each action handle can only have one connection
        if (sourceHandle !== 'next') {
          const existingConnection = edges.find(e =>
            e.source === source && e.sourceHandle === sourceHandle
          )
          if (existingConnection) {
            toast.error(`Action ${sourceHandle.replace('action', '')} already has a connection!`)
            return
          }
        }
      }
      // Removed restriction: Regular blocks can now have multiple outgoing connections
      // The cycle detection (Validation 3) already prevents actual loops

      // Validation 5: Prevent duplicate paths with same action category (for parallel connections)
      const targetCategory = getBlockCategory(target!)

      if (sourceNode && sourceNode.data.type === 'parallel' && targetCategory) {
        // Check all existing edges from this parallel block
        const existingEdgesFromSource = edges.filter(edge => edge.source === source)

        // Check if any existing edge connects to a node of the same category as the new target
        const hasSameCategoryConnection = existingEdgesFromSource.some(edge => {
          const existingTargetCategory = getBlockCategory(edge.target)
          return existingTargetCategory === targetCategory
        })

        if (hasSameCategoryConnection) {
          toast.error(`Cannot connect multiple ${targetCategory} blocks from the same Parallel block!`, {
            description: 'Each branch should have different action types (e.g., movement + servo + sensor).'
          })
          return
        }
      }

      setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } }, eds))
    },
    [setEdges, nodes, edges]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node<BlockNodeData>) => {
    setSelectedNode(node)
  }, [])

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault()

      const blockType = event.dataTransfer.getData('application/reactflow')
      if (!blockType || !reactFlowWrapper.current || !reactFlowInstance) return

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      })

      const blockInfo = Object.values(BLOCK_TYPES)
        .flat()
        .find((b) => b.id === blockType)

      if (!blockInfo) return

      const newNode = {
        id: `${blockType}-${Date.now()}`,
        type: 'blockNode',
        position,
        data: {
          label: blockInfo.label,
          type: blockInfo.id,
          distance: 24,
          power: 0.5,
          angle: 90,
          duration: 1,
          position: 0.5,
          targetX: robotX,
          targetY: robotY,
          targetHeading: robotHeading,
          curveType: 'linear' as 'linear' | 'spline' | 'bezier',
          score: 0,
        } as BlockNodeData,
      }

      setNodes((nds) => [...nds, newNode])
    },
    [reactFlowInstance, robotX, robotY, robotHeading, setNodes]
  )

  const onDragStart = (event: DragEvent, blockType: string) => {
    event.dataTransfer.setData('application/reactflow', blockType)
    event.dataTransfer.effectAllowed = 'move'
  }

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId))
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
      if (selectedNode?.id === nodeId) setSelectedNode(null)
    },
    [setNodes, setEdges, selectedNode]
  )

  const updateNodeData = useCallback(
    (nodeId: string, updates: Partial<BlockNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...updates } }
            : node
        )
      )
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...updates } } : null)
      }
    },
    [setNodes, selectedNode]
  )

  if (authLoading || loading || !project) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      <Navbar />

      {/* Toolbar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-2 sm:px-4 py-2 flex items-center justify-between gap-2 flex-shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2 flex-shrink-0">
          <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[120px] sm:max-w-none" title={project.name}>
            {project.name}
          </h1>

          {/* Animation Controls */}
          <div className="flex items-center gap-1">
            {!isAnimating ? (
              <Button onClick={startAnimation} size="sm" variant="default" disabled={nodes.filter(n => n.type === 'blockNode').length === 0}>
                <Play className="h-4 w-4 mr-2" />
                Animate
              </Button>
            ) : (
              <Button onClick={stopAnimation} size="sm" variant="destructive" className="h-8">
                <Pause className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Stop</span>
              </Button>
            )}
            <Button onClick={resetPosition} size="sm" variant="outline" className="h-8">
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Tools Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1">
                <Wrench className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Tools</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Drawing Tools</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={showRuler}
                onCheckedChange={setShowRuler}
              >
                <Ruler className="h-4 w-4 mr-2" />
                Ruler
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showProtractor}
                onCheckedChange={setShowProtractor}
              >
                <Compass className="h-4 w-4 mr-2" />
                Protractor
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={showGrid}
                onCheckedChange={setShowGrid}
              >
                <Grid3x3 className="h-4 w-4 mr-2" />
                Grid
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={isDrawingMode}
                onCheckedChange={setIsDrawingMode}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Drawing Mode
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={showWaypoints}
                onCheckedChange={setShowWaypoints}
              >
                <Waypoints className="h-4 w-4 mr-2" />
                Show Waypoints
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-4 w-4 mr-2" />
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fullscreen Field
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <Button onClick={undo} disabled={historyIndex <= 0} size="sm" variant="ghost" className="h-8 w-8 p-0" title="Undo">
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={redo} disabled={historyIndex >= actionHistory.length - 1} size="sm" variant="ghost" className="h-8 w-8 p-0" title="Redo">
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1">
                <Settings className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Settings</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Field Settings</DropdownMenuLabel>
              <div className="px-2 py-2 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Field Type</Label>
                  <Select value={selectedField} onValueChange={(v: any) => setSelectedField(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="intothedeep">Into the Deep</SelectItem>
                      <SelectItem value="centerstage">CenterStage</SelectItem>
                      <SelectItem value="decode">Decode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Path Mode</Label>
                  <Select value={pathMode} onValueChange={(v: any) => setPathMode(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="roadrunner">RoadRunner</SelectItem>
                      <SelectItem value="pedropathing">PedroPathing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-xs text-zinc-400">Smooth Curves</Label>
                  <Switch checked={useCurves} onCheckedChange={setUseCurves} />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Animation Speed</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[animationSpeed]}
                      onValueChange={([v]) => setAnimationSpeed(v)}
                      min={0.5}
                      max={2}
                      step={0.5}
                      className="flex-1"
                    />
                    <span className="text-xs text-zinc-400 w-8">{animationSpeed}x</span>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save & Export */}
          <Button onClick={handleSave} disabled={saving} size="sm" variant="ghost" className="h-8">
            <Save className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
          </Button>
          <Button onClick={exportCode} size="sm" className="h-8 bg-blue-600 hover:bg-blue-700">
            <Download className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Blocks + Hardware */}
        <div
          ref={sidebarRef}
          className={`${sidebarCollapsed ? 'w-12' : ''} ${
            isSidebarFloating ? 'absolute z-50 shadow-2xl' : 'relative'
          } bg-zinc-900 border-r border-zinc-800 flex flex-col ${
            isResizingSidebar || isDraggingSidebar ? '' : 'transition-all duration-300'
          }`}
          style={{
            width: sidebarCollapsed ? undefined : `${sidebarWidth}px`,
            left: isSidebarFloating ? `${sidebarPosition.x}px` : undefined,
            top: isSidebarFloating ? `${sidebarPosition.y}px` : undefined,
            height: isSidebarFloating ? '80vh' : '100%',
            willChange: isResizingSidebar || isDraggingSidebar ? 'transform, width' : undefined,
          }}
        >
          {/* Drag Handle Bar */}
          {!sidebarCollapsed && (
            <div
              className="h-8 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between px-2 cursor-move hover:bg-zinc-700 transition-colors select-none"
              onMouseDown={handleDragStart}
              title="Drag to move sidebar"
              style={{ userSelect: isDraggingSidebar ? 'none' : undefined }}
            >
              <div className="flex items-center gap-2">
                <Move className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-xs font-semibold text-white">Tools</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsSidebarFloating(!isSidebarFloating)
                    if (!isSidebarFloating) {
                      setSidebarPosition({ x: 20, y: 20 })
                    }
                  }}
                  className="h-6 w-6 p-0"
                  title={isSidebarFloating ? "Dock sidebar" : "Float sidebar"}
                >
                  {isSidebarFloating ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-6 w-6 p-0"
                  title="Hide sidebar"
                >
                  <PanelLeftClose className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Collapsed State Button */}
          {sidebarCollapsed && (
            <div className="p-2 border-b border-zinc-800 flex justify-center">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSidebarCollapsed(false)}
                className="h-8 w-8 p-0"
                title="Show sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!sidebarCollapsed && (
            <Tabs defaultValue="blocks" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-2 m-2 flex-shrink-0">
                <TabsTrigger value="blocks">Blocks</TabsTrigger>
                <TabsTrigger value="hardware">Hardware</TabsTrigger>
              </TabsList>

            <TabsContent value="blocks" className="flex-1 flex flex-col m-0 overflow-hidden h-0">
              {/* Block Search */}
              <div className="p-3 border-b border-zinc-800 flex-shrink-0">
                <Input
                  type="text"
                  placeholder="Search blocks..."
                  value={blockSearchQuery}
                  onChange={(e) => setBlockSearchQuery(e.target.value)}
                  className="h-8 text-xs bg-zinc-800 border-zinc-700 mb-2"
                />
                <div className="grid grid-cols-2 gap-1">
                  <Button
                    size="sm"
                    variant={activeTab === 'movement' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('movement')}
                    className="text-xs"
                  >
                    Move
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === 'mechanisms' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('mechanisms')}
                    className="text-xs"
                  >
                    Mech
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === 'sensors' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('sensors')}
                    className="text-xs"
                  >
                    Sensors
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTab === 'control' ? 'default' : 'ghost'}
                    onClick={() => setActiveTab('control')}
                    className="text-xs"
                  >
                    Control
                  </Button>
                </div>
              </div>
              <ScrollArea className="flex-1 h-full">
                <div className="p-3">
                <div className="space-y-1.5">
                  {BLOCK_TYPES[activeTab]
                    .filter(block =>
                      blockSearchQuery === '' ||
                      block.label.toLowerCase().includes(blockSearchQuery.toLowerCase()) ||
                      block.description.toLowerCase().includes(blockSearchQuery.toLowerCase())
                    )
                    .map((block) => {
                      const Icon = block.icon
                      return (
                        <div key={block.id} className="group">
                          <Button
                            draggable
                            onDragStart={(e) => onDragStart(e, block.id)}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs h-auto py-2 hover:bg-blue-500/10 hover:border-blue-500 cursor-grab active:cursor-grabbing"
                          >
                            <Icon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                            <div className="flex flex-col items-start flex-1 min-w-0">
                              <div className="font-medium">{block.label}</div>
                              <div className="text-[10px] text-zinc-500 truncate w-full group-hover:text-zinc-400">
                                {block.description}
                              </div>
                            </div>
                          </Button>
                        </div>
                      )
                    })}
                  {BLOCK_TYPES[activeTab].filter(block =>
                    blockSearchQuery === '' ||
                    block.label.toLowerCase().includes(blockSearchQuery.toLowerCase()) ||
                    block.description.toLowerCase().includes(blockSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center text-xs text-zinc-500 py-4">
                      No blocks found
                    </div>
                  )}
                </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="hardware" className="flex-1 m-0 flex flex-col overflow-hidden h-0">
              <ScrollArea className="flex-1 h-full">
                <div className="p-3">
                <div className="space-y-4">
                {/* Expansion Hub Toggle */}
                <div
                  onClick={() => openConfigDialog('expansion-hub', 'control', 0)}
                  className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                    hasExpansionHub
                      ? 'bg-blue-900/30 border-blue-600 hover:bg-blue-900/40'
                      : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Expansion Hub</span>
                    <div className={`w-2 h-2 rounded-full ${hasExpansionHub ? 'bg-green-500' : 'bg-zinc-600'}`} />
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {hasExpansionHub ? 'Enabled - Click to configure' : 'Click to enable second hub'}
                  </div>
                </div>

                {/* Motor Ports - Port-Based Configuration */}
                <div>
                  <h3 className="text-xs font-bold text-white mb-2">Motor Ports (4 ports per hub)</h3>

                  {/* Control Hub Motors */}
                  <div className="mb-3">
                    <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Control Hub</div>
                    <div className="grid grid-cols-2 gap-2">
                      {controlMotors.map((motor) => (
                        <div
                          key={`control-motor-${motor.port}`}
                          onClick={() => openConfigDialog('motor', 'control', motor.port)}
                          className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                            motor.enabled
                              ? 'bg-blue-900/30 border-blue-600 hover:bg-blue-900/40'
                              : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                          } ${pathMode === 'pedropathing' && motor.port < 4 ? 'opacity-75' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono font-bold text-zinc-300">Port {motor.port}</span>
                            {motor.enabled ? (
                              <span className="text-[9px] text-blue-400 font-semibold">● ON</span>
                            ) : (
                              <span className="text-[9px] text-zinc-500">○ Empty</span>
                            )}
                          </div>
                          {motor.enabled && (
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-blue-200 font-medium truncate">{motor.name}</div>
                              <div className="flex gap-1.5">
                                {motor.reversed && <div className="text-[9px] text-orange-400">↻ Reversed</div>}
                                {motor.encoderEnabled && <div className="text-[9px] text-green-400">◉ Encoder</div>}
                              </div>
                            </div>
                          )}
                          {!motor.enabled && (
                            <div className="text-[10px] text-zinc-500 text-center">
                              <Plus className="h-3 w-3 mx-auto mb-0.5" />
                              Click
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expansion Hub Motors */}
                  {hasExpansionHub && (
                    <div className="mb-3">
                      <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Expansion Hub</div>
                      <div className="grid grid-cols-2 gap-2">
                        {expansionMotors.map((motor) => (
                          <div
                            key={`expansion-motor-${motor.port}`}
                            onClick={() => openConfigDialog('motor', 'expansion', motor.port)}
                            className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                              motor.enabled
                                ? 'bg-blue-900/30 border-blue-600 hover:bg-blue-900/40'
                                : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-mono font-bold text-zinc-300">Port {motor.port}</span>
                              {motor.enabled ? (
                                <span className="text-[9px] text-blue-400 font-semibold">● ON</span>
                              ) : (
                                <span className="text-[9px] text-zinc-500">○ Empty</span>
                              )}
                            </div>
                            {motor.enabled && (
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-blue-200 font-medium truncate">{motor.name}</div>
                                {motor.reversed && <div className="text-[9px] text-orange-400">↻ Reversed</div>}
                              </div>
                            )}
                            {!motor.enabled && (
                              <div className="text-[10px] text-zinc-500 text-center">
                                <Plus className="h-3 w-3 mx-auto mb-0.5" />
                                Click
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {pathMode === 'pedropathing' && (
                    <div className="p-2 bg-blue-900/20 rounded border border-blue-700/50 text-[10px] text-blue-300">
                      First 4 control hub motors are required for PedroPathing
                    </div>
                  )}
                </div>

                {/* Servo Ports - Port-Based Configuration */}
                <div>
                  <h3 className="text-xs font-bold text-white mb-2">Servo Ports (6 ports per hub)</h3>

                  {/* Control Hub Servos */}
                  <div className="mb-3">
                    <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Control Hub</div>
                    <div className="grid grid-cols-3 gap-2">
                      {controlServos.map((servo) => (
                        <div
                          key={`control-servo-${servo.port}`}
                          onClick={() => openConfigDialog('servo', 'control', servo.port)}
                          className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                            servo.enabled
                              ? 'bg-green-900/30 border-green-600 hover:bg-green-900/40'
                              : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono font-bold text-zinc-300">Port {servo.port}</span>
                            {servo.enabled ? (
                              <span className="text-[9px] text-green-400 font-semibold">● ON</span>
                            ) : (
                              <span className="text-[9px] text-zinc-500">○ Empty</span>
                            )}
                          </div>
                          {servo.enabled && (
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-green-200 font-medium truncate">{servo.name}</div>
                              <div className="text-[9px] text-zinc-400">{servo.type === 'continuous' ? '↻ Continuous' : '↔ Standard'}</div>
                            </div>
                          )}
                          {!servo.enabled && (
                            <div className="text-[10px] text-zinc-500 text-center">
                              <Plus className="h-3 w-3 mx-auto mb-0.5" />
                              Click
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expansion Hub Servos */}
                  {hasExpansionHub && (
                    <div className="mb-3">
                      <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Expansion Hub</div>
                      <div className="grid grid-cols-3 gap-2">
                        {expansionServos.map((servo) => (
                          <div
                            key={`expansion-servo-${servo.port}`}
                            onClick={() => openConfigDialog('servo', 'expansion', servo.port)}
                            className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                              servo.enabled
                                ? 'bg-green-900/30 border-green-600 hover:bg-green-900/40'
                                : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-mono font-bold text-zinc-300">Port {servo.port}</span>
                              {servo.enabled ? (
                                <span className="text-[9px] text-green-400 font-semibold">● ON</span>
                              ) : (
                                <span className="text-[9px] text-zinc-500">○ Empty</span>
                              )}
                            </div>
                            {servo.enabled && (
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-green-200 font-medium truncate">{servo.name}</div>
                                <div className="text-[9px] text-zinc-400">{servo.type === 'continuous' ? '↻ Continuous' : '↔ Standard'}</div>
                              </div>
                            )}
                            {!servo.enabled && (
                              <div className="text-[10px] text-zinc-500 text-center">
                                <Plus className="h-3 w-3 mx-auto mb-0.5" />
                                Click
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* I2C Buses - Port-Based Configuration */}
                <div>
                  <h3 className="text-xs font-bold text-white mb-2">I2C Buses (4 buses per hub)</h3>

                  {/* Control Hub I2C */}
                  <div className="mb-3">
                    <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Control Hub</div>
                    <div className="grid grid-cols-2 gap-2">
                      {controlI2C.map((device) => (
                        <div
                          key={`control-i2c-${device.bus}`}
                          onClick={() => openConfigDialog('i2c', 'control', device.bus)}
                          className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                            device.enabled
                              ? 'bg-purple-900/30 border-purple-600 hover:bg-purple-900/40'
                              : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                          } ${device.bus === 0 ? 'opacity-90' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono font-bold text-zinc-300">Bus {device.bus}</span>
                            {device.enabled ? (
                              <span className="text-[9px] text-purple-400 font-semibold">● ON</span>
                            ) : (
                              <span className="text-[9px] text-zinc-500">○ Empty</span>
                            )}
                          </div>
                          {device.enabled && (
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-purple-200 font-medium truncate">{device.name}</div>
                              <div className="text-[9px] text-zinc-400 truncate">{device.type.toUpperCase()}</div>
                              {device.bus === 0 && <div className="text-[9px] text-blue-400">Built-in</div>}
                            </div>
                          )}
                          {!device.enabled && (
                            <div className="text-[10px] text-zinc-500 text-center">
                              {device.bus === 0 ? (
                                <div className="text-blue-400">Built-in IMU</div>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mx-auto mb-0.5" />
                                  Click
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expansion Hub I2C */}
                  {hasExpansionHub && (
                    <div className="mb-3">
                      <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Expansion Hub</div>
                      <div className="grid grid-cols-2 gap-2">
                        {expansionI2C.map((device) => (
                          <div
                            key={`expansion-i2c-${device.bus}`}
                            onClick={() => openConfigDialog('i2c', 'expansion', device.bus)}
                            className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                              device.enabled
                                ? 'bg-purple-900/30 border-purple-600 hover:bg-purple-900/40'
                                : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                            } ${device.bus === 0 ? 'opacity-90' : ''}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-mono font-bold text-zinc-300">Bus {device.bus}</span>
                              {device.enabled ? (
                                <span className="text-[9px] text-purple-400 font-semibold">● ON</span>
                              ) : (
                                <span className="text-[9px] text-zinc-500">○ Empty</span>
                              )}
                            </div>
                            {device.enabled && (
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-purple-200 font-medium truncate">{device.name}</div>
                                <div className="text-[9px] text-zinc-400 truncate">{device.type.toUpperCase()}</div>
                                {device.bus === 0 && <div className="text-[9px] text-blue-400">Built-in</div>}
                              </div>
                            )}
                            {!device.enabled && (
                              <div className="text-[10px] text-zinc-500 text-center">
                                {device.bus === 0 ? (
                                  <div className="text-blue-400">Built-in IMU</div>
                                ) : (
                                  <>
                                    <Plus className="h-3 w-3 mx-auto mb-0.5" />
                                    Click
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Digital Ports - Port-Based Configuration */}
                <div>
                  <h3 className="text-xs font-bold text-white mb-2">Digital I/O Ports (8 ports per hub)</h3>

                  {/* Control Hub Digital */}
                  <div className="mb-3">
                    <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Control Hub</div>
                    <div className="grid grid-cols-4 gap-2">
                      {controlDigital.map((device) => (
                        <div
                          key={`control-digital-${device.port}`}
                          onClick={() => openConfigDialog('digital', 'control', device.port)}
                          className={`p-2 rounded border cursor-pointer transition-all hover:scale-105 ${
                            device.enabled
                              ? 'bg-orange-900/30 border-orange-600 hover:bg-orange-900/40'
                              : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-[10px] font-mono font-bold text-zinc-300 mb-1">D{device.port}</div>
                            {device.enabled ? (
                              <div className="space-y-0.5">
                                <div className="text-[9px] text-orange-400 font-semibold">● ON</div>
                                <div className="text-[9px] text-orange-200 font-medium truncate">{device.name}</div>
                                <div className="text-[8px] text-zinc-400 truncate">{device.type}</div>
                              </div>
                            ) : (
                              <div>
                                <span className="text-[9px] text-zinc-500">○ Empty</span>
                                <Plus className="h-3 w-3 mx-auto mt-1 text-zinc-600" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expansion Hub Digital */}
                  {hasExpansionHub && (
                    <div className="mb-3">
                      <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Expansion Hub</div>
                      <div className="grid grid-cols-4 gap-2">
                        {expansionDigital.map((device) => (
                          <div
                            key={`expansion-digital-${device.port}`}
                            onClick={() => openConfigDialog('digital', 'expansion', device.port)}
                            className={`p-2 rounded border cursor-pointer transition-all hover:scale-105 ${
                              device.enabled
                                ? 'bg-orange-900/30 border-orange-600 hover:bg-orange-900/40'
                                : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-[10px] font-mono font-bold text-zinc-300 mb-1">D{device.port}</div>
                              {device.enabled ? (
                                <div className="space-y-0.5">
                                  <div className="text-[9px] text-orange-400 font-semibold">● ON</div>
                                  <div className="text-[9px] text-orange-200 font-medium truncate">{device.name}</div>
                                  <div className="text-[8px] text-zinc-400 truncate">{device.type}</div>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-[9px] text-zinc-500">○ Empty</span>
                                  <Plus className="h-3 w-3 mx-auto mt-1 text-zinc-600" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Analog Ports - Port-Based Configuration */}
                <div>
                  <h3 className="text-xs font-bold text-white mb-2">Analog Input Ports (4 ports per hub)</h3>

                  {/* Control Hub Analog */}
                  <div className="mb-3">
                    <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Control Hub</div>
                    <div className="grid grid-cols-2 gap-2">
                      {controlAnalog.map((device) => (
                        <div
                          key={`control-analog-${device.port}`}
                          onClick={() => openConfigDialog('analog', 'control', device.port)}
                          className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                            device.enabled
                              ? 'bg-yellow-900/30 border-yellow-600 hover:bg-yellow-900/40'
                              : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-mono font-bold text-zinc-300">A{device.port}</span>
                            {device.enabled ? (
                              <span className="text-[9px] text-yellow-400 font-semibold">● ON</span>
                            ) : (
                              <span className="text-[9px] text-zinc-500">○ Empty</span>
                            )}
                          </div>
                          {device.enabled && (
                            <div className="space-y-0.5">
                              <div className="text-[10px] text-yellow-200 font-medium truncate">{device.name}</div>
                              <div className="text-[9px] text-zinc-400 truncate">{device.type}</div>
                            </div>
                          )}
                          {!device.enabled && (
                            <div className="text-[10px] text-zinc-500 text-center">
                              <Plus className="h-3 w-3 mx-auto mb-0.5" />
                              Click
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expansion Hub Analog */}
                  {hasExpansionHub && (
                    <div className="mb-3">
                      <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Expansion Hub</div>
                      <div className="grid grid-cols-2 gap-2">
                        {expansionAnalog.map((device) => (
                          <div
                            key={`expansion-analog-${device.port}`}
                            onClick={() => openConfigDialog('analog', 'expansion', device.port)}
                            className={`p-3 rounded border cursor-pointer transition-all hover:scale-105 ${
                              device.enabled
                                ? 'bg-yellow-900/30 border-yellow-600 hover:bg-yellow-900/40'
                                : 'bg-zinc-900/50 border-zinc-700 hover:bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-mono font-bold text-zinc-300">A{device.port}</span>
                              {device.enabled ? (
                                <span className="text-[9px] text-yellow-400 font-semibold">● ON</span>
                              ) : (
                                <span className="text-[9px] text-zinc-500">○ Empty</span>
                              )}
                            </div>
                            {device.enabled && (
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-yellow-200 font-medium truncate">{device.name}</div>
                                <div className="text-[9px] text-zinc-400 truncate">{device.type}</div>
                              </div>
                            )}
                            {!device.enabled && (
                              <div className="text-[10px] text-zinc-500 text-center">
                                <Plus className="h-3 w-3 mx-auto mb-0.5" />
                                Click
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          )}

          {/* Resize Handle */}
          {!sidebarCollapsed && (
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500/50 transition-colors group"
              onMouseDown={handleResizeStart}
              title="Drag to resize"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-zinc-400" />
              </div>
            </div>
          )}
        </div>

        {/* Center: Node Editor */}
        <div className="flex-1 flex flex-col bg-zinc-950" ref={reactFlowWrapper}>
          <div className="h-full w-full">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              className="bg-zinc-950"
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                animated: true,
                type: 'smoothstep',
                style: { stroke: '#3b82f6', strokeWidth: 2 },
              }}
            >
              <Background color="#27272a" gap={20} size={1} />
              <Controls className="bg-zinc-900 border border-zinc-800" />

              {/* Node Preview Controls */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Card className="bg-zinc-900/95 border-zinc-800 backdrop-blur">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="text-xs font-semibold text-zinc-400 mr-2">
                        Node Preview
                      </div>

                      {!isNodePreviewing ? (
                        <Button
                          size="sm"
                          onClick={startNodePreview}
                          className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={getNodesInExecutionOrder().length === 0}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={previousPreviewNode}
                            className="h-7 px-2 border-zinc-700"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="text-xs text-zinc-400 min-w-[60px] text-center">
                            {currentPreviewNodeIndex + 1} / {getNodesInExecutionOrder().length}
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={nextPreviewNode}
                            className="h-7 px-2 border-zinc-700"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            onClick={stopNodePreview}
                            className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white ml-2"
                          >
                            <SkipBack className="h-3 w-3 mr-1" />
                            Stop
                          </Button>
                        </>
                      )}

                      {isNodePreviewing && (
                        <>
                          <div className="h-4 w-px bg-zinc-700 mx-1" />
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-zinc-400">Speed</Label>
                            <Slider
                              value={[nodePreviewSpeed]}
                              onValueChange={(value) => setNodePreviewSpeed(value[0])}
                              min={0.5}
                              max={2}
                              step={0.5}
                              className="w-20"
                            />
                            <span className="text-xs text-zinc-500 min-w-[32px]">{nodePreviewSpeed}x</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <MiniMap
                className="bg-zinc-900 border border-zinc-800"
                nodeColor={(node) => {
                  if (node.type === 'startNode') return '#10b981'
                  if (node.type === 'endNode') return '#ef4444'
                  return '#3b82f6'
                }}
                maskColor="rgba(0, 0, 0, 0.6)"
              />
            </ReactFlow>
          </div>
          {nodes.length === 1 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="text-zinc-500 text-sm">
                <p className="font-semibold mb-2">Drag and Drop Blocks</p>
                <p className="text-xs">Drag blocks from the left panel onto the canvas</p>
                <p className="text-xs mt-1">Connect nodes by dragging from one handle to another</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Config + Preview */}
        {!rightSidebarCollapsed && (
          <div
            ref={rightSidebarRef}
            className="border-l border-zinc-800 flex flex-col bg-zinc-900 relative"
            style={{
              width: `${rightSidebarWidth}px`,
              minWidth: '300px',
              maxWidth: '600px',
              transition: isResizingRightSidebar ? 'none' : 'width 0.2s ease',
              willChange: isResizingRightSidebar ? 'width' : 'auto'
            }}
          >
            {/* Header with close button */}
            <div className="h-8 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between px-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Preview & Config</span>
              </div>
              <Button
                onClick={() => setRightSidebarCollapsed(true)}
                title="Close sidebar"
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                <PanelLeftClose className="h-3 w-3" />
              </Button>
            </div>

            {/* Resize handle on left edge */}
            <div
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-blue-500/50 transition-colors group z-10"
              onMouseDown={handleRightSidebarResizeStart}
              title="Drag to resize"
            >
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-zinc-400" />
              </div>
            </div>

          {/* Servo/Motor Preview */}
          <div
            ref={hardwareStatusRef}
            className="border-b border-zinc-800 bg-zinc-900/50 relative flex flex-col overflow-hidden"
            style={{
              height: hardwareStatusCollapsed ? 'auto' : `${hardwareStatusHeight}px`,
              minHeight: hardwareStatusCollapsed ? 'auto' : '150px',
              transition: isResizingHardwareStatus ? 'none' : 'height 0.2s ease',
              willChange: isResizingHardwareStatus ? 'height' : 'auto'
            }}
          >
            {/* Header with close button */}
            <div className="h-8 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between px-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Hardware Status</span>
              </div>
              <Button
                onClick={() => setHardwareStatusCollapsed(!hardwareStatusCollapsed)}
                title={hardwareStatusCollapsed ? "Expand Hardware Status" : "Collapse Hardware Status"}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
              >
                {hardwareStatusCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
            </div>

            {/* Content */}
            {!hardwareStatusCollapsed && (
              <>
                <div className="p-4 overflow-auto flex-1">
                  <div className="space-y-2">
                    {servos.slice(0, 3).map((servo, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="text-xs text-zinc-400 w-16 truncate">{servo.name}</div>
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${(servoPositions[servo.name] || 0.5) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs font-mono text-zinc-500 w-10">
                          {((servoPositions[servo.name] || 0.5) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                    {motors.slice(0, 4).map((motor, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="text-xs text-zinc-400 w-16 truncate">{motor.name}</div>
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${Math.abs(motorSpeeds[motor.name] || 0) * 100}%` }}
                          />
                        </div>
                        <div className="text-xs font-mono text-zinc-500 w-10">
                          {((motorSpeeds[motor.name] || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resize handle */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize bg-transparent hover:bg-blue-500/50 transition-colors group"
                  onMouseDown={handleHardwareStatusResizeStart}
                  title="Drag to resize"
                >
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripHorizontal className="h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              </>
            )}
          </div>

          {selectedNode && selectedNode.type === 'blockNode' && (
            <div className="border-b border-zinc-800 p-4 max-h-64 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Configure: {selectedNode.data.label}</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="h-6 w-6 p-0"
                  title="Delete Node"
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              </div>
              <div className="space-y-3">
                {/* Score Configuration */}
                {(selectedNode.data.type === 'moveToPosition' || selectedNode.data.type === 'custom') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Score Points</Label>
                    <Input
                      type="number"
                      value={selectedNode.data.score || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { score: parseInt(e.target.value) || 0 })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}

                {(selectedNode.data.type === 'moveToPosition' || selectedNode.data.type === 'splineTo') && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Target X (inches)</Label>
                      <Input
                        type="number"
                        value={selectedNode.data.targetX || 0}
                        onChange={(e) => updateNodeData(selectedNode.id, { targetX: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Target Y (inches)</Label>
                      <Input
                        type="number"
                        value={selectedNode.data.targetY || 0}
                        onChange={(e) => updateNodeData(selectedNode.id, { targetY: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Target Heading (degrees)</Label>
                      <Input
                        type="number"
                        value={selectedNode.data.targetHeading || 0}
                        onChange={(e) => updateNodeData(selectedNode.id, { targetHeading: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                  </>
                )}
                {(selectedNode.data.type.includes('move') && !selectedNode.data.type.includes('To')) && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Distance (inches)</Label>
                      <Input
                        type="number"
                        value={selectedNode.data.distance || 24}
                        onChange={(e) => updateNodeData(selectedNode.id, { distance: parseFloat(e.target.value) })}
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Power</Label>
                      <Slider
                        value={[selectedNode.data.power || 0.5]}
                        onValueChange={([v]) => updateNodeData(selectedNode.id, { power: v })}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.power || 0.5) * 100).toFixed(0)}%</div>
                    </div>
                  </>
                )}
                {(selectedNode.data.type.includes('turn') && selectedNode.data.type !== 'turnToHeading') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Angle (degrees)</Label>
                    <Input
                      type="number"
                      value={selectedNode.data.angle || 90}
                      onChange={(e) => updateNodeData(selectedNode.id, { angle: parseFloat(e.target.value) })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedNode.data.type === 'turnToHeading' && (
                  <div>
                    <Label className="text-xs text-zinc-400">Target Heading (degrees)</Label>
                    <Input
                      type="number"
                      value={selectedNode.data.targetHeading || 0}
                      onChange={(e) => updateNodeData(selectedNode.id, { targetHeading: parseFloat(e.target.value) })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}

                {/* Combined Action Section for Movement Blocks */}
                {(selectedNode.data.type.includes('move') || selectedNode.data.type.includes('turn') || selectedNode.data.type.includes('strafe') || selectedNode.data.type === 'splineTo') && (
                  <div className="border-t border-zinc-700 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="checkbox"
                        id="enableSecondary"
                        checked={selectedNode.data.enableSecondaryAction || false}
                        onChange={(e) => updateNodeData(selectedNode.id, { enableSecondaryAction: e.target.checked })}
                        className="w-4 h-4 rounded bg-zinc-800 border-zinc-600"
                      />
                      <Label htmlFor="enableSecondary" className="text-xs text-zinc-400 cursor-pointer">
                        Enable Combined Action
                      </Label>
                    </div>

                    {selectedNode.data.enableSecondaryAction && (
                      <div className="space-y-3 pl-6 border-l-2 border-emerald-500/30">
                        <div>
                          <Label className="text-xs text-zinc-400">Action Type</Label>
                          <Select
                            value={selectedNode.data.secondaryActionType || 'servo'}
                            onValueChange={(value: 'servo' | 'motor' | 'sensor') =>
                              updateNodeData(selectedNode.id, { secondaryActionType: value })
                            }
                          >
                            <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="servo">Servo Control</SelectItem>
                              <SelectItem value="motor">Motor Control</SelectItem>
                              <SelectItem value="sensor">Sensor Read</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {selectedNode.data.secondaryActionType === 'servo' && (
                          <>
                            <div>
                              <Label className="text-xs text-zinc-400">Servo</Label>
                              <Select
                                value={selectedNode.data.secondaryServoName || servos[0]?.name}
                                onValueChange={(v) => updateNodeData(selectedNode.id, { secondaryServoName: v })}
                              >
                                <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {servos.map((servo) => (
                                    <SelectItem key={servo.name} value={servo.name}>{servo.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-zinc-400">Position</Label>
                              <Slider
                                value={[selectedNode.data.secondaryServoPosition || 0.5]}
                                onValueChange={([v]) => updateNodeData(selectedNode.id, { secondaryServoPosition: v })}
                                max={1}
                                step={0.01}
                                className="mt-2"
                              />
                              <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.secondaryServoPosition || 0.5) * 100).toFixed(0)}%</div>
                            </div>
                          </>
                        )}

                        {selectedNode.data.secondaryActionType === 'motor' && (
                          <>
                            <div>
                              <Label className="text-xs text-zinc-400">Motor</Label>
                              <Select
                                value={selectedNode.data.secondaryMotorName || motors[0]?.name}
                                onValueChange={(v) => updateNodeData(selectedNode.id, { secondaryMotorName: v })}
                              >
                                <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {motors.map((motor) => (
                                    <SelectItem key={motor.name} value={motor.name}>{motor.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs text-zinc-400">Power</Label>
                              <Slider
                                value={[selectedNode.data.secondaryMotorPower || 0.5]}
                                onValueChange={([v]) => updateNodeData(selectedNode.id, { secondaryMotorPower: v })}
                                max={1}
                                step={0.01}
                                className="mt-2"
                              />
                              <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.secondaryMotorPower || 0.5) * 100).toFixed(0)}%</div>
                            </div>
                          </>
                        )}

                        {selectedNode.data.secondaryActionType === 'sensor' && (
                          <div className="text-xs text-zinc-500 italic">
                            Sensor reading will be performed during this movement
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {selectedNode.data.type === 'wait' && (
                  <div>
                    <Label className="text-xs text-zinc-400">Duration (seconds)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={selectedNode.data.duration || 1}
                      onChange={(e) => updateNodeData(selectedNode.id, { duration: parseFloat(e.target.value) })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedNode.data.type.startsWith('servo') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Position</Label>
                    <Slider
                      value={[selectedNode.data.position || 0.5]}
                      onValueChange={([v]) => updateNodeData(selectedNode.id, { position: v })}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                    <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.position || 0.5) * 100).toFixed(0)}%</div>
                  </div>
                )}
                {(selectedNode.data.type === 'setServo' || selectedNode.data.type.startsWith('servo') || selectedNode.data.type === 'continuousServo') && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Select Servo</Label>
                      <Select
                        value={selectedNode.data.servoName || servos[0]?.name}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { servoName: v })}
                      >
                        <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {servos.map((servo) => (
                            <SelectItem key={servo.name} value={servo.name}>{servo.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Position</Label>
                      <Slider
                        value={[selectedNode.data.position || 0.5]}
                        onValueChange={([v]) => {
                          updateNodeData(selectedNode.id, { position: v })
                          setServoPositions({ ...servoPositions, [selectedNode.data.servoName || servos[0]?.name]: v })
                        }}
                        max={1}
                        step={0.01}
                        className="mt-2"
                      />
                      <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.position || 0.5) * 100).toFixed(0)}%</div>
                    </div>
                  </>
                )}
                {(selectedNode.data.type === 'runMotor' || selectedNode.data.type === 'setMotorPower') && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Select Motor</Label>
                      <Select
                        value={selectedNode.data.motorName || motors[0]?.name}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { motorName: v })}
                      >
                        <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {motors.map((motor) => (
                            <SelectItem key={motor.name} value={motor.name}>{motor.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-zinc-400">Power</Label>
                      <Slider
                        value={[selectedNode.data.power || 0.5]}
                        onValueChange={([v]) => {
                          updateNodeData(selectedNode.id, { power: v })
                          setMotorSpeeds({ ...motorSpeeds, [selectedNode.data.motorName || motors[0]?.name]: v })
                        }}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="text-xs text-zinc-500 mt-1">{((selectedNode.data.power || 0.5) * 100).toFixed(0)}%</div>
                    </div>
                  </>
                )}
                {selectedNode.data.type === 'stopMotor' && (
                  <>
                    <div>
                      <Label className="text-xs text-zinc-400">Select Motor(s) to Stop</Label>
                      <Select
                        value={selectedNode.data.motorName || motors[0]?.name}
                        onValueChange={(v) => updateNodeData(selectedNode.id, { motorName: v })}
                      >
                        <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {motors.map((motor) => (
                            <SelectItem key={motor.name} value={motor.name}>{motor.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {(selectedNode.data.type === 'loop') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Loop Count</Label>
                    <Input
                      type="number"
                      value={selectedNode.data.loopCount || 1}
                      onChange={(e) => updateNodeData(selectedNode.id, { loopCount: parseInt(e.target.value) || 1 })}
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {(selectedNode.data.type === 'everynode') && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-zinc-400">Collection Type</Label>
                      <Select
                        value={selectedNode.data.collectionType || 'waypoints'}
                        onValueChange={(value: 'waypoints' | 'array' | 'range') =>
                          updateNodeData(selectedNode.id, { collectionType: value })
                        }
                      >
                        <SelectTrigger className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waypoints">Waypoints</SelectItem>
                          <SelectItem value="array">Array</SelectItem>
                          <SelectItem value="range">Range</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedNode.data.collectionType === 'array' && (
                      <>
                        <div>
                          <Label className="text-xs text-zinc-400">Array Name</Label>
                          <Input
                            type="text"
                            value={selectedNode.data.collectionName || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { collectionName: e.target.value })}
                            placeholder="myArray"
                            className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-zinc-400">Iterator Variable</Label>
                          <Input
                            type="text"
                            value={selectedNode.data.iteratorVariable || 'item'}
                            onChange={(e) => updateNodeData(selectedNode.id, { iteratorVariable: e.target.value })}
                            placeholder="item"
                            className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                          />
                        </div>
                      </>
                    )}

                    {selectedNode.data.collectionType === 'range' && (
                      <>
                        <div>
                          <Label className="text-xs text-zinc-400">Iterator Variable</Label>
                          <Input
                            type="text"
                            value={selectedNode.data.iteratorVariable || 'i'}
                            onChange={(e) => updateNodeData(selectedNode.id, { iteratorVariable: e.target.value })}
                            placeholder="i"
                            className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs text-zinc-400">Start</Label>
                            <Input
                              type="number"
                              value={selectedNode.data.startRange || 0}
                              onChange={(e) => updateNodeData(selectedNode.id, { startRange: parseInt(e.target.value) || 0 })}
                              className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-zinc-400">End</Label>
                            <Input
                              type="number"
                              value={selectedNode.data.endRange || 10}
                              onChange={(e) => updateNodeData(selectedNode.id, { endRange: parseInt(e.target.value) || 10 })}
                              className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedNode.data.collectionType === 'waypoints' && (
                      <div>
                        <Label className="text-xs text-zinc-400">Iterator Variable</Label>
                        <Input
                          type="text"
                          value={selectedNode.data.iteratorVariable || 'waypoint'}
                          onChange={(e) => updateNodeData(selectedNode.id, { iteratorVariable: e.target.value })}
                          placeholder="waypoint"
                          className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
                {selectedNode.data.type === 'if' && (
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-zinc-400">Condition</Label>
                      <Input
                        type="text"
                        value={selectedNode.data.condition || ''}
                        onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                        placeholder="e.g., sensorValue > 10"
                        className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm font-mono"
                      />
                    </div>
                    <div className="text-xs text-zinc-500 space-y-1">
                      <div className="font-semibold text-zinc-400">Examples:</div>
                      <div className="pl-2 space-y-0.5 font-mono">
                        <div>• sensorValue {">"} 100</div>
                        <div>• alliance == Alliance.RED</div>
                        <div>• distance {"<"} 24 && distance {">"} 12</div>
                        <div>• gamepad1.a</div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-700">
                        <div className="font-semibold text-zinc-400 mb-1">Branching:</div>
                        <div className="text-zinc-500">
                          Connect blocks to the <span className="text-green-400">TRUE</span> handle for actions when condition is met, and to the <span className="text-red-400">FALSE</span> handle for actions when it's not.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {(selectedNode.data.type === 'waitUntil' || selectedNode.data.type === 'waitForSensor') && (
                  <div>
                    <Label className="text-xs text-zinc-400">Condition</Label>
                    <Input
                      type="text"
                      value={selectedNode.data.condition || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                      placeholder="e.g., sensor > 10"
                      className="mt-1 h-8 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                )}
                {selectedNode.data.type === 'custom' && (
                  <div>
                    <Label className="text-xs text-zinc-400">Java Code</Label>
                    <textarea
                      value={selectedNode.data.customCode || ''}
                      onChange={(e) => updateNodeData(selectedNode.id, { customCode: e.target.value })}
                      placeholder="// Your code here"
                      className="w-full h-32 mt-1 p-2 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Field Preview */}
          <div
            ref={mapFieldRef}
            className="relative flex flex-col overflow-hidden"
            style={{
              height: mapFieldCollapsed ? 'auto' : `${mapFieldHeight}px`,
              minHeight: mapFieldCollapsed ? 'auto' : '300px',
              transition: isResizingMapField ? 'none' : 'height 0.2s ease',
              willChange: isResizingMapField ? 'height' : 'auto'
            }}
          >
            {/* Header with controls */}
            <div className="h-8 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between px-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Field Preview</span>
                {!mapFieldCollapsed && (
                  <div className="text-xs text-zinc-500">
                    {useCurves ? 'Smooth Curves' : 'Linear'}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1">
                {!mapFieldCollapsed && (
                  <Button
                    onClick={toggleFullscreen}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-3 w-3" />
                    ) : (
                      <Maximize2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => setMapFieldCollapsed(!mapFieldCollapsed)}
                  title={mapFieldCollapsed ? "Expand Field Preview" : "Collapse Field Preview"}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  {mapFieldCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {/* Content */}
            {!mapFieldCollapsed && (
              <>
                <div className="p-4 overflow-auto flex-1">

            {/* Instructions */}
            <div className="mb-3 p-2 bg-zinc-800/50 rounded border border-zinc-700/50 text-xs text-zinc-400">
              <div className="font-semibold text-zinc-300 mb-1">Interactive Controls:</div>
              <div className="space-y-0.5">
                <div>• <span className="text-green-400">Drag robot</span>: Move position</div>
                <div>• <span className="text-yellow-400">Shift+Drag robot</span>: Rotate heading</div>
                <div>• <span className="text-blue-400">Drag waypoints</span>: Reposition blocks</div>
                <div>• <span className="text-purple-400">Drawing mode</span>: Draw path on field</div>
              </div>
            </div>
            <div ref={fieldContainerRef} className={`aspect-square bg-zinc-950 rounded-lg border border-zinc-800 overflow-hidden relative ${isFullscreen ? 'w-screen h-screen !aspect-auto flex items-center justify-center bg-black' : ''}`}>
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className={isFullscreen ? 'max-w-full max-h-full' : 'w-full h-full'}
                style={{
                  cursor: isDrawingMode ? 'crosshair' :
                          isDraggingRobot ? 'grabbing' :
                          isRotatingRobot ? 'crosshair' :
                          draggedWaypointIndex !== null ? 'move' :
                          'default'
                }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                onContextMenu={handleCanvasContextMenu}
                onDoubleClick={handleCanvasDoubleClick}
              />
              <MathTools
                showRuler={showRuler}
                showProtractor={showProtractor}
                showGrid={showGrid}
                gridSize={gridSize}
                canvasRef={canvasRef}
                robotPosition={{ x: robotX, y: robotY }}
                robotHeading={robotHeading}
                protractorLockToRobot={protractorLockToRobot}
                onProtractorLockToggle={() => setProtractorLockToRobot(!protractorLockToRobot)}
                fieldSize={144}
              />

              {/* Fullscreen Controls Overlay */}
              {isFullscreen && (
                <div className="absolute top-0 left-0 right-0 p-4 z-50">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side controls */}
                    <div className="flex flex-col gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-zinc-700">
                      <div className="text-xs text-zinc-400 font-semibold mb-1">Field Options</div>
                      <Button
                        onClick={() => setShowWaypoints(!showWaypoints)}
                        size="sm"
                        variant={showWaypoints ? "default" : "outline"}
                        className="h-8 justify-start"
                      >
                        <Waypoints className="h-3 w-3 mr-2" />
                        Waypoints
                      </Button>
                      <Button
                        onClick={() => setIsDrawingMode(!isDrawingMode)}
                        size="sm"
                        variant={isDrawingMode ? "default" : "outline"}
                        className="h-8 justify-start"
                      >
                        <Pencil className="h-3 w-3 mr-2" />
                        Drawing
                      </Button>
                      <Button
                        onClick={() => setShowGrid(!showGrid)}
                        size="sm"
                        variant={showGrid ? "default" : "outline"}
                        className="h-8 justify-start"
                      >
                        <Grid3x3 className="h-3 w-3 mr-2" />
                        Grid
                      </Button>
                      <Button
                        onClick={() => setShowRuler(!showRuler)}
                        size="sm"
                        variant={showRuler ? "default" : "outline"}
                        className="h-8 justify-start"
                      >
                        <Ruler className="h-3 w-3 mr-2" />
                        Ruler
                      </Button>
                      <Button
                        onClick={() => setShowProtractor(!showProtractor)}
                        size="sm"
                        variant={showProtractor ? "default" : "outline"}
                        className="h-8 justify-start"
                      >
                        <Compass className="h-3 w-3 mr-2" />
                        Protractor
                      </Button>
                    </div>

                    {/* Center - Robot Info */}
                    <div className="flex gap-2 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-zinc-700">
                      <div className="text-xs">
                        <div className="text-zinc-500">X</div>
                        <div className="font-mono text-white">{robotX.toFixed(1)}"</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-zinc-500">Y</div>
                        <div className="font-mono text-white">{robotY.toFixed(1)}"</div>
                      </div>
                      <div className="text-xs">
                        <div className="text-zinc-500">θ</div>
                        <div className="font-mono text-white">{robotHeading.toFixed(0)}°</div>
                      </div>
                    </div>

                    {/* Right side - Exit button */}
                    <Button
                      onClick={toggleFullscreen}
                      size="sm"
                      variant="outline"
                      className="bg-black/80 backdrop-blur-sm border-zinc-700 hover:bg-zinc-800"
                    >
                      <Minimize2 className="h-4 w-4 mr-2" />
                      Exit Fullscreen
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
                <div className="text-zinc-500">X</div>
                <div className="font-mono text-white">{robotX.toFixed(1)}"</div>
              </div>
              <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
                <div className="text-zinc-500">Y</div>
                <div className="font-mono text-white">{robotY.toFixed(1)}"</div>
              </div>
              <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
                <div className="text-zinc-500">θ</div>
                <div className="font-mono text-white">{robotHeading.toFixed(1)}°</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-500 text-center">
              Nodes: {nodes.filter(n => n.type === 'blockNode').length} | Connections: {edges.length}
            </div>
                </div>

                {/* Resize handle */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 cursor-row-resize bg-transparent hover:bg-blue-500/50 transition-colors group"
                  onMouseDown={handleMapFieldResizeStart}
                  title="Drag to resize"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripHorizontal className="h-4 w-4 text-zinc-400" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        )}

        {/* Collapsed right sidebar button */}
        {rightSidebarCollapsed && (
          <div className="border-l border-zinc-800 bg-zinc-900 flex items-start justify-center p-2">
            <Button
              onClick={() => setRightSidebarCollapsed(false)}
              title="Show sidebar"
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Hardware Configuration Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {configDialogType === 'expansion-hub' ? 'Expansion Hub Configuration' : (
                <>
                  Configure {configDialogHub === 'control' ? 'Control' : 'Expansion'} Hub -{' '}
                  {configDialogType === 'motor' && `Motor Port ${configDialogPort}`}
                  {configDialogType === 'servo' && `Servo Port ${configDialogPort}`}
                  {configDialogType === 'i2c' && `I2C Bus ${configDialogPort}`}
                  {configDialogType === 'digital' && `Digital Port ${configDialogPort}`}
                  {configDialogType === 'analog' && `Analog Port ${configDialogPort}`}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Configure your hardware device settings below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Motor Configuration */}
            {configDialogType === 'motor' && (() => {
              const motorArray = configDialogHub === 'control' ? controlMotors : expansionMotors
              const setMotorArray = configDialogHub === 'control' ? setControlMotors : setExpansionMotors
              const motor = motorArray[configDialogPort]

              return (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Motor</Label>
                    <Switch
                      checked={motor.enabled}
                      onCheckedChange={(checked) => {
                        const newMotors = [...motorArray]
                        newMotors[configDialogPort].enabled = checked
                        setMotorArray(newMotors)
                      }}
                    />
                  </div>

                  {motor.enabled && (
                    <>
                      <div>
                        <Label className="text-white">Motor Name</Label>
                        <Input
                          value={motor.name}
                          onChange={(e) => {
                            const newMotors = [...motorArray]
                            newMotors[configDialogPort].name = e.target.value
                            setMotorArray(newMotors)
                          }}
                          className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                          placeholder="e.g. motorFL"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-white">Reversed Direction</Label>
                        <Switch
                          checked={motor.reversed}
                          onCheckedChange={(checked) => {
                            const newMotors = [...motorArray]
                            newMotors[configDialogPort].reversed = checked
                            setMotorArray(newMotors)
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white">Motor Encoder</Label>
                          <p className="text-xs text-zinc-400 mt-0.5">Enable position/velocity feedback</p>
                        </div>
                        <Switch
                          checked={motor.encoderEnabled}
                          onCheckedChange={(checked) => {
                            const newMotors = [...motorArray]
                            newMotors[configDialogPort].encoderEnabled = checked
                            setMotorArray(newMotors)
                          }}
                        />
                      </div>
                    </>
                  )}
                </>
              )
            })()}

            {/* Servo Configuration */}
            {configDialogType === 'servo' && (() => {
              const servoArray = configDialogHub === 'control' ? controlServos : expansionServos
              const setServoArray = configDialogHub === 'control' ? setControlServos : setExpansionServos
              const servo = servoArray[configDialogPort]

              return (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Servo</Label>
                    <Switch
                      checked={servo.enabled}
                      onCheckedChange={(checked) => {
                        const newServos = [...servoArray]
                        newServos[configDialogPort].enabled = checked
                        setServoArray(newServos)
                      }}
                    />
                  </div>

                  {servo.enabled && (
                    <>
                      <div>
                        <Label className="text-white">Servo Name</Label>
                        <Input
                          value={servo.name}
                          onChange={(e) => {
                            const newServos = [...servoArray]
                            newServos[configDialogPort].name = e.target.value
                            setServoArray(newServos)
                          }}
                          className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                          placeholder="e.g. claw"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Servo Type</Label>
                        <Select
                          value={servo.type}
                          onValueChange={(v: 'standard' | 'continuous') => {
                            const newServos = [...servoArray]
                            newServos[configDialogPort].type = v
                            setServoArray(newServos)
                          }}
                        >
                          <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Standard (180°)</SelectItem>
                            <SelectItem value="continuous">Continuous Rotation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              )
            })()}

            {/* I2C Configuration */}
            {configDialogType === 'i2c' && (() => {
              const i2cArray = configDialogHub === 'control' ? controlI2C : expansionI2C
              const setI2CArray = configDialogHub === 'control' ? setControlI2C : setExpansionI2C
              const device = i2cArray[configDialogPort]

              return (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable I2C Device</Label>
                    <Switch
                      checked={device.enabled}
                      onCheckedChange={(checked) => {
                        const newDevices = [...i2cArray]
                        newDevices[configDialogPort].enabled = checked
                        setI2CArray(newDevices)
                      }}
                      disabled={configDialogPort === 0}
                    />
                  </div>

                  {configDialogPort === 0 && (
                    <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded border border-blue-700/50">
                      Bus 0 has a built-in IMU (BNO055) that is always enabled
                    </div>
                  )}

                  {device.enabled && (
                    <>
                      <div>
                        <Label className="text-white">Device Name</Label>
                        <Input
                          value={device.name}
                          onChange={(e) => {
                            const newDevices = [...i2cArray]
                            newDevices[configDialogPort].name = e.target.value
                            setI2CArray(newDevices)
                          }}
                          className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                          placeholder="e.g. colorSensor"
                          disabled={configDialogPort === 0}
                        />
                      </div>

                      <div>
                        <Label className="text-white">Device Type</Label>
                        <Select
                          value={device.type}
                          onValueChange={(v: 'imu' | 'distance' | 'color' | 'servo-controller' | 'color-range') => {
                            const newDevices = [...i2cArray]
                            newDevices[configDialogPort].type = v
                            setI2CArray(newDevices)
                          }}
                          disabled={configDialogPort === 0}
                        >
                          <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="imu">IMU (BNO055)</SelectItem>
                            <SelectItem value="distance">Distance Sensor</SelectItem>
                            <SelectItem value="color">Color Sensor</SelectItem>
                            <SelectItem value="color-range">REV Color/Range Sensor</SelectItem>
                            <SelectItem value="servo-controller">Servo Controller</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white">I2C Address (hex)</Label>
                        <Input
                          value={device.address}
                          onChange={(e) => {
                            const newDevices = [...i2cArray]
                            newDevices[configDialogPort].address = e.target.value
                            setI2CArray(newDevices)
                          }}
                          className="mt-1 bg-zinc-800 border-zinc-700 text-white font-mono"
                          placeholder="0x28"
                          disabled={configDialogPort === 0}
                        />
                      </div>
                    </>
                  )}
                </>
              )
            })()}

            {/* Digital Sensor Configuration */}
            {configDialogType === 'digital' && (() => {
              const digitalArray = configDialogHub === 'control' ? controlDigital : expansionDigital
              const setDigitalArray = configDialogHub === 'control' ? setControlDigital : setExpansionDigital
              const device = digitalArray[configDialogPort]

              return (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Digital Sensor</Label>
                    <Switch
                      checked={device.enabled}
                      onCheckedChange={(checked) => {
                        const newDevices = [...digitalArray]
                        newDevices[configDialogPort].enabled = checked
                        setDigitalArray(newDevices)
                      }}
                    />
                  </div>

                  {device.enabled && (
                    <>
                      <div>
                        <Label className="text-white">Sensor Name</Label>
                        <Input
                          value={device.name}
                          onChange={(e) => {
                            const newDevices = [...digitalArray]
                            newDevices[configDialogPort].name = e.target.value
                            setDigitalArray(newDevices)
                          }}
                          className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                          placeholder="e.g. touchSensor"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Sensor Type</Label>
                        <Select
                          value={device.type}
                          onValueChange={(v: 'touch' | 'limit-switch' | 'magnetic' | 'led') => {
                            const newDevices = [...digitalArray]
                            newDevices[configDialogPort].type = v
                            setDigitalArray(newDevices)
                          }}
                        >
                          <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="touch">Touch Sensor</SelectItem>
                            <SelectItem value="limit-switch">Limit Switch</SelectItem>
                            <SelectItem value="magnetic">Magnetic Sensor</SelectItem>
                            <SelectItem value="led">LED Indicator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              )
            })()}

            {/* Analog Sensor Configuration */}
            {configDialogType === 'analog' && (() => {
              const analogArray = configDialogHub === 'control' ? controlAnalog : expansionAnalog
              const setAnalogArray = configDialogHub === 'control' ? setControlAnalog : setExpansionAnalog
              const device = analogArray[configDialogPort]

              return (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Enable Analog Sensor</Label>
                    <Switch
                      checked={device.enabled}
                      onCheckedChange={(checked) => {
                        const newDevices = [...analogArray]
                        newDevices[configDialogPort].enabled = checked
                        setAnalogArray(newDevices)
                      }}
                    />
                  </div>

                  {device.enabled && (
                    <>
                      <div>
                        <Label className="text-white">Sensor Name</Label>
                        <Input
                          value={device.name}
                          onChange={(e) => {
                            const newDevices = [...analogArray]
                            newDevices[configDialogPort].name = e.target.value
                            setAnalogArray(newDevices)
                          }}
                          className="mt-1 bg-zinc-800 border-zinc-700 text-white"
                          placeholder="e.g. potentiometer"
                        />
                      </div>

                      <div>
                        <Label className="text-white">Sensor Type</Label>
                        <Select
                          value={device.type}
                          onValueChange={(v: 'potentiometer' | 'light-sensor' | 'ultrasonic') => {
                            const newDevices = [...analogArray]
                            newDevices[configDialogPort].type = v
                            setAnalogArray(newDevices)
                          }}
                        >
                          <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="potentiometer">Potentiometer</SelectItem>
                            <SelectItem value="light-sensor">Light Sensor</SelectItem>
                            <SelectItem value="ultrasonic">Ultrasonic Sensor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              )
            })()}

            {/* Expansion Hub Configuration */}
            {configDialogType === 'expansion-hub' && (
              <>
                <div className="flex items-center justify-between">
                  <Label className="text-white">Enable Expansion Hub</Label>
                  <Switch
                    checked={hasExpansionHub}
                    onCheckedChange={setHasExpansionHub}
                  />
                </div>

                {/* REV Robotics Expansion Hub Image */}
                <div className="flex justify-center bg-zinc-800/30 rounded border border-zinc-700 p-2">
                  <img
                    src="https://docs.revrobotics.com/~gitbook/image?url=https%3A%2F%2F1359443677-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-legacy-files%2Fo%2Fassets%252Fftc-control-system%252F-M8MwLCHioGUmBeHgdmq%252F-M8N18g7FA00YUtTVAaT%252F38.png%3Fgeneration%3D1590614867952389%26alt%3Dmedia&width=300&dpr=4&quality=100&sign=c44f7f9&sv=2"
                    alt="REV Robotics Expansion Hub"
                    className="w-48 h-auto rounded"
                  />
                </div>

                <div className="text-xs text-zinc-400 bg-zinc-800/50 p-3 rounded border border-zinc-700">
                  <p className="font-semibold mb-2">About Expansion Hub</p>
                  <p className="mb-2">
                    The Expansion Hub provides additional ports for your FTC robot:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[10px]">
                    <li>4 additional motor ports (0-3)</li>
                    <li>6 additional servo ports (0-5)</li>
                    <li>4 additional I2C buses (0-3)</li>
                    <li>8 additional digital I/O ports (0-7)</li>
                    <li>4 additional analog input ports (0-3)</li>
                  </ul>
                </div>

                {hasExpansionHub && (
                  <div className="text-xs text-green-400 bg-green-900/20 p-3 rounded border border-green-800">
                    Expansion Hub is enabled. Configure individual ports in the hardware tabs above.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeConfigDialog} className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Export Code</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Choose the code export format for your autonomous program
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <button
                onClick={() => setSelectedExportMode('simple')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedExportMode === 'simple'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Simple Code (Time-Based)</h3>
                    <p className="text-sm text-zinc-400">
                      Basic time-based movement with motor power control. Perfect for beginners.
                    </p>
                  </div>
                  {selectedExportMode === 'simple' && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 ml-2">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedExportMode('encoder')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedExportMode === 'encoder'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">Encoder Code (Position-Based)</h3>
                    <p className="text-sm text-zinc-400">
                      Precise encoder-based movement with RUN_TO_POSITION mode. Automatically configures encoders.
                    </p>
                  </div>
                  {selectedExportMode === 'encoder' && (
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 ml-2">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedExportMode('pedropathing')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedExportMode === 'pedropathing'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">PedroPathing</h3>
                    <p className="text-sm text-zinc-400">
                      Advanced path following with the PedroPathing library. Smooth curves and precise control.
                    </p>
                  </div>
                  {selectedExportMode === 'pedropathing' && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 ml-2">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>

              <button
                onClick={() => setSelectedExportMode('roadrunner')}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  selectedExportMode === 'roadrunner'
                    ? 'border-orange-500 bg-orange-500/10'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white mb-1">RoadRunner</h3>
                    <p className="text-sm text-zinc-400">
                      Industry-standard path following with trajectory sequences. Requires RoadRunner quickstart.
                    </p>
                  </div>
                  {selectedExportMode === 'roadrunner' && (
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 ml-2">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Save preference checkbox */}
            <div className="flex items-center space-x-2 pt-2 border-t border-zinc-800">
              <Switch
                id="save-export-preference"
                checked={saveExportPreference}
                onCheckedChange={setSaveExportPreference}
              />
              <Label htmlFor="save-export-preference" className="text-sm text-zinc-300 cursor-pointer">
                Save for next export (auto-select this option)
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportConfirm}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Export {selectedExportMode === 'simple' ? 'Simple' : selectedExportMode === 'encoder' ? 'Encoder' : selectedExportMode === 'pedropathing' ? 'PedroPathing' : 'RoadRunner'} Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CurvesEditor() {
  return (
    <ReactFlowProvider>
      <CurvesEditorInner />
    </ReactFlowProvider>
  )
}
