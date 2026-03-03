'use client'

import * as React from 'react'

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
  motionPreset = 'subtle',
  motionDuration = 260,
  ariaLabel = 'Tabs',
  listId,
  tabsClassName,
  panelClassName,
  radius,
  gap,
  panelPadding,
  accentColor,
  tabBackground,
  tabHoverBackground,
  panelBackground,
  panelBorderColor,
  emptyState = null,
  renderTabLabel,
  renderPanel,
  className,
  style,
  classNames,
  ...rest
}: ArcTabsTailwindProps) {
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

  const selectedIndex = strictSelectedIndex >= 0 ? strictSelectedIndex : firstEnabledIndex

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
    if (selectedIndex === -1) {
      setFocusedIndex(-1)
      return
    }

    if (focusedIndex < 0 || focusedIndex >= items.length || items[focusedIndex]?.disabled) {
      setFocusedIndex(selectedIndex)
    }
  }, [focusedIndex, selectedIndex, items])

  const enabledIndices = React.useMemo(() => getEnabledIndices(items), [items])

  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const listScrollRef = React.useRef<HTMLDivElement | null>(null)
  const listRef = React.useRef<HTMLUListElement | null>(null)
  const activePanelRef = React.useRef<HTMLElement | null>(null)
  const hasMountedRef = React.useRef(false)
  const previousSelectedIndexRef = React.useRef(selectedIndex)

  const [hasInteracted, setHasInteracted] = React.useState(false)
  const [panelDirection, setPanelDirection] = React.useState<'forward' | 'backward' | 'none'>(
    'none',
  )
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

      if (selectedIndex >= 0 && previous >= 0) {
        setPanelDirection(selectedIndex > previous ? 'forward' : 'backward')
      }
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
      if (selectedIndex >= 0) {
        setPanelDirection(index > selectedIndex ? 'forward' : 'backward')
      }

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
      tabRefs.current.forEach((tabElement) => {
        if (tabElement) observer?.observe(tabElement)
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
      typeof globalThis.window !== 'undefined' &&
      globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    const offsetX =
      motionPreset === 'expressive'
        ? panelDirection === 'forward'
          ? 20
          : panelDirection === 'backward'
            ? -20
            : 0
        : 0

    const offsetY = motionPreset === 'expressive' ? 10 : 6
    const startScale = motionPreset === 'expressive' ? 0.985 : 0.995

    const animation = panelElement.animate(
      [
        {
          opacity: 0,
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${startScale})`,
          filter: 'blur(1px)',
        },
        {
          opacity: 1,
          transform: 'translate3d(0, 0, 0) scale(1)',
          filter: 'blur(0px)',
        },
      ],
      {
        duration: effectiveMotionDuration,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both',
      },
    )

    return () => {
      animation.cancel()
    }
  }, [selectedIndex, hasInteracted, motionPreset, panelDirection, effectiveMotionDuration])

  const handleTabKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
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
          if (activationMode === 'manual') {
            event.preventDefault()
            selectTab(index)
          }
          break
        }
        default:
          break
      }
    },
    [activationMode, enabledIndices, focusTabIndex, selectTab],
  )

  const themedStyle = React.useMemo<React.CSSProperties>(() => {
    const cssVars: CSSVarStyle = { ...style }

    if (radius !== undefined) {
      cssVars['--arc-radius'] = `${radius}px`
    }
    if (gap !== undefined) {
      cssVars['--arc-gap'] = `${gap}px`
    }

    const panelPaddingValue = toCssSize(panelPadding)
    if (panelPaddingValue !== undefined) {
      cssVars['--arc-panel-padding'] = panelPaddingValue
    }
    if (accentColor) {
      cssVars['--arc-accent'] = accentColor
    }
    if (tabBackground) {
      cssVars['--arc-tab-bg'] = tabBackground
    }
    if (tabHoverBackground) {
      cssVars['--arc-tab-hover-bg'] = tabHoverBackground
    }
    if (panelBackground) {
      cssVars['--arc-panel-bg'] = panelBackground
    }
    if (panelBorderColor) {
      cssVars['--arc-panel-border'] = panelBorderColor
    }
    cssVars['--arc-notch'] = 'clamp(6px, calc(var(--arc-radius) * 0.58), 12px)'
    cssVars['--arc-motion-duration'] = `${effectiveMotionDuration}ms`

    return cssVars
  }, [
    style,
    radius,
    gap,
    panelPadding,
    accentColor,
    tabBackground,
    tabHoverBackground,
    panelBackground,
    panelBorderColor,
    effectiveMotionDuration,
  ])

  const rootClassName = joinClassNames(
    'arc-tabs-tw w-full text-[var(--arc-text)] [--arc-radius:14px] [--arc-gap:10px] [--arc-border-width:1px] [--arc-accent:#5b4ff1] [--arc-text:#171a2c] [--arc-tab-bg:#e7ebff] [--arc-strip-bg:#edf1ff] [--arc-tab-hover-bg:#dce3ff] [--arc-panel-bg:#ffffff] [--arc-panel-border:#cfd6f5] [--arc-panel-padding:1rem] [--arc-motion-duration:260ms] dark:[--arc-text:#edf1ff] dark:[--arc-tab-bg:#2c3555] dark:[--arc-strip-bg:#26304d] dark:[--arc-tab-hover-bg:#374268] dark:[--arc-panel-bg:#1c243b] dark:[--arc-panel-border:#46527e]',
    classNames?.root,
    className,
  )

  const listClassName = joinClassNames(
    'relative m-0 flex min-w-full list-none items-end gap-[var(--arc-gap)] overflow-visible rounded-t-[var(--arc-radius)] border border-b-0 border-[var(--arc-panel-border)] bg-[var(--arc-strip-bg)] px-[calc(var(--arc-gap)*0.6)] pb-[var(--arc-gap)] pt-[calc(var(--arc-gap)*0.6)] isolate',
    classNames?.list,
    tabsClassName,
  )

  const listScrollClassName =
    'relative -mb-[var(--arc-notch)] overflow-x-auto overflow-y-visible pb-[var(--arc-notch)] [scrollbar-width:thin]'

  const panelsClassName = joinClassNames(
    'relative z-[2] mt-0 rounded-b-[var(--arc-radius)] rounded-t-none border border-t-0 border-[var(--arc-panel-border)] bg-[var(--arc-panel-bg)] p-[var(--arc-panel-padding)] shadow-[0_12px_32px_rgba(15,23,42,0.12)]',
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

  const indicatorStyle = React.useMemo<CSSVarStyle>(
    () => ({
      '--arc-indicator-x': `${indicator.x}px`,
      '--arc-indicator-w': `${indicator.width}px`,
    }),
    [indicator.x, indicator.width],
  )

  const indicatorClassName = joinClassNames(
    'pointer-events-none absolute left-0 top-0 z-[1] h-[calc(100%-var(--arc-gap))] w-[var(--arc-indicator-w)] translate-x-[var(--arc-indicator-x)] rounded-t-[var(--arc-radius)] rounded-b-none bg-[var(--arc-panel-bg)] opacity-0 [box-shadow:0_var(--arc-gap)_0_var(--arc-panel-bg)] transition-[transform,width,opacity] [transition-duration:var(--arc-motion-duration)] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]',
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

            const tabIndexValue = disabled
              ? -1
              : focusedIndex === index || (focusedIndex === -1 && selected)
                ? 0
                : -1

            const itemClassName = joinClassNames(
              fit === 'equal' ? 'relative z-[2] min-w-0 flex-1' : 'relative z-[2] shrink-0',
              classNames?.item,
            )

            const tabClassName = joinClassNames(
              "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--arc-radius)] border border-[var(--arc-panel-border)] bg-[var(--arc-tab-bg)] text-inherit font-semibold leading-none select-none transition-[background-color,color,transform,border-color,box-shadow] [transition-duration:var(--arc-motion-duration)] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arc-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--arc-panel-bg)] disabled:cursor-not-allowed disabled:opacity-45 before:pointer-events-none before:absolute before:bottom-0 before:left-[calc(var(--arc-notch)*-1)] before:h-[var(--arc-border-width)] before:w-[calc(100%+var(--arc-notch)*2)] before:translate-y-[var(--arc-gap)] before:bg-[var(--arc-panel-bg)] before:opacity-0 before:content-[''] before:transition-[opacity,transform] before:[transition-duration:var(--arc-motion-duration)] before:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)] after:pointer-events-none after:absolute after:bottom-0 after:left-[calc(var(--arc-notch)*-1)] after:h-[calc(var(--arc-notch)+var(--arc-border-width))] after:w-[calc(100%+var(--arc-notch)*2)] after:translate-y-[var(--arc-gap)] after:bg-[radial-gradient(circle_at_left_top,_transparent_var(--arc-notch),_var(--arc-panel-bg)_calc(var(--arc-notch)+1px))_left_top/calc(var(--arc-notch)*2)_calc(var(--arc-notch)*2)_no-repeat,radial-gradient(circle_at_right_top,_transparent_var(--arc-notch),_var(--arc-panel-bg)_calc(var(--arc-notch)+1px))_right_top/calc(var(--arc-notch)*2)_calc(var(--arc-notch)*2)_no-repeat,linear-gradient(var(--arc-panel-bg),_var(--arc-panel-bg))] after:opacity-0 after:content-[''] after:transition-[opacity,transform] after:[transition-duration:var(--arc-motion-duration)] after:[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
              sizeClassMap[size],
              fit === 'equal' && 'w-full justify-center',
              selected
                ? joinClassNames(
                    'z-[3] rounded-b-none border-[var(--arc-panel-bg)] text-[var(--arc-accent)] before:opacity-100 after:opacity-100 [box-shadow:0_var(--arc-gap)_0_var(--arc-panel-bg)]',
                    motionPreset === 'expressive' ? 'bg-transparent' : 'bg-[var(--arc-panel-bg)]',
                  )
                : 'enabled:hover:bg-[var(--arc-tab-hover-bg)] enabled:hover:translate-y-px enabled:active:translate-y-[2px]',
              selected ? classNames?.tabSelected : classNames?.tabUnselected,
              disabled && classNames?.tabDisabled,
              classNames?.tab,
            )

            return (
              <li className={itemClassName} key={item.id} role="presentation" data-slot="item">
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
                  className={joinClassNames('outline-none', classNames?.panel)}
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
            className={joinClassNames('outline-none', classNames?.panel)}
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
