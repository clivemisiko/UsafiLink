# UsafiLink Theme Application Guide

## Color Mapping Summary

All pages in the system should use the following theme colors:

### Primary Colors
- **ink** (#1a1a18) - Replace: gray-900, slate-900, text-gray-900
- **parchment** (#f5f0e8) - Background for main areas
- **cream** (#faf7f2) - Replace: gray-50, light backgrounds
- **white** (#ffffff) - Cards and components

### Accent Colors
- **sage** (#4a7c59) - Replace: emerald-600, teal-600, green colors
- **sage-light** (#6a9e79) - Lighter sage, hovers
- **sage-muted** (#d4e6da) - Replace: emerald-50, teal-50, light sage backgrounds
- **sand** (#e8d5b0) - Warning/secondary
- **rust** (#c4622d) - Error/danger
- **stone** (#8a8475) - Replace: gray-500, gray-600, gray-400, text-secondary

### Utilities
- **border-light** - rgba(26,26,24,0.08) - Replace: gray-100, slate-100, border-slate-100
- **border-lighter** - rgba(26,26,24,0.05) - Replace: gray-50, slate-50, border-gray-50

## Files Updated
✅ index.css - Global theme CSS and utilities
✅ tailwind.config.js - Tailwind color mappings
✅ utils/theme.js - JavaScript theme constants
✅ utils/colorMapping.js - Color migration reference
✅ App.jsx - Global app background
✅ pages/admin/AddUser.jsx - Admin user creation/edit

## Files Needing Updates
- All pages in frontend/src/pages/admin/
- All pages in frontend/src/pages/ (driver, customer pages)
- All components in frontend/src/components/
- Layouts in frontend/src/layouts/

## Quick Replacement Reference

### Text Colors
- text-gray-900 → text-ink
- text-gray-700 → text-ink
- text-gray-600 → text-stone
- text-gray-500 → text-stone
- text-gray-400 → text-stone
- text-slate-900 → text-ink
- text-emerald-600 → text-sage
- text-teal-600 → text-sage

### Background Colors
- bg-gray-50 → bg-cream
- bg-gray-100 → bg-sage-muted
- bg-slate-50 → bg-cream
- bg-slate-100 → bg-border-light
- bg-emerald-50 → bg-sage-muted
- bg-emerald-600 → bg-sage
- bg-teal-50 → bg-sage-muted
- bg-teal-600 → bg-sage
- bg-slate-900 → bg-ink

### Border Colors
- border-gray-50 → border-border-lighter
- border-gray-100 → border-border-light
- border-slate-100 → border-border-light
- border-emerald-300 → border-sage-muted
- border-emerald-600 → border-sage

### Focus/Ring Colors
- focus:ring-emerald-500 → focus:ring-sage
- focus:ring-emerald-300 → focus:ring-sage-muted
- peer-focus:ring-emerald-300 → peer-focus:ring-sage-muted

## Apply to All Pages Strategy

1. Use Tailwind CSS to replace color classes globally
2. Update component libraries and shared components first
3. Then update page-level components
4. Test thoroughly in each role (admin, driver, customer)
