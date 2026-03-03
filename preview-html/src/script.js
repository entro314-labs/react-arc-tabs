const root = document.getElementById('arcPreview')
const tabs = Array.from(root.querySelectorAll('[role="tab"]'))
const radiusRange = document.getElementById('radiusRange')
const radiusValue = document.getElementById('radiusValue')
const gapRange = document.getElementById('gapRange')
const gapValue = document.getElementById('gapValue')

const panelById = new Map(
  tabs.map((tab) => {
    const panelId = tab.getAttribute('aria-controls')
    return [panelId, document.getElementById(panelId)]
  }),
)

let selectedIndex = Math.max(
  0,
  tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true'),
)

const setSelectedTab = (nextIndex, { focus } = { focus: false }) => {
  selectedIndex = nextIndex

  tabs.forEach((tab, index) => {
    const selected = index === nextIndex
    tab.setAttribute('aria-selected', selected ? 'true' : 'false')
    tab.tabIndex = selected ? 0 : -1

    const panelId = tab.getAttribute('aria-controls')
    const panel = panelById.get(panelId)
    if (!panel) return

    panel.hidden = !selected
    panel.setAttribute('aria-hidden', selected ? 'false' : 'true')
  })

  if (focus) {
    tabs[nextIndex]?.focus()
  }
}

const moveSelection = (direction) => {
  const count = tabs.length
  const next = (selectedIndex + direction + count) % count
  setSelectedTab(next, { focus: true })
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => {
    setSelectedTab(index)
  })

  tab.addEventListener('keydown', (event) => {
    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault()
        moveSelection(1)
        break
      }
      case 'ArrowLeft': {
        event.preventDefault()
        moveSelection(-1)
        break
      }
      case 'Home': {
        event.preventDefault()
        setSelectedTab(0, { focus: true })
        break
      }
      case 'End': {
        event.preventDefault()
        setSelectedTab(tabs.length - 1, { focus: true })
        break
      }
      default:
        break
    }
  })
})

const updateRadius = () => {
  const px = `${radiusRange.value}px`
  root.style.setProperty('--arc-radius', px)
  radiusValue.value = px
}

const updateGap = () => {
  const px = `${gapRange.value}px`
  root.style.setProperty('--arc-gap', px)
  gapValue.value = px
}

radiusRange.addEventListener('input', updateRadius)
gapRange.addEventListener('input', updateGap)

updateRadius()
updateGap()
setSelectedTab(selectedIndex)
