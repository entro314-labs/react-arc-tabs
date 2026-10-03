'use client'

import * as React from 'react'

import { ARC_SPRING_EASING } from './ArcTabs'
import type { ArcTabItem, ArcTabsProps, ArcTabsRenderState, ArcTabsSize } from './ArcTabs'

type CSSVarStyle = React.CSSProperties & Record<`--${string}`, string | number>

export interface ArcTabsTailwindClassNames {
  root?: string
  list?: string
  indicator?: string
  item?: string
  tab?: string
  tabSelected?: string
  tabUnselected?: string
  tabDisabled?: string
  icon?: string
  text?: string
  badge?: string
  panels?: string
  panel?: string
}

export interface ArcTabsTailwindProps extends ArcTabsProps {
  classNames?: ArcTabsTailwindClassNames
}

const joinClassNames = (...parts: Array<string | undefined | false | null>) =>
  parts.filter(Boolean).join(' ')

const toCssSize = (value: number | string | undefined) =>
  typeof value === 'number' ? `${value}px` : value

const findFirstEnabledIndex = (items: ArcTabItem[]) => items.findIndex((item) => !item.disabled)

const getEnabledIndices = (items: ArcTabItem[]) =>
  items.reduce<number[]>((acc, item, index) => {
    if (!item.disabled) acc.push(index)
    return acc
  }, [])

const getNextEnabledIndex = (enabledIndices: number[], currentIndex: number, direction: 1 | -1) => {
  if (!enabledIndices.length) return -1

  const currentPosition = enabledIndices.indexOf(currentIndex)
  if (currentPosition === -1) {
    return direction === 1 ? (enabledIndices[0] ?? -1) : (enabledIndices.at(-1) ?? -1)
  }

  const nextPosition = (currentPosition + direction + enabledIndices.length) % enabledIndices.length
  return enabledIndices[nextPosition] ?? -1
}

const sizeClassMap: Record<ArcTabsSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-sm',
  md: 'min-h-10 px-4 py-2 text-[0.95rem]',
  lg: 'min-h-12 px-5 py-2.5 text-base',
}

export function ArcTabsTailwind({
  items,
  value,
  defaultValue,
  onValueChange,
  activationMode = 'automatic',
  keepMounted = true,
  size = 'md',
  fit = 'content',
  appearance = 'filled',
  motionPreset = 'subtle',
  motionDuration = 260,
  ariaLabel = 'Tabs',
  listId,
  tabsClassName,
  panelClassName,
  radius,
  stripPadding,
  tabRadius,
  gap,
  seamGap,
  notch,
  panelPadding,
  accentColor,
  tabBackground,
  tabHoverBackground,
  panelBackground,
  panelBorderColor,
  cutoutColor,
  emptyState = null,
  renderTabLabel,
  renderPanel,
  tabElement = 'button',
  className,
  style,
  classNames,
  ...rest
}: ArcTabsTailwindProps): React.JSX.Element {
  const reactId = React.useId()
  const baseId = React.useMemo(
    () => (listId ?? `arc-tabs-${reactId}`).replace(/:/g, ''),
    [listId, reactId],
  )

  const isControlled = value !== undefined

  const firstEnabledIndex = React.useMemo(() => findFirstEnabledIndex(items), [items])

  const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(() => {
    const requested = defaultValue
    const requestedMatch = items.find((item) => !item.disabled && item.id === requested)
    if (requestedMatch) return requestedMatch.id
    return firstEnabledIndex >= 0 ? items[firstEnabledIndex]?.id : undefined
  })

  const rawValue = isControlled ? value : uncontrolledValue

  const strictSelectedIndex = React.useMemo(
    () => items.findIndex((item) => !item.disabled && item.id === rawValue),
    [items, rawValue],
  )

  // Controlled: `value` is the whole truth, so one that names no enabled tab selects nothing.
  // Uncontrolled: there is no owner to ask, so an unusable value falls back to the first enabled
  // tab and the effect below stores that id.
  const selectedIndex =
    strictSelectedIndex >= 0 ? strictSelectedIndex : isControlled ? -1 : firstEnabledIndex

  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : undefined

  React.useEffect(() => {
    if (isControlled) return
    if (strictSelectedIndex !== -1) return

    if (firstEnabledIndex !== -1) {
      const fallbackId = items[firstEnabledIndex]?.id
      setUncontrolledValue(fallbackId)
    } else {
      setUncontrolledValue(undefined)
    }
  }, [isControlled, strictSelectedIndex, firstEnabledIndex, items])

  const [focusedIndex, setFocusedIndex] = React.useState<number>(selectedIndex)

  React.useEffect(() => {
    // A focused tab that still exists keeps the roving index, selection or no selection - with
    // nothing selected the arrow keys must still be able to walk the strip. Only a stale index is
    // handed back to the selection (which may itself be -1).
    const focusedIsUsable =
      focusedIndex >= 0 && focusedIndex < items.length && !items[focusedIndex]?.disabled
    if (!focusedIsUsable && focusedIndex !== selectedIndex) {
      setFocusedIndex(selectedIndex)
    }
  }, [focusedIndex, selectedIndex, items])

  const enabledIndices = React.useMemo(() => getEnabledIndices(items), [items])

  const tabRefs = React.useRef<Array<HTMLButtonElement | HTMLDivElement | null>>([])
  const listScrollRef = React.useRef<HTMLDivElement | null>(null)
  const listRef = React.useRef<HTMLUListElement | null>(null)
  const activePanelRef = React.useRef<HTMLElement | null>(null)
  const hasMountedRef = React.useRef(false)
  const previousSelectedIndexRef = React.useRef(selectedIndex)

  const [hasInteracted, setHasInteracted] = React.useState(false)
  const [indicator, setIndicator] = React.useState({
    x: 0,
    width: 0,
    ready: false,
  })

  const effectiveMotionDuration = motionPreset === 'none' ? 0 : Math.max(0, motionDuration)
  const showSlidingIndicator = motionPreset === 'expressive' && selectedIndex >= 0

  React.useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, items.length)
  }, [items.length])

  React.useEffect(() => {
    const previous = previousSelectedIndexRef.current

    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      previousSelectedIndexRef.current = selectedIndex
      return
    }

    if (previous !== selectedIndex) {
      setHasInteracted(true)
    }

    previousSelectedIndexRef.current = selectedIndex
  }, [selectedIndex])

  const focusTabIndex = React.useCallback((index: number) => {
    if (index < 0) return
    setFocusedIndex(index)
    tabRefs.current[index]?.focus()
  }, [])

  const selectTab = React.useCallback(
    (index: number) => {
      const item = items[index]
      if (!item || item.disabled) return
      if (index === selectedIndex) {
        setFocusedIndex(index)
        return
      }

      setHasInteracted(true)

      if (!isControlled) {
        setUncontrolledValue(item.id)
      }

      setFocusedIndex(index)
      onValueChange?.(item.id, item, index)
    },
    [items, selectedIndex, isControlled, onValueChange],
  )

  const syncIndicator = React.useCallback(() => {
    if (!showSlidingIndicator) {
      setIndicator((previous) =>
        previous.ready || previous.width !== 0 || previous.x !== 0
          ? { x: 0, width: 0, ready: false }
          : previous,
      )
      return
    }

    const selectedTab = selectedIndex >= 0 ? (tabRefs.current[selectedIndex] ?? null) : null
    const listElement = listRef.current

    if (!listElement || !selectedTab) return

    const nextX = selectedTab.offsetLeft
    const nextWidth = selectedTab.offsetWidth

    setIndicator((previous) => {
      const changedX = Math.abs(previous.x - nextX) > 0.5
      const changedWidth = Math.abs(previous.width - nextWidth) > 0.5
      if (!changedX && !changedWidth && previous.ready) {
        return previous
      }

      return {
        x: nextX,
        width: nextWidth,
        ready: true,
      }
    })
  }, [selectedIndex, showSlidingIndicator])

  React.useEffect(() => {
    syncIndicator()
  }, [syncIndicator, items.length, size, fit])

  React.useEffect(() => {
    if (!showSlidingIndicator) return

    const listElement = listRef.current
    const listScrollElement = listScrollRef.current
    if (!listElement) return

    const onResize = () => {
      syncIndicator()
    }

    const frame = requestAnimationFrame(syncIndicator)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        syncIndicator()
      })
      observer.observe(listElement)
      if (listScrollElement) {
        observer.observe(listScrollElement)
      }
      tabRefs.current.forEach((tabNode) => {
        if (tabNode) observer?.observe(tabNode)
      })
    }

    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      observer?.disconnect()
    }
  }, [showSlidingIndicator, syncIndicator, items.length])

  React.useEffect(() => {
    if (!hasInteracted || motionPreset === 'none' || effectiveMotionDuration <= 0) {
      return
    }

    const panelElement = activePanelRef.current
    if (!panelElement || typeof panelElement.animate !== 'function') {
      return
    }

    if (
      globalThis.window !== undefined &&
      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    // Expressive matches the source component: the new panel rises from below
    // and fades in, settling with the spring easing (no horizontal/scale/blur).
    // Subtle keeps the understated lift + blur on a plain ease-out.
    const keyframes: Keyframe[] =
      motionPreset === 'expressive'
        ? [
            { opacity: 0, transform: 'translate3d(0, 20px, 0)' },
            { opacity: 1, transform: 'translate3d(0, 0, 0)' },
          ]
        : [
            {
              opacity: 0,
              transform: 'translate3d(0, 6px, 0) scale(0.995)',
              filter: 'blur(1px)',
            },
            {
              opacity: 1,
              transform: 'translate3d(0, 0, 0) scale(1)',
              filter: 'blur(0px)',
            },
          ]

    const animation = panelElement.animate(keyframes, {
      duration: effectiveMotionDuration,
      easing: motionPreset === 'expressive' ? ARC_SPRING_EASING : 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'both',
    })

    return () => {
      animation.cancel()
    }
  }, [selectedIndex, hasInteracted, motionPreset, effectiveMotionDuration])

  const handleTabKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLElement>, index: number) => {
      if (!enabledIndices.length) return

      switch (event.key) {
        case 'ArrowRight': {
          event.preventDefault()
          const next = getNextEnabledIndex(enabledIndices, index, 1)
          if (next !== -1) {
            focusTabIndex(next)
            if (activationMode === 'automatic') selectTab(next)
          }
          break
        }
        case 'ArrowLeft': {
          event.preventDefault()
          const previous = getNextEnabledIndex(enabledIndices, index, -1)
          if (previous !== -1) {
            focusTabIndex(previous)
            if (activationMode === 'automatic') selectTab(previous)
          }
          break
        }
        case 'Home': {
          event.preventDefault()
          const first = enabledIndices[0]
          if (first !== undefined) {
            focusTabIndex(first)
            if (activationMode === 'automatic') selectTab(first)
          }
          break
        }
        case 'End': {
          event.preventDefault()
          const last = enabledIndices.at(-1)
          if (last !== undefined) {
            focusTabIndex(last)
            if (activationMode === 'automatic') selectTab(last)
          }
          break
        }
        case 'Enter':
        case ' ':
        case 'Spacebar': {
          // A native <button> synthesizes click on Enter/Space, so automatic mode needs no help —
          // but a <div role="tab"> does not, so the div trigger activates here in every mode.
          if (activationMode === 'manual' || tabElement === 'div') {
            event.preventDefault()
            selectTab(index)
          }
          break
        }
        default:
          break
      }
    },
    [activationMode, enabledIndices, focusTabIndex, selectTab, tabElement],
  )

  // Only sets a CSS var inline when the consumer passed a matching prop.
  // Defaults are declared via the Tailwind arbitrary-value utilities on the root
  // element (e.g. `[--arc-radius:16px]`), so re-asserting them inline was
  // redundant and blocked class-level overrides.
  const themedStyle = React.useMemo<React.CSSProperties>(() => {
    const cssVars: CSSVarStyle = { ...style }

    if (radius !== undefined) cssVars['--arc-radius'] = `${radius}px`
    const stripPaddingValue = toCssSize(stripPadding)
    if (stripPaddingValue !== undefined) cssVars['--arc-strip-padding'] = stripPaddingValue
    const tabRadiusValue = toCssSize(tabRadius)
    if (tabRadiusValue !== undefined) cssVars['--arc-tab-radius'] = tabRadiusValue
    if (gap !== undefined) cssVars['--arc-gap'] = `${gap}px`
    const seamGapValue = toCssSize(seamGap)
    if (seamGapValue !== undefined) cssVars['--arc-seam-gap'] = seamGapValue
    const notchValue = toCssSize(notch)
    if (notchValue !== undefined) cssVars['--arc-notch'] = notchValue
    const panelPaddingValue = toCssSize(panelPadding)
    if (panelPaddingValue !== undefined) cssVars['--arc-panel-padding'] = panelPaddingValue
    if (accentColor) cssVars['--arc-accent'] = accentColor
    if (tabBackground) cssVars['--arc-tab-bg'] = tabBackground
    if (tabHoverBackground) cssVars['--arc-tab-hover-bg'] = tabHoverBackground
    if (panelBackground) cssVars['--arc-panel-bg'] = panelBackground
    if (panelBorderColor) cssVars['--arc-panel-border'] = panelBorderColor
    if (cutoutColor) cssVars['--arc-notch-bg'] = cutoutColor

    cssVars['--arc-motion-duration'] = `${effectiveMotionDuration}ms`
    // Spring easing for the sliding indicator (expressive-only element). Set as
    // a var here rather than an arbitrary Tailwind class so the verbose
    // `linear()` literal lives in one place, shared with the WAAPI panel enter.
    cssVars['--arc-motion-spring'] = ARC_SPRING_EASING

    const isFirst = selectedIndex === 0
    const isLast = selectedIndex === items.length - 1
    cssVars['--arc-panel-tl-radius'] = isFirst ? '0px' : 'var(--arc-panel-corner-radius)'
    cssVars['--arc-panel-tr-radius'] = isLast ? '0px' : 'var(--arc-panel-corner-radius)'

    return cssVars
  }, [
    style,
    radius,
    stripPadding,
    tabRadius,
    gap,
    seamGap,
    notch,
    panelPadding,
    accentColor,
    tabBackground,
    tabHoverBackground,
    panelBackground,
    panelBorderColor,
    cutoutColor,
    effectiveMotionDuration,
    selectedIndex,
    items.length,
  ])

  const rootClassName = joinClassNames(
    'arc-tabs-tw w-full isolate text-[var(--arc-text)] [--arc-radius:16px] [--arc-gap:2px] [--arc-strip-padding:4px] [--arc-seam-gap:0px] [--arc-border-width:1px] [--arc-tab-radius:max(0px,calc(var(--arc-radius)-var(--arc-strip-padding)))] [--arc-panel-corner-radius:max(0px,calc(var(--arc-radius)-(var(--arc-strip-padding)*2)))] [--arc-notch:var(--arc-tab-radius)] [--arc-notch-offset-y:100%] [--arc-accent:#5b4ff1] [--arc-text:#171a2c] [--arc-tab-bg:#e7ebff] [--arc-strip-bg:#edf1ff] [--arc-notch-bg:var(--arc-strip-bg)] [--arc-tab-hover-bg:#dce3ff] [--arc-panel-bg:#ffffff] [--arc-panel-border:#cfd6f5] [--arc-panel-padding:1rem] [--arc-divider:var(--arc-panel-border)] [--arc-divider-inset:25%] [--arc-motion-duration:260ms] [--arc-surface-shadow:0_1px_2px_rgba(15,23,42,0.08)] dark:[--arc-text:#edf1ff] dark:[--arc-tab-bg:#2c3555] dark:[--arc-strip-bg:#26304d] dark:[--arc-tab-hover-bg:#374268] dark:[--arc-panel-bg:#1c243b] dark:[--arc-panel-border:#46527e] dark:[--arc-surface-shadow:0_1px_2px_rgba(2,8,20,0.52)]',
    classNames?.root,
    className,
  )

  const listClassName = joinClassNames(
    'relative m-0 flex min-w-full list-none items-end gap-[var(--arc-gap)] overflow-visible rounded-t-[var(--arc-radius)] border border-b-0 border-[var(--arc-panel-border)] bg-[var(--arc-strip-bg)] px-[var(--arc-strip-padding)] pb-[var(--arc-seam-gap)] pt-[var(--arc-strip-padding)] isolate',
    classNames?.list,
    tabsClassName,
  )

  const listScrollClassName =
    'relative -mb-[calc(var(--arc-notch)+var(--arc-seam-gap))] overflow-x-auto overflow-y-visible pb-[calc(var(--arc-notch)+var(--arc-seam-gap))] [scrollbar-width:thin]'

  const panelsClassName = joinClassNames(
    'relative z-[2] mt-0 overflow-hidden rounded-bl-[var(--arc-radius)] rounded-br-[var(--arc-radius)] rounded-tl-[var(--arc-panel-tl-radius)] rounded-tr-[var(--arc-panel-tr-radius)] border border-t-0 border-[var(--arc-panel-border)] bg-[var(--arc-panel-bg)] p-[var(--arc-panel-padding)] shadow-[var(--arc-surface-shadow)] transition-[border-radius] duration-[var(--arc-motion-duration)] ease-[cubic-bezier(0.22,1,0.36,1)]',
    classNames?.panels,
    panelClassName,
  )

  const renderDefaultLabel = (item: ArcTabItem) => (
    <>
      {item.icon ? (
        <span className={joinClassNames('inline-flex leading-none', classNames?.icon)}>
          {item.icon}
        </span>
      ) : null}
      <span className={joinClassNames('inline-block', classNames?.text)}>{item.label}</span>
      {item.badge !== undefined ? (
        <span
          className={joinClassNames(
            'inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--arc-accent)] px-1.5 py-0.5 text-[0.72em] font-bold text-white/95',
            classNames?.badge,
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </>
  )

  const renderPanelContent = (item: ArcTabItem, state: ArcTabsRenderState) =>
    renderPanel ? renderPanel(item, state) : item.content

  // The one tab the Tab key lands on: the focused tab, else the selected one, else - when a
  // controlled value selects nothing - the first enabled tab, so the tablist stays reachable.
  const tabStopIndex =
    focusedIndex !== -1 ? focusedIndex : selectedIndex !== -1 ? selectedIndex : firstEnabledIndex

  const indicatorStyle = React.useMemo<CSSVarStyle>(
    () => ({
      '--arc-indicator-x': `${indicator.x}px`,
      '--arc-indicator-w': `${indicator.width}px`,
    }),
    [indicator.x, indicator.width],
  )

  // Opacity is only in the transition list after the user has interacted.
  // On first mount the indicator goes from `ready:false` → `ready:true` after
  // a rAF — without this guard it would fade in over ~180ms on every mount,
  // producing a visible flash that looks like hydration mismatch.
  const indicatorClassName = joinClassNames(
    "pointer-events-none absolute left-0 top-0 z-[1] h-[calc(100%-var(--arc-seam-gap))] w-[var(--arc-indicator-w)] translate-x-[var(--arc-indicator-x)] overflow-visible rounded-t-[var(--arc-tab-radius)] rounded-b-none bg-[var(--arc-panel-bg)] shadow-[var(--arc-surface-shadow)] opacity-0 [transition-duration:var(--arc-motion-duration)] [transition-timing-function:var(--arc-motion-spring)] before:pointer-events-none before:absolute before:bottom-0 before:left-[calc(var(--arc-notch)*-1)] before:h-[var(--arc-seam-gap)] before:w-[calc(100%+var(--arc-notch)*2)] before:translate-y-full before:bg-[linear-gradient(var(--arc-panel-bg),_var(--arc-panel-bg))_center_top/calc(100%-var(--arc-notch)*2)_100%_no-repeat] before:content-[''] after:pointer-events-none after:absolute after:bottom-0 after:left-[calc(var(--arc-notch)*-1)] after:h-[var(--arc-notch)] after:w-[calc(100%+var(--arc-notch)*2)] after:translate-y-[calc(var(--arc-notch-offset-y)+var(--arc-seam-gap))] after:bg-[radial-gradient(circle_at_0_0,var(--arc-notch-bg)_calc(var(--arc-notch)-var(--arc-border-width)),var(--arc-panel-border)_calc(var(--arc-notch)-var(--arc-border-width)),var(--arc-panel-border)_calc(var(--arc-notch)-0.5px),var(--arc-panel-bg)_calc(var(--arc-notch)+0.5px))_left_top/var(--arc-notch)_var(--arc-notch)_no-repeat,radial-gradient(circle_at_100%_0,var(--arc-notch-bg)_calc(var(--arc-notch)-var(--arc-border-width)),var(--arc-panel-border)_calc(var(--arc-notch)-var(--arc-border-width)),var(--arc-panel-border)_calc(var(--arc-notch)-0.5px),var(--arc-panel-bg)_calc(var(--arc-notch)+0.5px))_right_top/var(--arc-notch)_var(--arc-notch)_no-repeat] after:content-['']",
    hasInteracted ? 'transition-[transform,width,opacity]' : 'transition-[transform,width]',
    indicator.ready && 'opacity-100',
    classNames?.indicator,
  )

  return (
    <div className={rootClassName} style={themedStyle} data-slot="root" {...rest}>
      <div ref={listScrollRef} className={listScrollClassName} data-slot="list-scroll">
        <ul
          ref={listRef}
          className={listClassName}
          role="tablist"
          aria-label={ariaLabel}
          id={`${baseId}-list`}
          data-slot="list"
        >
          {showSlidingIndicator ? (
            <li
              aria-hidden="true"
              role="presentation"
              className={indicatorClassName}
              style={indicatorStyle}
              data-slot="indicator"
            />
          ) : null}

          {items.map((item, index) => {
            const selected = index === selectedIndex
            const disabled = Boolean(item.disabled)
            const tabId = `${baseId}-tab-${index}`
            const panelId = `${baseId}-panel-${index}`
            const state: ArcTabsRenderState = { index, selected, disabled }

            const tabIndexValue = !disabled && index === tabStopIndex ? 0 : -1

            const itemClassName = joinClassNames(
              'relative',
              fit === 'equal' ? 'min-w-0 flex-1' : 'shrink-0',
              selected ? 'z-[4]' : 'z-[2]',
              // Flat appearance: the hairline in the gap before a tab that follows another tab.
              // It drops out beside a tab that has a shape - the selected one (known here) and
              // the hovered one (a sibling selector) - on both of that tab's sides.
              appearance === 'flat' &&
                index > 0 &&
                "before:pointer-events-none before:absolute before:content-[''] before:inset-y-[var(--arc-divider-inset)] before:start-[calc((var(--arc-gap)+var(--arc-border-width))*-0.5)] before:w-[var(--arc-border-width)] before:bg-[var(--arc-divider)] before:transition-opacity before:[transition-duration:var(--arc-motion-duration)] motion-reduce:before:transition-none hover:before:opacity-0 [li:hover+&]:before:opacity-0",
              appearance === 'flat' &&
                index > 0 &&
                (selected || index === selectedIndex + 1) &&
                'before:opacity-0',
              classNames?.item,
            )

            // NOTE: Selected-state styling uses `aria-selected:` variants rather
            // than branching the class list. The attribute-selector specificity
            // (`[aria-selected="true"]`) wins deterministically over base
            // utilities regardless of Tailwind's generated-CSS order, which is
            // how two equal-specificity arbitrary values (e.g. `bg-[var(--tab)]`
            // vs `bg-[var(--panel)]`) used to race.
            //
            // Transform is intentionally absent from the transition list so the
            // :active translateY snaps — matching the plain-CSS ArcTabs.
            const tabClassName = joinClassNames(
              // Layout
              'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
              // Text
              'text-inherit font-semibold leading-none select-none',
              // Baseline visuals (unselected). Every state sets `--arc-tab-fill` and the box and
              // the notch pseudo-elements paint from it, so the two cannot disagree; registering
              // the property (see README) lets the notch fade with the box instead of snapping.
              'rounded-[var(--arc-tab-radius)] border border-[var(--arc-panel-border)] [--arc-tab-fill:var(--arc-tab-bg)] bg-[var(--arc-tab-fill)]',
              // Transitions
              'transition-[--arc-tab-fill,background-color,color,border-color,box-shadow] [transition-duration:var(--arc-motion-duration)] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
              // Focus
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arc-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--arc-panel-bg)]',
              // Disabled
              'disabled:cursor-not-allowed disabled:opacity-45',
              // Flat appearance: an unselected tab has no box, only its label on the strip. The
              // hover utility below carries more variants, so it still raises its chip.
              appearance === 'flat' &&
                'aria-[selected=false]:[--arc-tab-fill:transparent] aria-[selected=false]:border-transparent',
              // Hover (unselected, enabled only)
              'aria-[selected=false]:enabled:hover:[--arc-tab-fill:var(--arc-tab-hover-bg)]',
              // Active press (unselected, enabled) — snaps because transform
              // is not in the transition list
              'aria-[selected=false]:enabled:active:translate-y-px',
              // Pseudo-element seam (::before)
              "before:pointer-events-none before:absolute before:content-[''] before:bottom-0 before:left-[calc(var(--arc-notch)*-1)] before:h-[var(--arc-seam-gap)] before:w-[calc(100%+var(--arc-notch)*2)] before:translate-y-full before:bg-[linear-gradient(var(--arc-tab-fill),_var(--arc-tab-fill))_center_top/calc(100%-var(--arc-notch)*2)_100%_no-repeat] before:opacity-0 before:transition-opacity before:[transition-duration:var(--arc-motion-duration)] before:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
              // Pseudo-element notch corners (::after)
              "after:pointer-events-none after:absolute after:content-[''] after:bottom-0 after:left-[calc(var(--arc-notch)*-1)] after:h-[var(--arc-notch)] after:w-[calc(100%+var(--arc-notch)*2)] after:translate-y-[calc(var(--arc-notch-offset-y)+var(--arc-seam-gap))] after:bg-[radial-gradient(circle_at_0_0,var(--arc-notch-bg)_calc(var(--arc-notch)-var(--arc-border-width)),var(--arc-panel-border)_calc(var(--arc-notch)-var(--arc-border-width)),var(--arc-panel-border)_calc(var(--arc-notch)-0.5px),var(--arc-tab-fill)_calc(var(--arc-notch)+0.5px))_left_top/var(--arc-notch)_var(--arc-notch)_no-repeat,radial-gradient(circle_at_100%_0,var(--arc-notch-bg)_calc(var(--arc-notch)-var(--arc-border-width)),var(--arc-panel-border)_calc(var(--arc-notch)-var(--arc-border-width)),var(--arc-panel-border)_calc(var(--arc-notch)-0.5px),var(--arc-tab-fill)_calc(var(--arc-notch)+0.5px))_right_top/var(--arc-notch)_var(--arc-notch)_no-repeat] after:opacity-0 after:transition-opacity after:[transition-duration:var(--arc-motion-duration)] after:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
              // Selected state (aria-selected="true" → attribute-selector specificity wins)
              'aria-selected:z-[3] aria-selected:rounded-b-none aria-selected:border-b-0 aria-selected:text-[var(--arc-text)] aria-selected:[--arc-tab-fill:var(--arc-panel-bg)] aria-selected:shadow-[var(--arc-surface-shadow)]',
              'aria-selected:before:opacity-100 aria-selected:after:opacity-100',
              // Size + fit
              sizeClassMap[size],
              fit === 'equal' && 'w-full justify-center',
              // Consumer overrides (applied last so they win over library defaults)
              classNames?.tab,
              selected ? classNames?.tabSelected : classNames?.tabUnselected,
              disabled && classNames?.tabDisabled,
            )

            return (
              <li className={itemClassName} key={item.id} role="presentation" data-slot="item">
                {tabElement === 'div' ? (
                  <div
                    id={tabId}
                    ref={(node) => {
                      tabRefs.current[index] = node
                    }}
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    aria-disabled={disabled || undefined}
                    tabIndex={tabIndexValue}
                    className={tabClassName}
                    onFocus={() => {
                      if (disabled) return
                      setFocusedIndex(index)
                    }}
                    onClick={() => {
                      if (disabled) return
                      selectTab(index)
                    }}
                    onKeyDown={(event) => {
                      if (disabled) return
                      handleTabKeyDown(event, index)
                    }}
                    data-slot="tab"
                  >
                    {renderTabLabel ? renderTabLabel(item, state) : renderDefaultLabel(item)}
                  </div>
                ) : (
                  <button
                    id={tabId}
                    ref={(node) => {
                      tabRefs.current[index] = node
                    }}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={panelId}
                    tabIndex={tabIndexValue}
                    disabled={disabled}
                    className={tabClassName}
                    onFocus={() => {
                      setFocusedIndex(index)
                    }}
                    onClick={() => {
                      selectTab(index)
                    }}
                    onKeyDown={(event) => {
                      handleTabKeyDown(event, index)
                    }}
                    data-slot="tab"
                  >
                    {renderTabLabel ? renderTabLabel(item, state) : renderDefaultLabel(item)}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className={panelsClassName} data-slot="panels">
        {items.length === 0 && emptyState}

        {items.length > 0 && selectedItem === undefined && emptyState}

        {items.length > 0 && selectedItem !== undefined && keepMounted
          ? items.map((item, index) => {
              const selected = index === selectedIndex
              const disabled = Boolean(item.disabled)
              const tabId = `${baseId}-tab-${index}`
              const panelId = `${baseId}-panel-${index}`
              const state: ArcTabsRenderState = { index, selected, disabled }

              return (
                <section
                  key={item.id}
                  ref={(node) => {
                    if (selected) {
                      activePanelRef.current = node
                    }
                  }}
                  id={panelId}
                  className={joinClassNames('outline-none rounded-[inherit]', classNames?.panel)}
                  role="tabpanel"
                  aria-labelledby={tabId}
                  aria-hidden={!selected}
                  hidden={!selected}
                  data-slot="panel"
                >
                  {renderPanelContent(item, state)}
                </section>
              )
            })
          : null}

        {items.length > 0 && selectedItem !== undefined && !keepMounted ? (
          <section
            ref={(node) => {
              activePanelRef.current = node
            }}
            id={`${baseId}-panel-${selectedIndex}`}
            className={joinClassNames('outline-none rounded-[inherit]', classNames?.panel)}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${selectedIndex}`}
            aria-hidden={false}
            data-slot="panel"
          >
            {renderPanelContent(selectedItem, {
              index: selectedIndex,
              selected: true,
              disabled: Boolean(selectedItem.disabled),
            })}
          </section>
        ) : null}
      </div>
    </div>
  )
}
