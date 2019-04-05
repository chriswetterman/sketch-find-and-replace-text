'use strict';

export default class Turnstile {

    constructor() {
        this._layers = []
        this._searchTerm = null
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
     * @param {Layer[]} layers
     * @param {string} term
     */
    setLayers(layers, term) {
        this._layers = Array.isArray(layers) ? layers : []
        this._searchTerm = term ||  null
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
        l.replace(this._searchTerm, rpl)
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

export class Layer {
    constructor(layer) {
        this._layer = layer
    }
    /**
     * Replaces the text layer wherever str is found
     * @param {string} str Search string
     * @param {string} rpl Replacement string
     */
    replace(str, rpl) {
        const t = this._layer.text
        const re = new RegExp(str,'gi')
        this._layer.text = this._layer.text.replace(re, rpl)
    }

    get raw() {
        return this._layer
    }
}

export class Override {
    constructor(override) {
        this._override = override
    }
    /**
     * Replaces the text layer wherever str is found
     * @param {string} str Search string
     * @param {string} rpl Replacement string
     */
    replace(str, rpl) {
        const t = this._override.value
        const re = new RegExp(str,'gi')
        this._override.value = this._override.value.replace(re, rpl)
    }

    get raw() {
        return this._override.affectedLayer
    }
}
