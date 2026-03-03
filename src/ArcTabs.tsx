"use client";

import * as React from "react";

export type ArcTabItem = {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
};

export type ArcTabsActivationMode = "automatic" | "manual";
export type ArcTabsSize = "sm" | "md" | "lg";
export type ArcTabsFit = "content" | "equal";
export type ArcTabsMotionPreset = "none" | "subtle" | "expressive";

export type ArcTabsRenderState = {
  index: number;
  selected: boolean;
  disabled: boolean;
};

type CSSVarStyle = React.CSSProperties & Record<`--${string}`, string | number>;

export interface ArcTabsProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  items: ArcTabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string, item: ArcTabItem, index: number) => void;
  activationMode?: ArcTabsActivationMode;
  keepMounted?: boolean;
  size?: ArcTabsSize;
  fit?: ArcTabsFit;
  motionPreset?: ArcTabsMotionPreset;
  motionDuration?: number;
  ariaLabel?: string;
  listId?: string;
  tabsClassName?: string;
  panelClassName?: string;
  radius?: number;
  gap?: number;
  panelPadding?: number | string;
  accentColor?: string;
  tabBackground?: string;
  tabHoverBackground?: string;
  panelBackground?: string;
  panelBorderColor?: string;
  emptyState?: React.ReactNode;
  renderTabLabel?: (
    item: ArcTabItem,
    state: ArcTabsRenderState
  ) => React.ReactNode;
  renderPanel?: (item: ArcTabItem, state: ArcTabsRenderState) => React.ReactNode;
}

const joinClassNames = (...parts: Array<string | undefined | false | null>) =>
  parts.filter(Boolean).join(" ");

const toCssSize = (value: number | string | undefined) =>
  typeof value === "number" ? `${value}px` : value;

const findFirstEnabledIndex = (items: ArcTabItem[]) =>
  items.findIndex((item) => !item.disabled);

const getEnabledIndices = (items: ArcTabItem[]) =>
  items.reduce<number[]>((acc, item, index) => {
    if (!item.disabled) acc.push(index);
    return acc;
  }, []);

const getNextEnabledIndex = (
  enabledIndices: number[],
  currentIndex: number,
  direction: 1 | -1
) => {
  if (!enabledIndices.length) return -1;

  const currentPosition = enabledIndices.indexOf(currentIndex);
  if (currentPosition === -1) {
    return direction === 1
      ? (enabledIndices[0] ?? -1)
      : (enabledIndices[enabledIndices.length - 1] ?? -1);
  }

  const nextPosition =
    (currentPosition + direction + enabledIndices.length) % enabledIndices.length;
  return enabledIndices[nextPosition] ?? -1;
};

export function ArcTabs({
  items,
  value,
  defaultValue,
  onValueChange,
  activationMode = "automatic",
  keepMounted = true,
  size = "md",
  fit = "content",
  motionPreset = "subtle",
  motionDuration = 260,
  ariaLabel = "Tabs",
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
  ...rest
}: ArcTabsProps) {
  const reactId = React.useId();
  const baseId = React.useMemo(
    () => (listId ?? `arc-tabs-${reactId}`).replace(/:/g, ""),
    [listId, reactId]
  );

  const isControlled = value !== undefined;

  const firstEnabledIndex = React.useMemo(
    () => findFirstEnabledIndex(items),
    [items]
  );

  const [uncontrolledValue, setUncontrolledValue] = React.useState<
    string | undefined
  >(() => {
    const requested = defaultValue;
    const requestedMatch = items.find(
      (item) => !item.disabled && item.id === requested
    );
    if (requestedMatch) return requestedMatch.id;
    return firstEnabledIndex >= 0 ? items[firstEnabledIndex]?.id : undefined;
  });

  const rawValue = isControlled ? value : uncontrolledValue;

  const strictSelectedIndex = React.useMemo(
    () => items.findIndex((item) => !item.disabled && item.id === rawValue),
    [items, rawValue]
  );

  const selectedIndex =
    strictSelectedIndex >= 0 ? strictSelectedIndex : firstEnabledIndex;

  const selectedItem = selectedIndex >= 0 ? items[selectedIndex] : undefined;

  React.useEffect(() => {
    if (isControlled) return;
    if (strictSelectedIndex !== -1) return;

    if (firstEnabledIndex !== -1) {
      const fallbackId = items[firstEnabledIndex]?.id;
      setUncontrolledValue(fallbackId);
    } else {
      setUncontrolledValue(undefined);
    }
  }, [isControlled, strictSelectedIndex, firstEnabledIndex, items]);

  const [focusedIndex, setFocusedIndex] = React.useState<number>(selectedIndex);

  React.useEffect(() => {
    if (selectedIndex === -1) {
      setFocusedIndex(-1);
      return;
    }

    if (
      focusedIndex < 0 ||
      focusedIndex >= items.length ||
      items[focusedIndex]?.disabled
    ) {
      setFocusedIndex(selectedIndex);
    }
  }, [focusedIndex, selectedIndex, items]);

  const enabledIndices = React.useMemo(() => getEnabledIndices(items), [items]);

  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const activePanelRef = React.useRef<HTMLElement | null>(null);
  const hasMountedRef = React.useRef(false);
  const previousSelectedIndexRef = React.useRef(selectedIndex);

  const [hasInteracted, setHasInteracted] = React.useState(false);
  const [panelDirection, setPanelDirection] = React.useState<
    "forward" | "backward" | "none"
  >("none");
  const [indicator, setIndicator] = React.useState({
    x: 0,
    width: 0,
    ready: false
  });

  const effectiveMotionDuration =
    motionPreset === "none" ? 0 : Math.max(0, motionDuration);
  const showSlidingIndicator =
    motionPreset === "expressive" && selectedIndex >= 0;

  React.useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, items.length);
  }, [items.length]);

  React.useEffect(() => {
    const previous = previousSelectedIndexRef.current;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      previousSelectedIndexRef.current = selectedIndex;
      return;
    }

    if (previous !== selectedIndex) {
      setHasInteracted(true);

      if (selectedIndex >= 0 && previous >= 0) {
        setPanelDirection(selectedIndex > previous ? "forward" : "backward");
      }
    }

    previousSelectedIndexRef.current = selectedIndex;
  }, [selectedIndex]);

  const focusTabIndex = React.useCallback((index: number) => {
    if (index < 0) return;
    setFocusedIndex(index);
    tabRefs.current[index]?.focus();
  }, []);

  const selectTab = React.useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || item.disabled) return;
      if (index === selectedIndex) {
        setFocusedIndex(index);
        return;
      }

      setHasInteracted(true);
      if (selectedIndex >= 0) {
        setPanelDirection(index > selectedIndex ? "forward" : "backward");
      }

      if (!isControlled) {
        setUncontrolledValue(item.id);
      }

      setFocusedIndex(index);
      onValueChange?.(item.id, item, index);
    },
    [items, selectedIndex, isControlled, onValueChange]
  );

  const syncIndicator = React.useCallback(() => {
    if (!showSlidingIndicator) {
      setIndicator((previous) =>
        previous.ready || previous.width !== 0 || previous.x !== 0
          ? { x: 0, width: 0, ready: false }
          : previous
      );
      return;
    }

    const listElement = listRef.current;
    const selectedTab =
      selectedIndex >= 0 ? tabRefs.current[selectedIndex] ?? null : null;

    if (!listElement || !selectedTab) return;

    const listRect = listElement.getBoundingClientRect();
    const tabRect = selectedTab.getBoundingClientRect();
    const nextX = tabRect.left - listRect.left + listElement.scrollLeft;
    const nextWidth = tabRect.width;

    setIndicator((previous) => {
      const changedX = Math.abs(previous.x - nextX) > 0.5;
      const changedWidth = Math.abs(previous.width - nextWidth) > 0.5;
      if (!changedX && !changedWidth && previous.ready) {
        return previous;
      }

      return {
        x: nextX,
        width: nextWidth,
        ready: true
      };
    });
  }, [selectedIndex, showSlidingIndicator]);

  React.useEffect(() => {
    syncIndicator();
  }, [syncIndicator, items.length, size, fit]);

  React.useEffect(() => {
    if (!showSlidingIndicator) return;

    const listElement = listRef.current;
    if (!listElement) return;

    const onResize = () => syncIndicator();
    const onScroll = () => syncIndicator();

    const frame = requestAnimationFrame(syncIndicator);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => syncIndicator());
      observer.observe(listElement);
      tabRefs.current.forEach((tabElement) => {
        if (tabElement) observer?.observe(tabElement);
      });
    }

    listElement.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      listElement.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      observer?.disconnect();
    };
  }, [showSlidingIndicator, syncIndicator, items.length]);

  React.useEffect(() => {
    if (!hasInteracted || motionPreset === "none" || effectiveMotionDuration <= 0) {
      return;
    }

    const panelElement = activePanelRef.current;
    if (!panelElement || typeof panelElement.animate !== "function") {
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const offsetX =
      motionPreset === "expressive"
        ? panelDirection === "forward"
          ? 20
          : panelDirection === "backward"
            ? -20
            : 0
        : 0;

    const offsetY = motionPreset === "expressive" ? 10 : 6;
    const startScale = motionPreset === "expressive" ? 0.985 : 0.995;

    const animation = panelElement.animate(
      [
        {
          opacity: 0,
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${startScale})`,
          filter: "blur(1px)"
        },
        {
          opacity: 1,
          transform: "translate3d(0, 0, 0) scale(1)",
          filter: "blur(0px)"
        }
      ],
      {
        duration: effectiveMotionDuration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "both"
      }
    );

    return () => {
      animation.cancel();
    };
  }, [
    selectedIndex,
    hasInteracted,
    motionPreset,
    panelDirection,
    effectiveMotionDuration
  ]);

  const handleTabKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (!enabledIndices.length) return;

      switch (event.key) {
        case "ArrowRight": {
          event.preventDefault();
          const next = getNextEnabledIndex(enabledIndices, index, 1);
          if (next !== -1) {
            focusTabIndex(next);
            if (activationMode === "automatic") selectTab(next);
          }
          break;
        }
        case "ArrowLeft": {
          event.preventDefault();
          const previous = getNextEnabledIndex(enabledIndices, index, -1);
          if (previous !== -1) {
            focusTabIndex(previous);
            if (activationMode === "automatic") selectTab(previous);
          }
          break;
        }
        case "Home": {
          event.preventDefault();
          const first = enabledIndices[0];
          if (first !== undefined) {
            focusTabIndex(first);
            if (activationMode === "automatic") selectTab(first);
          }
          break;
        }
        case "End": {
          event.preventDefault();
          const last = enabledIndices[enabledIndices.length - 1];
          if (last !== undefined) {
            focusTabIndex(last);
            if (activationMode === "automatic") selectTab(last);
          }
          break;
        }
        case "Enter":
        case " ":
        case "Spacebar": {
          if (activationMode === "manual") {
            event.preventDefault();
            selectTab(index);
          }
          break;
        }
        default:
          break;
      }
    },
    [activationMode, enabledIndices, focusTabIndex, selectTab]
  );

  const themedStyle = React.useMemo<React.CSSProperties>(() => {
    const cssVars: CSSVarStyle = { ...style };

    if (radius !== undefined) {
      cssVars["--arc-radius"] = `${radius}px`;
    }
    if (gap !== undefined) {
      cssVars["--arc-gap"] = `${gap}px`;
    }

    const panelPaddingValue = toCssSize(panelPadding);
    if (panelPaddingValue !== undefined) {
      cssVars["--arc-panel-padding"] = panelPaddingValue;
    }
    if (accentColor) {
      cssVars["--arc-accent"] = accentColor;
    }
    if (tabBackground) {
      cssVars["--arc-tab-bg"] = tabBackground;
    }
    if (tabHoverBackground) {
      cssVars["--arc-tab-hover-bg"] = tabHoverBackground;
    }
    if (panelBackground) {
      cssVars["--arc-panel-bg"] = panelBackground;
    }
    if (panelBorderColor) {
      cssVars["--arc-panel-border"] = panelBorderColor;
    }
    cssVars["--arc-motion-duration"] = `${effectiveMotionDuration}ms`;

    return cssVars;
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
    effectiveMotionDuration
  ]);

  const rootClassName = joinClassNames(
    "arc-tabs",
    `arc-tabs--size-${size}`,
    `arc-tabs--fit-${fit}`,
    `arc-tabs--motion-${motionPreset}`,
    hasInteracted && "arc-tabs--has-interacted",
    panelDirection !== "none" && `arc-tabs--direction-${panelDirection}`,
    className
  );

  const indicatorStyle = React.useMemo<CSSVarStyle>(
    () => ({
      "--arc-indicator-x": `${indicator.x}px`,
      "--arc-indicator-w": `${indicator.width}px`
    }),
    [indicator.x, indicator.width]
  );

  const renderDefaultLabel = (item: ArcTabItem) => (
    <>
      {item.icon ? <span className="arc-tabs__icon">{item.icon}</span> : null}
      <span className="arc-tabs__text">{item.label}</span>
      {item.badge !== undefined ? (
        <span className="arc-tabs__badge">{item.badge}</span>
      ) : null}
    </>
  );

  const renderPanelContent = (item: ArcTabItem, state: ArcTabsRenderState) =>
    renderPanel ? renderPanel(item, state) : item.content;

  return (
    <div className={rootClassName} style={themedStyle} {...rest}>
      <ul
        ref={listRef}
        className={joinClassNames("arc-tabs__list", tabsClassName)}
        role="tablist"
        aria-label={ariaLabel}
        id={`${baseId}-list`}
      >
        {showSlidingIndicator ? (
          <li
            aria-hidden="true"
            role="presentation"
            className={joinClassNames(
              "arc-tabs__active-indicator",
              indicator.ready && "is-ready"
            )}
            style={indicatorStyle}
          />
        ) : null}

        {items.map((item, index) => {
          const selected = index === selectedIndex;
          const disabled = Boolean(item.disabled);
          const tabId = `${baseId}-tab-${index}`;
          const panelId = `${baseId}-panel-${index}`;
          const state: ArcTabsRenderState = { index, selected, disabled };

          const tabIndexValue = disabled
            ? -1
            : focusedIndex === index || (focusedIndex === -1 && selected)
              ? 0
              : -1;

          return (
            <li className="arc-tabs__item" key={item.id} role="presentation">
              <button
                id={tabId}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={tabIndexValue}
                disabled={disabled}
                className="arc-tabs__tab"
                onFocus={() => setFocusedIndex(index)}
                onClick={() => selectTab(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                {renderTabLabel ? renderTabLabel(item, state) : renderDefaultLabel(item)}
              </button>
            </li>
          );
        })}
      </ul>

      <div className={joinClassNames("arc-tabs__panels", panelClassName)}>
        {items.length === 0 && emptyState}

        {items.length > 0 && selectedItem === undefined && emptyState}

        {items.length > 0 && selectedItem !== undefined && keepMounted
          ? items.map((item, index) => {
              const selected = index === selectedIndex;
              const disabled = Boolean(item.disabled);
              const tabId = `${baseId}-tab-${index}`;
              const panelId = `${baseId}-panel-${index}`;
              const state: ArcTabsRenderState = { index, selected, disabled };

              return (
                <section
                  key={item.id}
                  ref={(node) => {
                    if (selected) {
                      activePanelRef.current = node;
                    }
                  }}
                  id={panelId}
                  className="arc-tabs__panel"
                  role="tabpanel"
                  aria-labelledby={tabId}
                  aria-hidden={!selected}
                  hidden={!selected}
                >
                  {renderPanelContent(item, state)}
                </section>
              );
            })
          : null}

        {items.length > 0 && selectedItem !== undefined && !keepMounted ? (
          <section
            ref={(node) => {
              activePanelRef.current = node;
            }}
            id={`${baseId}-panel-${selectedIndex}`}
            className="arc-tabs__panel"
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${selectedIndex}`}
            aria-hidden={false}
          >
            {renderPanelContent(selectedItem, {
              index: selectedIndex,
              selected: true,
              disabled: Boolean(selectedItem.disabled)
            })}
          </section>
        ) : null}
      </div>
    </div>
  );
}
