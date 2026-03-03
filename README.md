# react-arc-tabs

Production-ready, reusable arc-style tabs for React and Next.js.

This component is based on the shared visual mechanics from the demos in this workspace:

- active tab merges into the panel
- inverse curved bottom corners on the active tab seam
- layered z-index and pseudo-element geometry for seamless arc transitions
- keyboard and ARIA-compliant tab interactions

## Features

- Controlled and uncontrolled usage
- Full keyboard navigation (`ArrowLeft`, `ArrowRight`, `Home`, `End`, `Enter`, `Space`)
- Disabled tabs support
- Manual or automatic activation mode
- Keep mounted or render-only-active panel strategies
- Themeable with CSS variables and props
- Two styling engines:
  - `ArcTabs` (CSS file based)
  - `ArcTabsTailwind` (Tailwind CSS v4+ utility based)
- Built-in tab switch animations adapted from the demos:
  - sliding active backdrop (`rounded-tab` inspired)
  - smooth seam/corner transitions (`inverse rounded corners` inspired)
  - animated panel entry with directional motion
- Works in React and Next.js (`"use client"` included)

## Install (local package / workspace package)

```bash
npm install
npm run build
```

## Usage in React

```tsx
import { ArcTabs, type ArcTabItem } from "react-arc-tabs";
import "react-arc-tabs/styles.css";

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
      size="md"
      fit="content"
      motionPreset="expressive"
      motionDuration={320}
      activationMode="automatic"
      ariaLabel="Project sections"
      accentColor="#5b4ff1"
    />
  );
}
```

## Usage with Tailwind CSS 4+

`ArcTabsTailwind` renders with Tailwind utility classes (including pseudo-element arc geometry), so you don't need to import `styles.css`.

```tsx
import { ArcTabsTailwind, type ArcTabItem } from "react-arc-tabs";

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
      motionDuration={320}
      activationMode="automatic"
      ariaLabel="Project sections"
      accentColor="#4f46e5"
      classNames={{
        root: "max-w-3xl",
        panel: "prose prose-sm max-w-none"
      }}
    />
  );
}
```

### Tailwind v4 source scanning (important)

If Tailwind doesn't generate the component classes from node modules in your setup, add an explicit source path in your global stylesheet:

```css
@import "tailwindcss";

/* npm/yarn/pnpm install use-case */
@source "../node_modules/react-arc-tabs/dist/**/*.{js,cjs}";

/* monorepo/local workspace use-case (adjust path) */
/* @source "../../packages/react-arc-tabs/src/**/*.{ts,tsx}"; */
```

## Usage in Next.js App Router

```tsx
"use client";

import { ArcTabs, type ArcTabItem } from "react-arc-tabs";
import "react-arc-tabs/styles.css";

const tabs: ArcTabItem[] = [
  { id: "summary", label: "Summary", content: <div>Summary panel</div> },
  { id: "billing", label: "Billing", content: <div>Billing panel</div> },
  { id: "usage", label: "Usage", content: <div>Usage panel</div> }
];

export default function Page() {
  return <ArcTabs items={tabs} defaultValue="summary" ariaLabel="Account tabs" />;
}
```

### Next.js + Tailwind variant

```tsx
"use client";

import { ArcTabsTailwind, type ArcTabItem } from "react-arc-tabs";

const tabs: ArcTabItem[] = [
  { id: "summary", label: "Summary", content: <div>Summary panel</div> },
  { id: "billing", label: "Billing", content: <div>Billing panel</div> },
  { id: "usage", label: "Usage", content: <div>Usage panel</div> }
];

export default function Page() {
  return <ArcTabsTailwind items={tabs} defaultValue="summary" ariaLabel="Account tabs" />;
}
```

## Styling model

You can theme via props or by overriding CSS variables on `.arc-tabs`:

- `--arc-radius`
- `--arc-gap`
- `--arc-accent`
- `--arc-tab-bg`
- `--arc-tab-hover-bg`
- `--arc-panel-bg`
- `--arc-panel-border`
- `--arc-panel-padding`

## API

`ArcTabs` props:

- `items: ArcTabItem[]`
- `value?: string`
- `defaultValue?: string`
- `onValueChange?: (value, item, index) => void`
- `activationMode?: "automatic" | "manual"`
- `size?: "sm" | "md" | "lg"`
- `fit?: "content" | "equal"`
- `motionPreset?: "none" | "subtle" | "expressive"`
- `motionDuration?: number`
- `keepMounted?: boolean`
- `radius?: number`
- `gap?: number`
- `panelPadding?: number | string`
- `accentColor?: string`
- `tabBackground?: string`
- `tabHoverBackground?: string`
- `panelBackground?: string`
- `panelBorderColor?: string`
- `renderTabLabel?: (item, state) => ReactNode`
- `renderPanel?: (item, state) => ReactNode`

`ArcTabsTailwind` props:

- all `ArcTabs` props
- `classNames?: ArcTabsTailwindClassNames`

`ArcTabsTailwindClassNames` slots:

- `root`
- `list`
- `indicator`
- `item`
- `tab`
- `tabSelected`
- `tabUnselected`
- `tabDisabled`
- `icon`
- `text`
- `badge`
- `panels`
- `panel`

`ArcTabItem`:

- `id: string`
- `label: ReactNode`
- `content: ReactNode`
- `disabled?: boolean`
- `icon?: ReactNode`
- `badge?: ReactNode`
