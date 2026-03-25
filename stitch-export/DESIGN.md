# Design System Document: The Neon-Dark AI Lab

## 1. Overview & Creative North Star: "The Synthetic Neuralist"
The Creative North Star for this design system is **"The Synthetic Neuralist."** This aesthetic moves beyond standard "dark mode" into a high-energy, high-contrast environment that feels like a living neural network. We are building a digital laboratory that balances the academic rigor of an educational platform with the electric velocity of cutting-edge AI.

To break the "template" look, we avoid rigid, centered grids. Instead, use **Intentional Asymmetry**: offset your hero elements, allow neon glows to bleed across container boundaries, and use high-contrast typography scales (e.g., pairing a massive `display-lg` headline with a tiny, precise `label-sm` metadata tag) to create an editorial, "heads-up display" (HUD) feel.

---

## 2. Colors & Surface Philosophy
The palette is built on deep void-blacks and charcoal, punctuated by high-frequency neon accents.

### The "No-Line" Rule
Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries between content areas must be defined exclusively through **Background Color Shifts**. 
*   Place a `surface-container-low` component against a `surface` background to define its shape. 
*   Use a `surface-container-highest` section to highlight active workspaces.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, semi-transparent obsidian sheets.
*   **Base:** `surface` (#0e0e0e) or `surface-container-lowest` (#000000).
*   **Layer 1:** Use `surface-container` (#1a1a1a) for primary content cards.
*   **Layer 2 (Floating):** Use `surface-bright` (#2c2c2c) for modals or popovers to create a sense of extreme proximity to the user.

### The "Glass & Glow" Rule
To achieve the futuristic lab feel, use **Glassmorphism** for floating elements.
*   **Token Application:** `surface-container` at 60% opacity with a `20px` backdrop-blur.
*   **Glow Accents:** Use `tertiary` (Cyan) as a subtle, 20% opacity outer glow (`box-shadow`) to signify "Active AI Processing" states.

---

## 3. Typography: Precision & Impact
The system utilizes **Inter** for functional clarity and **Space Grotesk** for high-energy branding.

*   **Display & Headlines (Space Grotesk):** Use `display-lg` and `headline-md` for landing moments and module titles. These should feel "techy" and authoritative.
*   **Body & Labels (Inter):** Use `body-md` for instructional content. The `label-sm` token is vital for "HUD" details (e.g., AI confidence scores, timestamps), providing a sense of technical density.
*   **Tonal Hierarchy:** Headlines should always be `on-surface` (Pure White). Support text uses `on-surface-variant` (Muted Grey) to ensure the eye is drawn to the most critical information first.

---

## 4. Elevation & Depth
Depth is a functional tool, not a decoration.

*   **The Layering Principle:** Avoid shadows for static cards. Instead, nest a `surface-container-lowest` card inside a `surface-container-high` wrapper. This "inverted depth" creates a modern, recessed look.
*   **Ambient Shadows:** For floating AI Tutor panels, use a massive, diffused shadow: `0 20px 50px rgba(142, 255, 113, 0.08)`. Note the use of a tinted shadow (Primary Green) rather than grey to mimic the light emission of neon.
*   **The "Ghost Border":** If accessibility requires a border, use `outline-variant` at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
*   **Primary (Success/Progress):** Background `primary` (#8eff71), Text `on-primary` (#0d6100). No border. On hover, add a `primary` outer glow.
*   **Secondary (AI Tutor):** Background `secondary_container` (#9900ce), Text `on-secondary_container` (#fff5fc). Use for AI-specific triggers.
*   **Tertiary (Ghost):** No background. `primary` text. Use for low-emphasis actions.

### AI Progress Chips
*   **Style:** `surface-container-highest` background with a 1px "Ghost Border" of `primary`.
*   **Animation:** Use a subtle pulse on the `primary` text to indicate "Learning in Progress."

### Input Fields
*   **Base:** `surface-container-low` background. 
*   **Focus State:** Shift background to `surface-container-high` and add a `2px` bottom-only border in `tertiary` (Cyan). Avoid full-box focus rings to maintain the "HUD" aesthetic.

### Cards & Lists
*   **Rule:** **No Divider Lines.** Separate list items using `spacing.4` (1rem) of vertical space or by alternating background tints between `surface-container` and `surface-container-low`.
*   **Asymmetric Cards:** For "Featured Lessons," use a `4px` left-accent border in `secondary` (Neon Purple) to break the symmetry.

### Specialized Component: "The Neural Feed"
A custom list variant for AI interactions. Use `surface-container-lowest` for the user's input and a glassmorphic `surface-container` with a `secondary` (Purple) glow for the AI Tutor’s response.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use `primary_container` gradients (Neon Green to Deep Green) for progress bars to give them "visual soul."
*   **Do** embrace negative space. The dark background is your canvas; let it breathe.
*   **Do** use `secondary_fixed_dim` for "Tutor" icons to ensure high-energy visibility against the dark surfaces.

### Don’t:
*   **Don’t** use pure grey (#888888) for anything. Every neutral should be slightly tinted toward the background charcoal or the accent cyan.
*   **Don’t** use sharp 90-degree corners. Stick to the `md` (0.375rem) or `lg` (0.5rem) roundedness scale to keep the futuristic look "approachable" for education.
*   **Don’t** use high-contrast white borders. They shatter the "frosted glass" immersion. Use background steps instead.