# Functional Specification — Newton’s Third Law Lab (IDT Simulation)

## 1. Purpose & Context
This simulation is a textbook‑aligned learning aid for Newton’s Third Law. It is intended to appear alongside the textbook’s Example 1 and Example 2 on page 3, as an integrated, non‑standalone resource inside the IDT.

Primary goals:
- Reinforce the action–reaction principle with clear, visual force pairs.
- Provide a clean “diagram” view matching the textbook and an “explore” view for interactive discovery.
- Maintain a polished, IDT‑ready presentation.

## 2. Learning Objectives
Learners should be able to:
- Identify action–reaction force pairs in contact and non‑contact interactions.
- State that force pairs are equal in magnitude, opposite in direction, and act on different objects.
- Apply the concept to both the hammer–nail system and the Earth–Moon system.

## 3. Scope
Only the following textbook examples are implemented:
- Example 1: Contact force between a hammer and a nail.
- Example 2: Non‑contact force between the Earth and the Moon.

## 4. Modes
### 4.1 Diagram Mode
Static, textbook‑style snapshot intended for instruction.
- No animation.
- Minimal UI.
- Force arrows and labels are the primary visual elements.
- Text mirrors textbook wording.

### 4.2 Explore Mode
Interactive mode intended for experimentation.
- Sliders adjust key variables.
- Animation and motion illustrate interaction timing.
- Force cards show numeric equality during interaction.

## 5. UI Structure
### 5.1 Global Layout
- Header with title and example tabs.
- Mode toggle (Diagram ↔ Explore).
- Right‑bottom floating info panel (key concept).

### 5.2 Example 1 Layout (Hammer & Nail)
Left panel:
- Example title and textbook bullet text.
- Explore mode controls:
  - Hammer Mass (1–10 kg)
  - Swing Speed (1–10 m/s)
  - Strike button
  - Reset button
- Key statement box (equal magnitude, opposite direction, different objects).

Main canvas:
- Hammer and nail illustration.
- Action–reaction arrows (F_H and F_N).
- Explore mode only: force cards with numeric equality.

### 5.3 Example 2 Layout (Earth & Moon)
Left panel:
- Example title and textbook bullet text.
- Explore mode controls:
  - Earth Mass (1–10 Mₑ)
  - Moon Mass (1–10 Mₘ)
  - Distance (120–350 px)
  - Pause/Resume
  - Reset button
- Key statement box (equal magnitude, opposite direction, different objects).

Main canvas:
- Earth and Moon illustration.
- Action–reaction arrows (F_E and F_M).
- Explore mode only: force cards with numeric equality.

## 6. Simulation Behavior
### 6.1 Example 1 (Contact Force)
Variables:
- Hammer mass (m)
- Swing speed (v)

Behavior:
- Strike triggers a downward hammer motion.
- At contact: show force arrows and equal force values.
- Nail head moves slightly into ground proportional to force.

Force visualization:
- F_H (hammer on nail) and F_N (nail on hammer).
- Equal length in arrows during contact.

### 6.2 Example 2 (Non‑contact Force)
Variables:
- Earth mass (m1)
- Moon mass (m2)
- Distance (r)

Behavior:
- Explore mode: Moon orbits Earth.
- Diagram mode: Earth and Moon fixed on a horizontal line.
- Force arrows always same length in opposite directions.

Force visualization:
- F_E (Earth on Moon) and F_M (Moon on Earth).
- Equal magnitude by construction.

## 7. Key Educational Text (Aligned to Textbook)
Example 1:
- “the hammer exerts a force F_H on the nail”
- “the nail exerts a force F_N on the hammer”
- “The forces F_H and F_N are equal in magnitude, acting in opposite directions, and not acting on the same object.”

Example 2:
- “the Earth pulls on the moon with a force F_E”
- “the Moon pulls on the Earth with a force F_M”
- “The forces F_E and F_M are equal in magnitude, acting in opposite directions, and not acting on the same object.”

## 8. Technical Constraints
- Must use React + existing package.json stack.
- MUI is required as the base UI framework.
- Avoid modifying `tsconfig.json`, `tsconfig.eslint.json`, `rsbuild.config.ts`, `.npmrc`, and `lib/` unless necessary.
- Rendering uses HTML5 Canvas.

## 9. Build & Run
- Install: `npm i --legacy-peer-deps`
- Dev: `npm start`
- Build: `npm run build`

## 10. QA Checklist
- Diagram mode shows static snapshot with correct labels.
- Explore mode allows variable changes without layout shift.
- Force arrows remain equal length for action/reaction pairs.
- Tab switch resets canvas state cleanly.
- No scrolling or layout drift within embedded IDT container.

