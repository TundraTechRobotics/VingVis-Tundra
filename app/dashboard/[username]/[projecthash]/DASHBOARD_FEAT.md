# Dashboard Features & Capabilities

This document provides a comprehensive overview of all features and capabilities implemented in the VingVis Dashboard (Project Editor).

## Table of Contents
1. [Visual Programming Interface](#visual-programming-interface)
2. [Movement & Path Planning](#movement--path-planning)
3. [Hardware Configuration](#hardware-configuration)
4. [Field Visualization](#field-visualization)
5. [Animation & Preview](#animation--preview)
6. [Code Export](#code-export)
7. [Project Management](#project-management)
8. [User Interface Features](#user-interface-features)

---

## Visual Programming Interface

### Node-Based Programming
- **ReactFlow Integration**: Drag-and-drop visual programming using ReactFlow library
- **Node Types**:
  - Start Node (entry point)
  - End Node (termination)
  - Block Nodes (action blocks)
- **Connection System**: Visual edges connecting nodes to define execution flow
- **Node Selection**: Click nodes to edit properties in right sidebar
- **Node Categories**:
  - Movement (11 block types)
  - Mechanisms (5 block types)
  - Sensors (5 block types)
  - Control Flow (7 block types)

### Block Library Categories

#### Movement Blocks
1. **Move to Position** - Navigate to specific X,Y coordinates with heading
2. **Spline to Position** - Smooth curved path to coordinates
3. **Move Forward** - Linear forward movement by distance
4. **Move Backward** - Linear backward movement by distance
5. **Strafe Left** - Lateral left movement (omni/mecanum)
6. **Strafe Right** - Lateral right movement (omni/mecanum)
7. **Turn Left** - Rotate counterclockwise by angle
8. **Turn Right** - Rotate clockwise by angle
9. **Turn to Heading** - Rotate to absolute heading angle
10. **Pivot Turn** - Turn around one wheel
11. **Follow Path** - Follow complex multi-point path

#### Mechanism Blocks
1. **Set Servo Position** - Control servo to specific position (0-1)
2. **Continuous Servo** - Run continuous rotation servo
3. **Run Motor** - Activate mechanism motor with power
4. **Stop Motor** - Stop mechanism motor
5. **Set Motor Power** - Set motor power level

#### Sensor Blocks
1. **Read IMU** - Get IMU orientation data
2. **Read Distance** - Read distance sensor value
3. **Read Color** - Read color sensor data
4. **Wait for Sensor** - Wait until sensor condition met
5. **Read Touch** - Read touch sensor state

#### Control Flow Blocks
1. **Wait** - Pause execution for duration (seconds)
2. **Wait Until** - Pause until condition is true
3. **Loop** - Repeat actions N times
4. **If/Else** - Conditional execution with true/false branches
5. **Run Parallel** - Execute up to 3 actions simultaneously
6. **For Every Node** - Iterator for collections (waypoints, arrays, ranges)
7. **Custom Code** - Insert custom Java code snippet

### Combined Actions
- **Secondary Actions on Movement**: Execute servo/motor/sensor actions during movement
- **Temporal Markers**: Actions triggered at specific points along trajectory
- **Parallel Execution**: Multiple actions running simultaneously

---

## Movement & Path Planning

### Path Types
- **Linear Paths**: Direct point-to-point movement
- **Spline Curves**: Smooth Catmull-Rom spline interpolation
- **Bezier Curves**: Cubic bezier curve calculations
- **Toggle**: Switch between linear and curved path visualization

### Path Generation
- **Waypoint System**: Automatically calculates waypoints from node graph
- **Path Simplification**: Ramer-Douglas-Peucker algorithm for drawn paths
- **Curve Interpolation**: 100-step spline generation for smooth motion
- **Path Visualization**: Real-time path rendering on field canvas

### Drawing Mode
- **Freehand Drawing**: Draw paths directly on field with mouse
- **Point Sampling**: Captures points every 5 inches during drawing
- **Smart Conversion**: Converts drawn paths to "Move to Position" nodes
- **Automatic Simplification**: Reduces drawn points while preserving shape
- **Intelligent Layout**: Auto-arranges generated nodes in flowing grid (4 per row)

### Position Control
- **Target Position**: Set X, Y coordinates (0-144 inches)
- **Heading Control**: Set robot orientation (0-360 degrees)
- **Distance Input**: Specify movement distance in inches
- **Angle Input**: Specify turn angles in degrees
- **Real-time Updates**: Immediate path recalculation on changes

---

## Hardware Configuration

### FTC Hardware Architecture
- **Control Hub**: Primary hub with 4 motor, 6 servo, 4 I2C, 8 digital, 4 analog ports
- **Expansion Hub**: Optional secondary hub (doubles available ports)
- **Port Management**: Visual configuration for all ports on both hubs
- **Enable/Disable**: Toggle individual devices on/off

### Motor Configuration
- **4 Motor Ports** per hub (0-3)
- **Properties**:
  - Custom naming
  - Reversed direction toggle
  - Encoder enable/disable
  - Hub assignment (Control or Expansion)
- **Drivetrain Motors**: Auto-configured from project template
  - Front Left (FL)
  - Front Right (FR)
  - Back Left (BL)
  - Back Right (BR)
  - Center Left (CL) - for H-Drive
  - Center Right (CR) - for Swerve
- **Mechanism Motors**: Configurable for arms, intakes, etc.

### Servo Configuration
- **6 Servo Ports** per hub (0-5)
- **Types**:
  - Standard (180° rotation, position 0-1)
  - Continuous Rotation
- **Properties**:
  - Custom naming
  - Type selection
  - Hub assignment
- **Real-time Preview**: Test servo positions in editor

### I2C Devices
- **4 I2C Buses** per hub (0-3)
- **Bus 0**: Built-in IMU (BNO055) always enabled
- **Device Types**:
  - IMU (Inertial Measurement Unit)
  - Distance Sensor
  - Color Sensor
  - REV Color/Range Sensor
  - Servo Controller
- **Properties**:
  - Device name
  - I2C address (hex)
  - Bus number
  - Hub assignment

### Digital I/O Devices
- **8 Digital Ports** per hub (0-7)
- **Sensor Types**:
  - Touch Sensor
  - Limit Switch
  - Magnetic Sensor
  - LED Indicator
- **Properties**:
  - Device name
  - Sensor type
  - Hub assignment

### Analog Input Devices
- **4 Analog Ports** per hub (0-3)
- **Sensor Types**:
  - Potentiometer
  - Light Sensor
  - Ultrasonic Sensor
- **Properties**:
  - Device name
  - Sensor type
  - Hub assignment

### Hardware Status Panel
- **Real-time Display**: Shows all configured hardware
- **Status Indicators**: Enabled/disabled state
- **Quick Access**: Click to open configuration dialog
- **Collapsible**: Minimize to save screen space
- **Resizable**: Drag to adjust panel height (150-500px)

---

## Field Visualization

### Field Images
- **3 Season Fields**:
  - INTO THE DEEP (2024-25)
  - CENTERSTAGE (2023-24)
  - DECODE (custom field)
- **WebP Format**: Optimized image loading
- **Fallback Grid**: Shows grid pattern if image fails to load
- **Field Selector**: Dropdown to switch between seasons

### Canvas Interaction
- **Robot Manipulation**:
  - **Drag**: Move robot position
  - **Shift+Drag**: Rotate robot heading
  - **Visual Feedback**: Cursor changes based on mode
- **Waypoint Editing**:
  - **Drag Waypoints**: Reposition individual waypoints
  - **Visual Markers**: Numbered circles at each waypoint
  - **Heading Indicators**: Yellow arrows showing robot orientation
- **Context Menu**: Right-click disabled (reserved for future features)

### Robot Visualization
- **18" Square Robot**: Scaled accurately to field (144" x 144")
- **Visual Elements**:
  - Green body (primary color)
  - Dark green border
  - Yellow front indicator (heading direction)
  - Drop shadow for depth
- **Rotation**: Visual heading indicator rotates with robot

### Drawing Tools
- **Grid Overlay**: 24" grid squares (optional)
- **Ruler Lines**: Crosshair rulers at robot position
- **Protractor**: Angle measurement tool
  - Lock to robot option
  - Shows heading measurements
- **Math Tools Component**: Unified tool management

### Waypoint System
- **Auto-generation**: Waypoints calculated from node graph
- **Visual Markers**:
  - Green circle: Starting position
  - Blue circles: Intermediate waypoints
  - White outline and numbers
  - Heading arrows (yellow)
- **Drag to Edit**: Reposition waypoints by dragging
- **Toggle Visibility**: Show/hide waypoints
- **Real-time Update**: Path recalculates on waypoint changes

### Fullscreen Mode
- **Expanded View**: Full-screen field visualization
- **Overlay Controls**:
  - Field options (left panel)
  - Robot position info (center)
  - Exit button (right)
- **High Resolution**: Scales up to 2048px for quality
- **Escape Key**: Exit fullscreen
- **Responsive**: Maintains aspect ratio

---

## Animation & Preview

### Path Animation
- **Play/Pause**: Start/stop animation
- **Speed Control**: Adjustable animation speed (slider)
- **Progress Bar**: Visual indication of completion
- **Interpolation**: Smooth robot movement along path
- **Real-time Rendering**: Updates every frame using requestAnimationFrame

### Node-by-Node Preview
- **Step Through**: Advance one node at a time
- **Auto-advance**: Automatic progression with configurable speed
- **Visual Highlighting**:
  - Selected node highlighted in flow diagram
  - Completed path shows in green
  - Upcoming path shows in gray
- **Zoom to Node**: Automatically centers and zooms to active node
- **Field Animation**: Smooth path growth animation (800ms with ease-out)
- **Loop Support**: Restart from first node after reaching end

### Path Visualization During Preview
- **Progressive Display**: Path grows as preview advances
- **Dual-color System**:
  - Green: Completed portion of path
  - Gray: Full planned path (faded)
- **Waypoint States**:
  - Completed: Green with white border
  - Upcoming: Gray with gray border
  - Numbered indicators on all waypoints
- **Smooth Transitions**: 800ms animated interpolation between states

### Animation Controls
- **Navigation Buttons**:
  - Previous Node
  - Next Node
  - Stop Preview
- **Speed Slider**: 0.5x to 2x speed adjustment
- **Reset Position**: Return robot to starting position
- **Stop Button**: Halt animation and clear state

---

## Code Export

### Export Formats
4 different code generation modes:

#### 1. Simple Code (Time-Based)
- **Best for**: Beginners, simple programs
- **Features**:
  - Time-based movement (sleep commands)
  - Basic motor power control
  - No external dependencies
  - Easy to understand and modify
- **Motor Control**: Direct setPower() calls
- **Movement**: Estimated timing (24 inches per second)
- **Mechanisms**: Servo and motor control included

#### 2. Encoder Code (Position-Based)
- **Best for**: Precise autonomous movement
- **Features**:
  - RUN_TO_POSITION encoder mode
  - Accurate distance measurement
  - Configurable encoder constants
  - Automatic encoder setup
- **Constants**:
  - COUNTS_PER_MOTOR_REV (537.7 for goBILDA 5202/5203)
  - DRIVE_GEAR_REDUCTION (1.0 default)
  - WHEEL_DIAMETER_INCHES (4.0 default)
- **Method**: `encoderDrive()` with precise target positions
- **Strafing**: Supports mecanum/omni strafe movements

#### 3. PedroPathing
- **Best for**: Advanced path following with smooth curves
- **Features**:
  - Bezier curve path following
  - State machine architecture
  - Follower class integration
  - Real-time pose tracking
- **Path Building**: PathChain with BezierLine segments
- **State Management**: 3-state system (following, executing mechanisms, complete)
- **Telemetry**: X, Y, heading display
- **Mechanisms**: Executed after path completion

#### 4. RoadRunner
- **Best for**: Industry-standard trajectory following
- **Features**:
  - TrajectorySequenceBuilder
  - Temporal markers for combined actions
  - Spline/line movements
  - Advanced path optimization
- **Requirements**: RoadRunner quickstart integration
- **Methods**: lineTo(), splineTo(), turn(), waitSeconds()
- **Markers**: addTemporalMarker() for parallel actions
- **Control Flow**: Supports if/else, loops, parallel blocks

### Export Features
- **Auto-naming**: Generated from project name
- **Java Package**: org.firstinspires.ftc.teamcode
- **Imports**: Automatic inclusion of required libraries
- **Annotations**: @Autonomous with proper naming
- **Hardware Map**: Auto-generated hardware declarations
- **Initialization**: Complete init() method with all devices
- **Comments**: Descriptive comments for each action
- **Custom Code**: Preserves user-inserted custom code blocks

### Export Dialog
- **4 Export Options**: Visual cards with descriptions
- **Selection Indicator**: Blue/Green/Purple/Orange highlighting
- **Save Preference**: Remember last export choice
- **LocalStorage**: Persists export preference across sessions
- **Download**: Automatic .java file download with proper naming

### Control Flow in Export
- **If/Else Blocks**: Generates conditional branches with true/false paths
- **Loop Blocks**: for-loop with configurable iteration count
- **Parallel Blocks**: Multiple actions in single temporal marker
- **Custom Code**: Direct insertion of user Java code
- **EveryNode**: Iterators for ranges, arrays, waypoints

---

## Project Management

### Project Loading
- **Authenticated Users**: Load from Supabase database
- **Guest Users**: Load from localStorage
- **URL Parameters**: username and projecthash identification
- **Error Handling**: Redirects to dashboard if project not found
- **Timeout Protection**: 10-second timeout prevents infinite loading

### Auto-save
- **Debounced Saving**: 2-second delay after last change
- **Toast Notifications**: "Auto-saving..." and "Auto-saved" messages
- **Storage**:
  - Authenticated: Supabase database
  - Guest: localStorage (guestProjects key)
- **Data Saved**:
  - Workflow nodes (ReactFlow nodes)
  - Workflow edges (connections)
  - Action blocks (legacy, for backward compatibility)

### Manual Save
- **Save Button**: Explicit save trigger in navbar
- **Loading State**: "Saving..." notification
- **Success/Error Feedback**: Toast notifications
- **Data Persistence**: Same as auto-save (Supabase or localStorage)

### Session Management
- **Guest Mode Detection**: URL-based (username === 'guest')
- **Session Storage**: Tracks guest mode state
- **Authentication Check**: Redirects non-guests without auth
- **Loading States**: Prevents actions during authentication check

---

## User Interface Features

### Layout System

#### Left Sidebar (Block Library)
- **Collapsible**: Hide/show with button
- **Resizable**: Drag resize handle (250-600px width)
- **Floating Mode**: Detach and position anywhere (future feature)
- **Drag Handles**: Visual grip indicators
- **Tabs System**: 4 categories (Movement, Mechanisms, Sensors, Control)
- **Search Bar**: Filter blocks by name
- **Block Cards**: 
  - Icon + Label + Description
  - Drag to canvas to create node
  - Hover effects

#### Center Canvas (ReactFlow)
- **ReactFlow Controls**: Zoom, fit view, lock
- **MiniMap**: Overview of entire workflow
- **Background Grid**: Dot pattern for alignment
- **Drag-and-Drop**: Create nodes by dragging from sidebar
- **Connection Handles**: Multiple handles for branching (if/else, loop, parallel)
- **Auto-layout**: Attempts to prevent node overlap

#### Right Sidebar (Properties + Field)
- **Collapsible**: Hide/show entire sidebar
- **Resizable**: Drag left edge (300-600px width)
- **Sections**:
  - Node Properties (top, scrollable)
  - Field Preview (middle, resizable)
  - Hardware Status (bottom, collapsible, resizable)

### Responsive Panels

#### Map Field Panel
- **Resizable Height**: 300-800px range
- **Collapse Toggle**: Minimize to just header
- **Resize Handle**: Top border with grip icon
- **Smooth Transitions**: 0.2s ease animation (except during resize)
- **RAF Optimization**: requestAnimationFrame for smooth dragging

#### Hardware Status Panel
- **Resizable Height**: 150-500px range
- **Collapse Toggle**: Minimize to save space
- **Resize Handle**: Bottom border with grip icon
- **Device List**: Shows all enabled hardware
- **Status Indicators**: Visual enabled/disabled state

#### Node Properties Panel
- **Dynamic Content**: Changes based on selected node
- **Scroll Area**: Handles overflow gracefully
- **Input Types**:
  - Number inputs (distance, angle, duration)
  - Sliders (power, position, 0-1 range)
  - Dropdowns (servo/motor selection)
  - Text inputs (custom code, names)
  - Checkboxes (enable secondary actions)
- **Real-time Updates**: Changes immediately reflected in canvas

### Performance Optimizations
- **RAF (RequestAnimationFrame)**: Smooth drag/resize without layout thrashing
- **Direct DOM Updates**: Style updates bypass React rendering during drag
- **State Batching**: Final state update only at drag/resize end
- **Refs for Current Values**: Avoids re-render triggers during interaction
- **Animation Frame Cleanup**: Proper cleanup on unmount
- **Cursor Management**: Dynamic cursor based on interaction mode

### Visual Feedback
- **Hover States**: Buttons, cards, nodes change on hover
- **Active States**: Selected nodes, active tabs highlighted
- **Loading States**: Spinners, disabled buttons during operations
- **Toast Notifications**: 
  - Success (green)
  - Error (red)
  - Info (blue)
  - Loading (animated)
- **Progress Indicators**: Animation progress bar
- **Status Badges**: Hardware status, node counts

### Keyboard Shortcuts
- **Escape**: Exit fullscreen mode
- **Shift+Drag**: Rotate robot instead of moving

### Responsive Design
- **Dynamic Heights**: Panels adjust to content and user preference
- **Overflow Handling**: ScrollArea components for long lists
- **Flexible Layout**: Sidebars collapse for more canvas space
- **Fullscreen Adaptation**: Field canvas scales to window size

---

## Technical Implementation

### Technologies Used
- **React 19**: Latest React with hooks
- **Next.js 15**: App Router, server/client components
- **ReactFlow 11.11.4**: Node-based visual programming
- **Supabase**: Authentication and database
- **Tailwind CSS v4**: Styling
- **Radix UI**: Accessible UI components (via shadcn/ui)
- **Lucide React**: Icon library
- **Sonner**: Toast notifications

### State Management
- **useState**: Local component state
- **useEffect**: Side effects, lifecycle
- **useCallback**: Memoized callbacks for performance
- **useRef**: Direct DOM access, animation frames
- **Custom Hooks**: 
  - useNodesState (ReactFlow)
  - useEdgesState (ReactFlow)
  - useAuth (authentication context)

### Data Structures
- **Nodes**: ReactFlow nodes with BlockNodeData type
- **Edges**: ReactFlow edges with custom styling
- **Actions**: Legacy ActionBlock array (backward compatibility)
- **Hardware**: Typed arrays for motors, servos, sensors
- **Path**: Array of {x, y, heading} points

### Algorithms
- **Catmull-Rom Spline**: Smooth curve interpolation
- **Ramer-Douglas-Peucker**: Path simplification
- **Cubic Bezier**: Curve calculations
- **Graph Traversal**: DFS for node execution order
- **Coordinate Transforms**: Canvas ↔ field coordinate mapping

### Canvas Rendering
- **HTML5 Canvas**: 2D rendering context
- **Scaling**: Dynamic scaling based on canvas size
- **Image Loading**: Async field image loading with fallback
- **Animation Loop**: requestAnimationFrame for smooth 60fps
- **Layer Rendering**:
  1. Background (field image or grid)
  2. Full path (faded)
  3. Animated path (highlighted)
  4. Waypoint markers
  5. Robot
  6. Drawing overlay
  7. Math tools (ruler, protractor)

---

## Future Enhancements (Detected in Code)

### Planned Features
- **Floating Sidebars**: Detachable panels (state exists, not fully implemented)
- **Undo/Redo**: History states exist but not connected to UI
- **Action Blocks**: Legacy system being phased out in favor of nodes
- **Additional Fields**: Support for more FTC seasons
- **Enhanced Sensor Integration**: More sensor types and configurations
- **Trajectory Optimization**: More advanced path planning algorithms
- **Multi-robot Support**: Coordinate multiple robots (infrastructure exists)

### Known Limitations
- **Type Checking**: TypeScript errors ignored during build
- **ESLint**: Not configured by default
- **Test Coverage**: No tests currently implemented
- **Browser Compatibility**: Requires modern browser with Canvas API

---

## Summary Statistics

- **Total Block Types**: 28 unique block types across 4 categories
- **Hardware Ports**: Up to 88 total ports (44 per hub × 2 hubs)
- **Export Formats**: 4 code generation modes
- **Field Seasons**: 3 FTC field images
- **UI Panels**: 7 resizable/collapsible panels
- **Canvas Resolution**: Up to 2048×2048 in fullscreen
- **Path Interpolation**: 100 steps for smooth curves
- **Auto-save Delay**: 2 seconds debounce

---

**Last Updated**: November 20, 2025  
**Component**: `/app/dashboard/[username]/[projecthash]/page.tsx`  
**File Size**: 6,172 lines of TypeScript/React code
