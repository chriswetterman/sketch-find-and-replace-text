import sketch from 'sketch';
import { Layer, Override } from './turnstile';

// All known Sketch object types containing pages or layers properties
const supportedNestedObjectTypes = [
    String(sketch.Types.Document),
    String(sketch.Types.Artboard),
    String(sketch.Types.Page),
    String(sketch.Types.Group),
    String(sketch.Types.SymbolMaster),
    String(sketch.Types.SymbolInstance),
]

let dirty = true

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
     * @param {object} options
     */
    findTextLayers: function(element, term, options) {

        const exp = options.isWholeWord ? `\\b${term}\\b` : term
        const re = new RegExp(exp, options.isCaseSensitive ? '' : 'i')

        function overAndOverAgain (element, term) {
            if (!term || term.length === 0) return []
            if (!element) return []
            dirty = false

            const type = element.type
            if (type === String(sketch.Types.Text)) {
                if (element.text.match(re)) {
                    return [new Layer(element)]
                }
            }
            else if (type === String(sketch.Types.SymbolInstance)) {
                // Iterate through overrides
                return element.overrides.reduce((accum, next) => {
                    if (next.editable && !next.isDefault && typeof next.value === 'string') {
                        if (next.value.match(re)) {
                            accum.push(new Override(element, next))
                        }
                    }
                    return accum
                },[])
            }
            // White-list of known types with layers for eaze of compatibility reasons
            else if (supportedNestedObjectTypes.includes(type)) {
                const data = element.pages || element.layers
                return data.reduce((accum, datum) => {
                    const r = overAndOverAgain(datum, term)
                    return [...accum, ...r]
                }, [])
            }
            // Collection of selected layers
            else if (element.reduce) {
                return element.reduce((accum, datum) => {
                    const r = overAndOverAgain(datum, term)
                    return [...accum, ...r]
                }, [])
            }

            return []
        }

        const results = overAndOverAgain(element, term)
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
