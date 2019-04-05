import * as Events from '../src/events';

// Disable the context menu to have a more native feel
document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
});

document.getElementById('scope_layer').addEventListener('click', function() { ifEnabled(this, () => window.postMessage(Events.kEventScopeChange, Events.kScopeChangeTypeLayer)) })
document.getElementById('scope_artboard').addEventListener('click', function() { ifEnabled(this, () => window.postMessage(Events.kEventScopeChange, Events.kScopeChangeTypeArtboard)) })
document.getElementById('scope_page').addEventListener('click', function() { ifEnabled(this, () => window.postMessage(Events.kEventScopeChange, Events.kScopeChangeTypePage)) })
document.getElementById('scope_document').addEventListener('click', function() { ifEnabled(this, () => window.postMessage(Events.kEventScopeChange, Events.kScopeChangeTypeDocument)) })

document.getElementById('action_replace').addEventListener('click', () => window.postMessage(Events.kEventButtonPress, Events.kButtonPressReplace, getFindText(), getReplaceText()))
document.getElementById('action_find_next').addEventListener('click', () => window.postMessage(Events.kEventButtonPress, Events.kButtonPressFindNext, getFindText(), getReplaceText()))
document.getElementById('action_replace_all').addEventListener('click', () => window.postMessage(Events.kEventButtonPress, Events.kButtonPressReplaceAll, getFindText(), getReplaceText()))
document.getElementById('action_cancel').addEventListener('click', () => window.postMessage(Events.kEventButtonPress, Events.kButtonPressCancel))

function getFindText() {
    return document.getElementById('input_find').value
}

function getReplaceText() {
    return document.getElementById('input_replace').value
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

window.onTextChanged = function() {
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
  var currentScopeKey = Object.keys(scopeMap).find(key => document.getElementById(scopeMap[key]).getAttribute('class').includes('active'))
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
