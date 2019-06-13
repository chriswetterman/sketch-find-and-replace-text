import * as Events from '../src/events';

// Disable the context menu to have a more native feel
document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});

document.getElementById('scope_layer').addEventListener('click', function() { ifEnabled(this, () => window.postMessage(Events.kEventScopeChange, Events.kScopeChangeTypeLayer)) })
document.getElementById('scope_artboard').addEventListener('click', function() { ifEnabled(this, () => window.postMessage(Events.kEventScopeChange, Events.kScopeChangeTypeArtboard)) })
document.getElementById('scope_page').addEventListener('click', function() { ifEnabled(this, () => window.postMessage(Events.kEventScopeChange, Events.kScopeChangeTypePage)) })
document.getElementById('scope_document').addEventListener('click', function() { ifEnabled(this, () => window.postMessage(Events.kEventScopeChange, Events.kScopeChangeTypeDocument)) })

document.getElementById('action_replace').addEventListener('click', function() { notifyActionRequested(this, Events.kButtonPressReplace) })
document.getElementById('action_find_next').addEventListener('click', function() { notifyActionRequested(this, Events.kButtonPressFindNext) })
document.getElementById('action_replace_all').addEventListener('click', function() { notifyActionRequested(this, Events.kButtonPressReplaceAll) })
document.getElementById('action_cancel').addEventListener('click', () => window.postMessage(Events.kEventButtonPress, Events.kButtonPressCancel))

document.getElementById('input_find').addEventListener('keyup', function() { setActionButtonsState(this.value) } )

document.getElementById('toggle_case').addEventListener('click', function() { toggleIndividualActiveState(this) })
document.getElementById('toggle_word').addEventListener('click', function() { toggleIndividualActiveState(this) })
document.getElementById('toggle_layer').addEventListener('click', function() { toggleIndividualActiveState(this) })

function getFindText() {
    return document.getElementById('input_find').value
}

function getReplaceText() {
    return document.getElementById('input_replace').value
}

/**
 * Notifies the main process that an action has been requested
 * @param {*} el The element the action took place on
 * @param {*} event The event to fire
 */
function notifyActionRequested(el, event) {
  ifEnabled(el, () =>
    window.postMessage(
      Events.kEventButtonPress,
      event,
      getFindText(),
      getReplaceText(),
      isActive(document.getElementById('toggle_case')),
      isActive(document.getElementById('toggle_word')),
      isActive(document.getElementById('toggle_layer')),
    )
  )
}

/**
 *
 * @param {*} el
 */
function isActive(el) {
  if (typeof el === 'string') {
    el = document.getElementById(el)
  }

  return el.getAttribute('class').includes('active')
}

/**
 * For any element with an ID prefix of 'toggle_', searches
 * the class names and adds or removes the 'active' style
 * based on its presence
 * @param {*} el
 */
function toggleIndividualActiveState(el) {
  // Only process 'toggle_' elements
  if (el.getAttribute('id').includes('toggle_')) {
    var style = el.getAttribute('class')
    // Remove active if present, otherwise include it
    if (style.includes('active')) {
      style = style.split('active').map(v => v.trim()).join(' ')
      el.setAttribute('class', style)
    } else {
      el.setAttribute('class', style + ' active')
    }
    // Notify main process a re-scan is in order
    window.onLayerTextChanged()
  }
}

/**
 * Based on the presense of text or not, manages the enabled/disabled state of the action buttons
 * @param {string} text Current value of find input
 */
function setActionButtonsState(text) {
  // Take classnames, filter out disabled then set accordingly to state
  var spliter = (classNames, active) => {
    var style = classNames.split(' ').filter(cls => cls !== 'disabled').join(' ')
    if (!active) {
      style += ' disabled'
    }
    return style
  }
  // Based on the current styles and active state, updates the attribute
  var updateStyles = (el, state) => {
    el.setAttribute('class', spliter(el.getAttribute('class'), state))
  }

  var active =  text && text.length > 0
  updateStyles(document.getElementById('action_find_next'), active)
  updateStyles(document.getElementById('action_replace'), active)
  updateStyles(document.getElementById('action_replace_all'), active)
}

/**
 * Checks to see if the element is disabled by way of class attributes. Executes
 * the function if not.
 *
 * @param {object} el HTML element
 * @param {function} fn Callback function if conditions are met
 */
function ifEnabled(el, fn) {
  if (el.getAttribute('class').includes('disabled') === false) {
    fn()
  }
}

/**
 * Sets the theme
 */
window.useTheme = function(theme) {
  var pathToTheme = '../styles.light.css'
  if (theme.toLowerCase() === 'dark') {
    pathToTheme = '../styles.dark.css'
  }
  var style = document.createElement('link')
  style.rel = 'stylesheet'
  style.type = 'text/css'
  style.href = pathToTheme
  document.head.appendChild(style)
}

window.onLayerTextChanged = function() {
  window.postMessage(Events.kEventTextChanged)
}

window.setActiveScopes = function(scopes) {
  var scopeMap = {
    [Events.kScopeChangeTypeDocument]: 'scope_document',
    [Events.kScopeChangeTypePage]: 'scope_page',
    [Events.kScopeChangeTypeArtboard]: 'scope_artboard',
    [Events.kScopeChangeTypeLayer]: 'scope_layer'
  }
  var activeScopes = scopes.split(',').reduce((accum, next) => {
    accum[next] = scopeMap[next]
    return accum
  },{})
  var inactiveScopes = Object.keys(scopeMap).reduce((accum, next) => {
    if(!activeScopes[next]) {
      accum[next] = scopeMap[next]
    }
    return accum
  }, {})

  // See if the current active scope selection can be maintained through this selection or if it
  // needs to fall back to document (default)
  var currentScopeKey = Object.keys(scopeMap).find(key => isActive(scopeMap[key]))
  var nextActiveScope = activeScopes[currentScopeKey] || scopeMap[Events.kScopeChangeTypeDocument]
  // Update button states
  var iconified = 'btn-iconified'
  Object.values(activeScopes).forEach(id => document.getElementById(id).setAttribute('class', iconified))
  Object.values(inactiveScopes).forEach(id => document.getElementById(id).setAttribute('class', `${iconified} disabled`))
  document.getElementById(nextActiveScope).setAttribute('class', `${iconified} active`)
}

/**
 * Sets the active class on the selected scope
 * @param {string} scopeEventType
 */
window.toggleSelectedBtnStyle = function(scopeEventType) {
  var activeBtnCollection = document.getElementsByClassName('btn-iconified active')
  // Reset the active class (should only be one entry in the collection)
  for (var i=0; i<activeBtnCollection.length; i++) {
    var item = activeBtnCollection.item(i)
    item.setAttribute('class', 'btn-iconified')
  }
  var activeClass = 'btn-iconified active'
  switch(scopeEventType) {
    case Events.kScopeChangeTypeDocument:
      document.getElementById('scope_document').setAttribute('class', activeClass)
      break;
    case Events.kScopeChangeTypePage:
      document.getElementById('scope_page').setAttribute('class', activeClass)
      break;
    case Events.kScopeChangeTypeArtboard:
      document.getElementById('scope_artboard').setAttribute('class', activeClass)
      break;
    case Events.kScopeChangeTypeLayer:
      document.getElementById('scope_layer').setAttribute('class', activeClass)
      break;
  }
}
