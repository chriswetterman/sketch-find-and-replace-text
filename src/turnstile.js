'use strict';

export default class Turnstile {

    constructor() {
        this._layers = []
        this._searchTerm = null
        this._re = new RegExp()
    }

    /**
     * Returns the term used with the current set of Layers
     */
    get searchTerm() { return this._searchTerm }

    /**
     * Returns the number of Layers matching the search term
     */
    get numLayers() { return this._layers.length }

    /**
     * Sets the Layers on the turnstile
     * @param {CanvasElement[]} layers
     * @param {string} term
     * @param {Object} re
     */
    setLayers(layers, term, re) {
        this._layers = Array.isArray(layers) ? layers : []
        this._searchTerm = term ||  null
        this._re = re
    }

    /**
     * Cycles through the matching layers, one by one
     */
    cycleToNextLayer() {
        if (this._layers.length > 0) {
            const l = this._layers.shift()
            this._layers.push(l)
            return l.raw
        }
        return null
    }

    /**
     * Replaces the the active layer with replacement string
     * @param {string} rpl
     */
    replaceCurrentLayer(rpl) {
        if (this._layers.length === 0) {
            return
        }

        const l = this._layers.pop()
        l.text = l.text.replace(this._re, rpl)
    }

    /**
     * Replaces all layers matching the replacement string
     * @param {string} rpl
     */
    replaceAllLayers(rpl) {
        while(this._layers.length > 0) {
            this.replaceCurrentLayer(rpl)
        }
    }
}
