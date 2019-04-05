import sketch from 'sketch';
import BrowserWindow from 'sketch-module-web-view';
import { isWebviewPresent, sendToWebview } from 'sketch-module-web-view/remote';
import { Document } from 'sketch/dom';
import UI from 'sketch/ui';
import { toArray } from 'util';
import * as Events from './events';
import manifest from './manifest.json';
import scanner from './scanner';
import Turnstile from './turnstile';
require('../resources/icon.png')

const WEBVIEW_ID = manifest.identifier
const ARTBOARD_LIKE = [String(sketch.Types.Artboard), String(sketch.Types.SymbolMaster)]

/**
 * Triggered whenever the user changes which layers are selected in a document
 *
 * The action context for this action contains three keys:
 *    document: the document that the change occurred in.
 *    oldSelection: a list of the previously selected layers.
 *    newSelection: a list of the newly selected layers.
 * @param {object} context
 */
export function onSelectionChanged(context) {
  if (isWebviewPresent(WEBVIEW_ID)) {
    const doc = sketch.fromNative(context.actionContext.document)
    const selectedLayers = toArray(context.actionContext.newSelection).map(native => sketch.fromNative(native))

    // If selection is empty (default), then just document & page are active
    let scopes = [Events.kScopeChangeTypeDocument, Events.kScopeChangeTypePage]
    if (selectedLayers.length > 0) {
      scopes.push(Events.kScopeChangeTypeLayer)

      const artboards = selectedLayers.map(layer => {
        return ARTBOARD_LIKE.includes(layer.type) ? layer : layer.getParentArtboard()
      })
      const hasUndef = artboards.some(board => board === undefined)
      if (!hasUndef) {
        // We have just artboards. See if there's only one
        const uniqueBoards = artboards.reduce((accum, next) => {
          const has = accum.findIndex(board => board.id === next.id) !== -1
            if (!has) {
                accum.push(next)
            }
            return accum
        },[])

        // We have some artboards, either one or equal # boards as selected layers
        if (uniqueBoards.length === 1 || uniqueBoards.length === selectedLayers.length) { // && uniqueBoards[0].type !== String(sketch.Types.Artboard)) {
          scopes.push(Events.kScopeChangeTypeArtboard)
          // If only 1 layer is selected
          if (ARTBOARD_LIKE.includes(selectedLayers[0].type)) {
            scopes = scopes.filter(b => b !== Events.kScopeChangeTypeLayer)
          }
        }
      }
    }

    sendToWebview(WEBVIEW_ID, `setActiveScopes("${scopes.join(',')}")`)
  }
}

/**
 * This action is triggered when the contents of a Text Layer change.
 *
 * The action context for this action contains three keys:
 *    old: The old contents of the Text Layer
 *    new: The new contents of the Text Layer
 *    layer: The layer that has changed
 * @param {object} context
 */
export function onTextChanged(context) {
  if (isWebviewPresent(WEBVIEW_ID)) {
    // Only if the contents have changed send the notification
    if (context.actionContext.new !== context.actionContext.old) {
      sendToWebview(WEBVIEW_ID, 'onTextChanged()')
    }
  }
}

export default function() {
  const options = {
    identifier: WEBVIEW_ID,
    width: 420,
    height: 336,
    show: false,
  }

  var browserWindow = new BrowserWindow(options)
  // only show the window when the page has loaded
  browserWindow.once('ready-to-show', () => {
    browserWindow.show()
  })

  const webContents = browserWindow.webContents
  const ts = new Turnstile()
  let currentScope = Events.kScopeChangeTypeDocument

  /**
   * Handles change in scope selection on the browser view
   */
  webContents.on(Events.kEventScopeChange, scopeType => {
    if (currentScope != scopeType) {
      webContents
        .executeJavaScript(`toggleSelectedBtnStyle("${scopeType}")`)
        .catch(console.error)
    }
    currentScope = scopeType
    scanner.markDirty()
  })

  /**
   * Handle changes in text on the document by marking scanner as dirty
   */
  webContents.on(Events.kEventTextChanged, () => {
    scanner.markDirty()
  })

  /**
   *
   */
  webContents.on(Events.kEventButtonPress, (eventType, findText, replaceText) => {
    // Did they choose to cancel
    if (Events.kButtonPressCancel === eventType) {
      browserWindow.close()
      browserWindow = null
      return
    }

    const searchTerm = typeof findText === 'string' ? findText.trim() : null
    // Allow whitespace in replace text
    const replaceWith = replaceText ||  ''
    if (!searchTerm) {
      UI.message('Please enter search text')
      return
    }

    const doc = Document.getSelectedDocument()
    // Determine our source for searching
    let searchArea
    if (currentScope === Events.kScopeChangeTypeDocument) {
      searchArea = doc
    } else if (currentScope === Events.kScopeChangeTypePage) {
      searchArea = doc.selectedPage
    } else if (currentScope === Events.kScopeChangeTypeArtboard) {
      const artboards = doc.selectedLayers.map(layer => {
        return ARTBOARD_LIKE.includes(layer.type) ? layer : layer.getParentArtboard()
      })
      const uniqueBoards = artboards.reduce((accum, next) => {
        const has = accum.findIndex(board => board.id === next.id) !== -1
          if (!has) {
              accum.push(next)
          }
          return accum
      },[])
      searchArea = uniqueBoards
    } else if (currentScope === Events.kScopeChangeTypeLayer) {
      searchArea = doc.selectedLayers
    }

    // Rescan the document if necessary
    const sameTerm = ts.searchTerm === searchTerm
    if (!sameTerm || scanner.isDirty()) {
      try {
        const layers = scanner.findTextLayers(searchArea, searchTerm)
        UI.message(`Found ${layers.length} matching layer${layers.length === 1 ? '' : 's'}`)
        ts.setLayers(layers, searchTerm)
      } catch (e) {
        console.log(e)
      }
    }

    if (eventType === Events.kButtonPressFindNext) {
      const layer = ts.cycleToNextLayer()
      if (layer) {
        doc.centerOnLayer(layer)
      } else {
        UI.message(`Text not found: ${searchTerm}`)
      }
    } else if (eventType === Events.kButtonPressReplace) {
      ts.replaceCurrentLayer(replaceWith)
    } else if (eventType === Events.kButtonPressReplaceAll) {
      const num = ts.numLayers
      ts.replaceAllLayers(replaceWith)
      UI.message(`Replaced text on ${num} layer${num === 1 ? '' : 's'}`)
    }
  })

  browserWindow.loadURL(require('../resources/webview.html'))
}
