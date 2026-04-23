# @entro314labs/react-arc-tabs

Reusable arc-style tabs component for React and Next.js, including a Tailwind CSS v4+ variant.

## Highlights

- Accessible tabs: ARIA roles + keyboard interactions
- Controlled and uncontrolled state models
- CSS-based and Tailwind v4+ variants
- Concentric radius geometry (`inner radius = parent radius - inset`) for strip/tab/panel alignment
- Switch animations (including sliding active backdrop and animated panel entry)
- TypeScript-first API

## Compatibility

- React `18.2+` and `19+`
- Next.js (App Router and Pages Router)
- Tailwind CSS `4+` for `ArcTabsTailwind`

## Install

```bash
npm install @entro314labs/react-arc-tabs
```

## Basic usage (CSS variant)

```tsx
import { ArcTabs, type ArcTabItem } from "@entro314labs/react-arc-tabs";
import "@entro314labs/react-arc-tabs/styles.css";

const items: ArcTabItem[] = [
  { id: "overview", label: "Overview", content: <div>Overview content</div> },
  { id: "activity", label: "Activity", content: <div>Activity feed</div>, badge: 8 },
  { id: "settings", label: "Settings", content: <div>Settings panel</div> }
];

export function Example() {
  return (
    <ArcTabs
      items={items}
      defaultValue="overview"
      motionPreset="expressive"
      motionDuration={320}
      radius={16}
      stripPadding={4}
      notch={6}
      seamGap={0}
      ariaLabel="Project sections"
    />
  );
}
```

## Tailwind CSS v4+ usage

`ArcTabsTailwind` ships with utility-class styling, so you do not import `styles.css`.

```tsx
import { ArcTabsTailwind, type ArcTabItem } from "@entro314labs/react-arc-tabs";

const items: ArcTabItem[] = [
  { id: "overview", label: "Overview", content: <div>Overview content</div> },
  { id: "activity", label: "Activity", content: <div>Activity feed</div>, badge: 8 },
  { id: "settings", label: "Settings", content: <div>Settings panel</div> }
];

export function ExampleTailwind() {
  return (
    <ArcTabsTailwind
      items={items}
      defaultValue="overview"
      fit="equal"
      motionPreset="expressive"
      classNames={{
        root: "max-w-3xl",
        panel: "prose prose-sm max-w-none"
      }}
    />
  );
}
```

### Tailwind source scanning

If your setup does not automatically scan classes from installed dependencies, add:

```css
@import "tailwindcss";
@source "../node_modules/@entro314labs/react-arc-tabs/dist/**/*.{js,cjs}";
```

## Next.js usage

```tsx
"use client";

import { ArcTabs, type ArcTabItem } from "@entro314labs/react-arc-tabs";
import "@entro314labs/react-arc-tabs/styles.css";

const tabs: ArcTabItem[] = [
  { id: "summary", label: "Summary", content: <div>Summary panel</div> },
  { id: "billing", label: "Billing", content: <div>Billing panel</div> },
  { id: "usage", label: "Usage", content: <div>Usage panel</div> }
];

export default function Page() {
  return <ArcTabs items={tabs} defaultValue="summary" ariaLabel="Account tabs" />;
}
```

## Motion presets

- `none`: no animation
- `subtle`: minimal transitions (default)
- `expressive`: sliding active backdrop + stronger panel motion

```tsx
<ArcTabs motionPreset="expressive" motionDuration={320} />
```

## Main API

### `ArcTabs` / `ArcTabsTailwind`

- `items: ArcTabItem[]`
- `value?: string`
- `defaultValue?: string`
- `onValueChange?: (value, item, index) => void`
- `activationMode?: "automatic" | "manual"`
- `size?: "sm" | "md" | "lg"`
- `fit?: "content" | "equal"`
- `motionPreset?: "none" | "subtle" | "expressive"`
- `motionDuration?: number`
- `radius?: number` (outer shell radius)
- `stripPadding?: number | string` (inset from shell to tabs; drives concentric tab/panel geometry)
- `tabRadius?: number | string` (optional explicit tab radius override)
- `seamGap?: number | string` (vertical distance between active tab and panel; default `0` for a fused shape)
- `notch?: number | string` (controls inverted corner curve size)
- `cutoutColor?: string` (color of the concave seam cutouts; defaults to strip background)
- `keepMounted?: boolean`
- `ariaLabel?: string`

By default, the component derives radii from concentric rules:

- `tabRadius = radius - stripPadding`
- `panelCornerRadius = radius - (2 × stripPadding)`
- `defaultNotch = clamp(6px, tabRadius × 0.5, 12px)`

Reference profile used for the attached design:

- `radius = 16`
- `stripPadding = 4`
- `tabRadius = 12`
- `panelCornerRadius = 8`
- `notch = 6`
- `seamGap = 0`

Additional styling/theming props are available for both variants.

### Tailwind slot overrides

`ArcTabsTailwind` supports `classNames` slots:

- `root`, `list`, `indicator`, `item`, `tab`
- `tabSelected`, `tabUnselected`, `tabDisabled`
- `icon`, `text`, `badge`, `panels`, `panel`

### `ArcTabItem`

- `id: string`
- `label: ReactNode`
- `content: ReactNode`
- `disabled?: boolean`
- `icon?: ReactNode`
- `badge?: ReactNode`

## Development

```bash
pnpm install
pnpm run typecheck
pnpm run build
```

## License

MIT
