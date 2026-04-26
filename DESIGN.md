---
name: Smart Workforce Platform
description: Futuristic workforce management and automation for student employment.
colors:
  primary: "#06b6d4"
  neutral-bg: "#020617"
  surface: "rgba(15, 23, 42, 0.7)"
  text: "#f8fafc"
typography:
  display:
    fontFamily: "Outfit, Inter, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.1
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  md: "12px"
  xl: "20px"
  "2xl": "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
---

# Design System: Smart Workforce Platform (Futuristic Redesign)

## 1. Overview

**Creative North Star: "The Holographic Command Center"**

Smart Workforce Platform is evolved into a high-end, futuristic management tool. The aesthetic is "Technological Excellence"—it uses a deep space-tinted dark mode with vibrant cyan/purple gradients, glassmorphism, and subtle glowing effects to create a premium 2026 SaaS feel.

**Key Characteristics:**
- **Vibrant Gradients**: Balanced use of blue, cyan, and purple across primary actions and backgrounds.
- **Glassmorphism**: Translucent surfaces with `backdrop-blur` for depth and modern feel.
- **Subtle Glows**: Strategic use of outer glows and neon accents to highlight key data and actions.
- **Smooth Motion**: Fluid transitions and micro-animations that make the UI feel alive.
- **Modern Typography**: High-contrast, wide-tracking headlines using Outfit or Inter.

## 2. Colors

The palette is centered on deep space neutrals with neon-tinted accents.

### Primary Gradient
- **Fusion Gradient**: `linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%)`
- **Cyan Glow**: `#06b6d4` / `oklch(0.7 0.15 220)`
- **Royal Blue**: `#3b82f6` / `oklch(0.6 0.18 250)`
- **Vivid Purple**: `#8b5cf6` / `oklch(0.6 0.18 290)`

### Neutral
- **Deep Space**: `#020617` / `oklch(0.13 0.015 260)` (Primary Background)
- **Glass Surface**: `rgba(15, 23, 42, 0.7)` with `backdrop-blur: 24px` (Panels/Cards)
- **Star Light**: `#f8fafc` / `oklch(0.96 0.01 260)` (Primary Text)

## 3. Typography

**Display Font:** Outfit (or Inter as fallback)
**Body Font:** Inter

### Hierarchy
- **Display** (800, 3rem, 1.1): Futuristic hero headlines.
- **Headline** (700, 2rem, 1.2): Section titles.
- **Title** (600, 1.25rem, 1.4): Card headings.
- **Body** (400, 15px, 1.6): Standard text.
- **Label** (700, 10px, 0.1em, uppercase): Tracking-heavy labels.

## 4. Components

### Glass Cards
- **Background**: `rgba(255, 255, 255, 0.03)`
- **Border**: `1px solid rgba(255, 255, 255, 0.08)`
- **Blur**: `backdrop-filter: blur(20px)`
- **Shadow**: `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5)`

### Premium Buttons
- **Shape**: Rounded 2XL (24px)
- **Style**: Fusion Gradient background with white text.
- **Effect**: Subtle outer glow on hover, slight scale-up.

### Inputs
- **Style**: Semi-transparent dark background, thin border.
- **Focus**: Cyan border with subtle glow and background shift.

## 5. Do's and Don'ts

### Do:
- **Do** use harmonious gradients for primary calls to action.
- **Do** utilize `backdrop-blur` to create depth between overlapping layers.
- **Do** ensure high contrast (4.5:1+) for all functional text on gradients.
- **Do** add subtle entrance animations (fade-in + slight slide-up).

### Don't:
- **Don't** use solid black (#000) or pure white (#FFF).
- **Don't** over-use glows; keep them subtle and functional.
- **Don't** use sharp corners; stick to the rounded 2XL/XL system.
- **Don't** clutter the view; use spacing to let the futuristic aesthetic breathe.
