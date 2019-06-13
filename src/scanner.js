import sketch from 'sketch';
import { CanvasElement, SymbolOverride, Layer } from './elements';

// All known Sketch object types containing pages or layers properties
const supportedNestedObjectTypes = [
    String(sketch.Types.Document),
    String(sketch.Types.Artboard),
    String(sketch.Types.Page),
    String(sketch.Types.Group),
    String(sketch.Types.SymbolMaster),
]

let dirty = true

function overAndOverAgain(element, term, re) {
    if (!term || term.length === 0) return []
    if (!element) return []
    dirty = false

    const type = element.type
    if (type === String(sketch.Types.Text)) {
        if (element.text.match(new RegExp(re))) {
            return [new CanvasElement(element)]
        }
    }
    else if (type === String(sketch.Types.SymbolInstance)) {
        // Iterate through overrides
        return element.overrides.reduce((accum, next) => {
            if (next.editable && !next.isDefault && typeof next.value === 'string') {
                if (next.value.match(new RegExp(re))) {
                    accum.push(new SymbolOverride(element, next))
                }
            }
            return accum
        },[])
    }
    // White-list of known types with layers for eaze of compatibility reasons
    else if (supportedNestedObjectTypes.includes(type)) {
        const data = element.pages || element.layers
        return data.reduce((accum, datum) => {
            const r = overAndOverAgain(datum, term, re)
            return [...accum, ...r]
        }, [])
    }
    // Collection of selected layers
    else if (element.reduce) {
        return element.reduce((accum, datum) => {
            const r = overAndOverAgain(datum, term, re)
            return [...accum, ...r]
        }, [])
    }

    return []
}


function layerNamesOverAndOverAgain (element, term, re) {
    if (!term || term.length === 0) return []
    if (!element) return []
    dirty = false

    const type = element.type
    let matches = []
    // If this layer matches, hold onto it
    if (element.name && element.name.match(re)) {
        matches.push(new Layer(element))
    }

    // White-list of known types with layers for eaze of compatibility reasons
    if (supportedNestedObjectTypes.includes(type)) {
        const data = element.pages || element.layers
        return data.reduce((accum, datum) => {
            const r = layerNamesOverAndOverAgain(datum, term, re)
            return [...accum, ...r]
        }, matches)
    }
    // Collection of selected layers
    else if (element.reduce) {
        return element.reduce((accum, datum) => {
            const r = layerNamesOverAndOverAgain(datum, term, re)
            return [...accum, ...r]
        }, matches)
    }

    return matches
}


export default {
    /**
     * Marks scan state as dirty
     */
    markDirty: () => { dirty = true },
    /**
     * Returns the dirty state
     */
    isDirty: () => dirty,

    /**
     * Accepts any Sketch object type, scanning all sublayers and returning an array
     * of text layers matching term
     * @param {object} element
     * @param {string} term
     * @param {object} re
     */
    findTextLayers: function(element, term, re, options) {
        const recurse = options.isLayers ? layerNamesOverAndOverAgain : overAndOverAgain
        const results = recurse(element, term, re)
        // If multiple layers were selected we could have dupes
        const unique = results.reduce((accum, next) => {
            const has = accum.findIndex(el => el.raw.id === next.raw.id) !== -1
            if (!has) {
                accum.push(next)
            }
            return accum
        }, [])

        return unique
    }
}
