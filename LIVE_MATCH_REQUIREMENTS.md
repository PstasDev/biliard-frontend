# Live Match Page Requirements
## Page: `biro/live/[matchId]`

---

## Purpose
Real-time match control interface for referees (bírók) to manage live billiard matches, track balls, record events, and control game flow.

---

## Core Functionality

### Match State Management
- **WebSocket Connection**: Real-time bi-directional communication for match updates
- **Match Loading**: Fetch current match data including players, frames, and events
- **Frame Lifecycle**: Start new frames, track ongoing frames, end frames with winner selection
- **Player Switching**: Dynamic player turn management with visual indicators
- **State Persistence**: All actions immediately synced via WebSocket and API

### Event Recording
1. **Balls Potted**: Select and record multiple balls potted in a single shot
2. **Cue Ball Events**:
   - Cue ball left table (foul)
   - Cue ball positioned by hand
3. **Fouls**: Record rule violations
4. **Player Switching**: Manual override to change active player
5. **Ball Groups**: Assign full/striped ball groups to players

### Event Management
- **Undo Last Event**: Remove most recent action
- **Remove Specific Event**: Delete individual event from history
- **Clear All Frame Events**: Bulk deletion with confirmation dialog
- **Real-time Updates**: Events immediately reflected across all connected clients

---

## UI Layout Requirements

### Layout Structure
```
┌─────────────────────────────────────────┐
│         HEADER (Fixed)                  │
│  ← Timer | Match Info | WebSocket ●     │
│  Player 1 Score | Match Info | Player 2 │
├─────────────────────────────────────────┤
│                                         │
│       SCROLLABLE CONTENT AREA           │
│                                         │
│  • Ball Tracker (grid of available     │
│    and potted balls)                    │
│                                         │
│  • Score Controls (action buttons)      │
│                                         │
│  • Ball Group Assignment (if needed)    │
│                                         │
│  • Action Log (recent events)           │
│                                         │
│  • Clear Events Dialog                  │
│                                         │
└─────────────────────────────────────────┘
```

### NO FOOTER
- Footer must be removed from this page
- Full viewport height usage with no bottom navigation
- Clean, distraction-free interface focused on match control

---

## Visual Design Requirements

### Color Scheme & Contrast

#### Player Identification
- **Player 1**: Blue theme (`bg-blue-600`, `border-blue-600`, `text-blue-600`)
- **Player 2**: Red theme (`bg-red-600`, `border-red-600`, `text-red-600`)
- **Active Player Indicator**: 
  - Bright border (2px solid)
  - Ring glow effect (`ring-2 ring-{color}-600/50`)
  - Scale transformation (105%)
  - Down arrow visual cue (▼)

#### Action Feedback
- **Success**: Emerald green (`bg-emerald-500`, `text-emerald-700`)
- **Warning**: Amber (`bg-amber-500/10`, `border-amber-500`)
- **Destructive/Foul**: Red (`bg-red-500`, `variant="destructive"`)
- **Neutral Actions**: Blue (`hover:bg-blue-500/20`)

#### Ball Selection
- **Selected Ball**: Emerald ring (`ring-4 ring-emerald-500`), scale 110%
- **Potted Ball**: 30% opacity, grayscale, red X overlay
- **Available Ball**: Full color, hover scale 110%

#### WebSocket Status
- **Connected**: Pulsing emerald dot (`bg-emerald-500 animate-pulse`)
- **Disconnected**: Static red dot (`bg-red-500`)

### Contrast Requirements
- **Text on Dark**: Minimum 4.5:1 contrast ratio
- **Text on Light**: Minimum 4.5:1 contrast ratio
- **Interactive Elements**: Clear hover states with 20% opacity overlays
- **Active States**: Bold borders, ring effects, and scale transforms
- **Disabled States**: Reduced opacity (50%), muted colors

### Typography
- **Player Scores**: `text-4xl font-bold` in player colors
- **Timer**: `text-2xl font-mono font-bold tabular-nums`
- **Player Names**: `text-xs text-muted-foreground truncate`
- **Action Buttons**: `font-bold text-base` for primary actions
- **Section Headers**: `text-xs font-semibold text-muted-foreground uppercase`

---

## Component Breakdown

### BallsTracker
- Grid layout (5 columns) for 15 numbered balls
- Touch-friendly buttons (min 48x48px)
- Visual selection feedback
- Separate section for potted balls with grayscale + X overlay
- Selection counter badge

### ScoreControls
- Large touch targets (h-12 to h-14)
- "Balls Potted" button shows count
- Cue ball control panel with visual ball icon
- Foul and switch player buttons
- End frame buttons for each player

### ActionLog
- Compact event list (last 4-5 items)
- Event icons for quick recognition
- Player name abbreviation (last name only)
- Undo last event button
- Individual event removal option

### Timer
- Persistent running timer during frame
- Play/pause toggle
- Reset functionality
- Monospace font for readability
- Visual pulse when running

### ClearEventsDialog
- Confirmation dialog for bulk deletion
- Shows count of events to be deleted
- Destructive action styling

---

## Responsive Behavior

### Mobile-First Design
- Touch-friendly button sizes (minimum 48px height)
- `touch-manipulation` CSS for better touch response
- Grid layouts that stack appropriately
- Scrollable content area for long event lists

### Desktop Enhancements
- Hover states on all interactive elements
- Larger spacing where appropriate
- Potential side-by-side layouts for wider screens

---

## State Management

### Local State
- `match`: Current match data
- `currentFrame`: Active frame object
- `selectedBalls`: Array of ball IDs selected for potting
- `currentPlayer`: Active player ID
- `successMessage`: Toast notification content
- `error`: Error message display
- `wsConnected`: WebSocket connection status
- `loading`: Initial data loading state

### WebSocket Actions
- `start_frame`: Initiate new frame
- `end_frame`: Complete frame with winner
- `remove_event`: Delete specific event
- `undo_last_event`: Remove most recent event
- `clear_frame_events`: Delete all events in frame
- `set_ball_groups`: Assign ball groups to players

### WebSocket Events
- `event_removed`: Confirmation of single event deletion
- `events_removed`: Confirmation of multiple event deletion
- `frame_events_cleared`: Confirmation of bulk deletion
- `error`: Error notification from server

---

## Accessibility

### Touch/Click Targets
- Minimum 48x48px for all interactive elements
- Clear focus states for keyboard navigation
- Disabled state clearly indicated

### Visual Feedback
- Loading spinners during async operations
- Success toast messages (2-second duration)
- Error messages with retry options
- Real-time connection status indicator

### Screen Readers
- Semantic HTML structure
- ARIA labels where appropriate
- Meaningful button text (avoid icon-only)

---

## Performance Considerations

### WebSocket Management
- Automatic reconnection on disconnect (3-second delay)
- Clean disconnect on component unmount
- Proper cleanup of timeout refs
- Connection status monitoring

### Optimistic Updates
- Immediate UI feedback before server confirmation
- Success messages on successful operations
- Automatic data refresh on WebSocket messages

### Debouncing/Throttling
- Ball selection is instant (no debounce needed)
- WebSocket messages sent immediately
- Timer updates every 1 second

---

## Security & Validation

### Authentication
- Bíró role required (`useAuth` hook)
- Redirect non-bíró users to home
- JWT token included in WebSocket connection

### Input Validation
- Frame number sequential validation
- Winner ID must be valid player
- Event type enum validation on backend
- Ball ID validation against valid ball set

### Error Handling
- Network error recovery
- WebSocket reconnection logic
- User-friendly error messages
- Fallback UI states

---

## Current Issues to Address

### Layout Problems
1. **Footer Presence**: Footer should not appear on this page
2. **Layout Nesting**: Remove custom layout file that doesn't add value
3. **Contrast Issues**: Some text may be hard to read on certain backgrounds
4. **Spacing**: Inconsistent padding/margins in some areas

### Recommended Improvements
1. **Remove** `app/biro/live/[matchId]/layout.tsx` (unnecessary wrapper)
2. **Enhance** color contrast for better readability
3. **Standardize** spacing using consistent design tokens
4. **Simplify** component hierarchy
5. **Add** dark mode considerations for all color schemes
6. **Ensure** no footer renders on this page

---

## Design Principles

### Clarity
- Single active player clearly indicated
- Current frame number always visible
- Match score prominent
- Event history concise

### Efficiency
- Quick ball selection with single tap
- Common actions require minimal steps
- Undo always available
- Bulk operations for repetitive tasks

### Reliability
- Real-time sync via WebSocket
- Optimistic UI updates
- Automatic reconnection
- Clear error states

### Simplicity
- No unnecessary chrome or decoration
- Focus on essential match control
- Minimal cognitive load
- Touch-optimized interface
