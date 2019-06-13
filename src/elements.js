class AbstractElement {
    constructor(element) {
        this._element = element
    }

    /**
     * Sets the text of the element
     */
    set text(str) {
        // Implementation provided by subclass
    }

    /**
     * Gets the text of the element
     */
    get text() {
        // Implementation provided by subclass
        return null
    }

     /**
     * Gets the raw Sketch object backed by Layer
     */
    get raw() {
        return this._element
    }
}

export class CanvasElement extends AbstractElement {
    /**
     * Sets the text of the element
     */
    set text(str) {
        this._element.text = str
    }

    /**
     * Gets the text of the element
     */
    get text() {
        return this._element.text
    }
}

export class Layer extends CanvasElement {

    set text(str) {
        this._element.name = str
    }

    get text() {
        return this._element.name
    }
}

export class SymbolOverride extends CanvasElement {
    constructor(element, override) {
        super(element)
        this._override = override
    }

    set text(str) {
        this._override.value = str
    }

    get text() {
        return this._override.value
    }
}
