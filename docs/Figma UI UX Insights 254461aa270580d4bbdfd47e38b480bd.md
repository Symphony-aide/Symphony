# Figma UI/UX Insights

[**Figma Tutorial Guide**](Figma%20Tutorial%20Guide%20254461aa270580088250da306958f71b.md)

[Figma Plugins](Figma%20Plugins%20253461aa27058050b415d9d9838c6894.md)

# Notes

## Organization & Structure Issues

**Mistakes:**

- **Poor layer naming**: Generic names like "Frame 57", "Frame 48", "Frame 44" instead of descriptive names
- **Inconsistent naming convention**: Mix of "Frame" numbers and descriptive names like "simple-line-arrow"
- **Cluttered layer panel**: Too many ungrouped frames at the root level

**What should be done instead:**

- Use descriptive, semantic naming (e.g., "Login-Screen", "Dashboard-Header", "Navigation-Menu")
- Establish consistent naming conventions across the project

## Design System & Consistency

**Mistakes:**

- **Inconsistent spacing and layout**: Frames appear randomly placed without grid alignment
- **Mixed design approaches**: Different screen types and styles mixed together without clear hierarchy

## Workflow & File Management

**Mistakes:**

- **Canvas organization**: Frames scattered across the canvas without logical flow
- **No clear user flow**: Screens don't appear to follow a logical sequence
- **Missing documentation**: No apparent annotations or design specifications

---

**Component & Asset Management:**

- **Duplicate elements**: Likely creating similar elements multiple times instead of reusing
- **No shared styles**: Probably hard-coding colors, text styles, and effects instead of using shared styles

## Design Process Issues

**Accessibility & Standards:**

- **Missing design specifications**: No clear measurements, spacing values, or implementation notes
- **No responsive design thinking**: All frames appear to be the same size without device considerations

## Quality Control

**Design Validation:**

- **No design critique process**: Appears to be working in isolation without feedback
- **Missing usability testing setup**: No prototype for user testing
- **No brand consistency checks**: Multiple different styles without brand guideline adherence

## File Structure Problems

**Project Organization:**

- **Single page overload**: Everything crammed into one page instead of logical separation
- **No template usage**: Not leveraging Figma templates or design system starters
- **Missing style guide page**: No dedicated space for colors, typography, spacing rules

---

# Calculations

### Horizontal (width)

- 3 frames per row → `3 × 1440 = 4320`
- 2 gaps between frames → `2 × 200 = 400`
- Left + right padding → `2 × 200 = 400`
    
    ➡️ **Total width = 4320 + 400 + 400 = 5120 px**
    

### Vertical (height)

- 3 frames per column → `3 × 1024 = 3072`
- 2 gaps between frames → `2 × 200 = 400`
- Top + bottom padding → `2 × 200 = 400`
    
    ➡️ **Total height = 3072 + 400 + 400 = 3872 px**
    

📐 **Global frame size = 5120 × 3872 px**

---