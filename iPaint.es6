/**
 * IPaint Draw
 *
 * @author          xiaoxin
 * @date            Created on 17-7-20.
 * @description     Applicable to image graffiti operation
 */

class IPaint {
    constructor(options) {
        // Enforces the context for all functions
        for (let key in this.constructor.prototype) {
            this[key] = this[key].bind(this);
        }

        // Warn the user if no DOM element was selected
        if (!options.hasOwnProperty('canvas')) throw new Error('Miss Parameters (canvas)');

        if (typeof options.canvas === 'string') {
            options.canvas = document.querySelector(options.canvas); // root canvas
        }

        this.canvas = options.canvas;
        this.isOpenPaint = options.isOpenPaint || this.canvas.getAttribute('data-open-paint') || false;

        // Width can be defined on the HTML or programatically
        this._width = options.width || this.canvas.getAttribute('data-width') || 0;
        this._height = options.height || this.canvas.getAttribute('data-height') || 0;

        this.type = options.type || this.canvas.getAttribute('data-type') || 'pick';

        // Pen attributes
        this.color = options.color || this.canvas.getAttribute('data-color') || '#f00000';
        this.penSize = options.penSize || this.canvas.getAttribute('data-penSize') || 5;

        this.zoom = options.zoom || this.canvas.getAttribute('data-zoom') || 100;

        // ReadOnly IPaints may not be modified
        this.readOnly = options.readOnly || this.canvas.getAttribute('data-readOnly') || false;
        if (!this.readOnly) this.canvas.style.cursor = 'pointer';


        // Stroke control letiables
        this.strokes = options.strokes || [];

        // Text control letiables
        this.textes = options.textes || [];
        this._currentStroke = {
            color: null,
            size: null,
            lines: [],
        };

        // Undo History
        this.undoHistory = options.undoHistory || [];

        // Animation function calls
        this.animateIds = [];

        // Set sketching state
        this._sketching = false;

        // Setup canvas ipaint listeners
        this.reset();
    }

    /**
     * 获取任意元素的offsetLeft/offsetTop值
     * @param curEle
     * @returns {{left: *, top: *}}
     */
    offset(curEle) {
        let totalLeft = null, totalTop = null, par = curEle.offsetParent;
        totalLeft += curEle.offsetLeft;
        totalTop += curEle.offsetTop;
        while (par) {
            if (navigator.userAgent.indexOf("MSIE 8.0") === -1) {
                totalLeft += par.clientLeft;
                totalTop += par.clientTop;
            }
            totalLeft += par.offsetLeft;
            totalTop += par.offsetTop;
            par = par.offsetParent;
        }
        return {
            left: totalLeft,
            top: totalTop
        }
    }


    // Private API
    _cursorPosition(event) {
        let _this;
        _this = this;

        let zoom = _this.zoom / 100;
        return {
            x: (event.pageX - _this.offset(this.canvas).left) / zoom,
            y: (event.pageY - _this.offset(this.canvas).top) / zoom
        }
    }

    _draw(start, end, color, size) {
        this._stroke(start, end, color, size, 'source-over');
    }

    _fill(color, size, content,x,y) {
        this._text(color, size, content,x,y);
    }

    _erase(start, end, color, size) {
        this._stroke(start, end, color, size, 'destination-out');
    }

    _stroke(start, end, color, size, compositeOperation) {
        this.context.save();
        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';
        this.context.strokeStyle = color;
        this.context.lineWidth = size;
        this.context.globalCompositeOperation = compositeOperation;
        this.context.beginPath();
        this.context.moveTo(start.x, start.y);
        this.context.lineTo(end.x, end.y);
        this.context.closePath();
        this.context.stroke();
        this.context.restore();
    }

    _text(color, size, content, x, y) {
        this.context.fillStyle = color;
        this.context.font = `${size}px Arial`;
        this.context.fillText(content, x, y);
    }

    /**
     * Mouse down handlers
     * @param event
     * @private
     */
    _mouseDown(event) {
        if (event.which === 1) {
            event = event || window.event;
            if (event.preventDefault) event.preventDefault();
            event.returnValue = false;

            this._lastPosition = this._cursorPosition(event);
            this._currentStroke.color = this.color;
            this._currentStroke.size = this.penSize;
            this._currentStroke.lines = [];
            this._sketching = true;

            if (this.isOpenPaint) {
                switch (this.type) {
                    case 'pick':
                        break;
                    case 'pen':
                        this.canvas.addEventListener('mousemove', this._mouseMove);
                        break;
                    case 'text':
                        let zoom = this.zoom / 100;
                        console.log(this._lastPosition.x);
                        console.log(zoom);

                        if(typeof viewApp !== 'undefined'){
                            viewApp.createTextDialog(this._lastPosition.x,this._lastPosition.y);
                        }

                        if(typeof manageApp !== 'undefined'){
                            manageApp.createTextDialog(this._lastPosition.x,this._lastPosition.y);
                        }
                    /*this.context.font = "20px Courier New";
                     this.context.fillStyle = "blue";
                     this.context.fillText(this.fontCon, this._lastPosition.x, this._lastPosition.y);*/
                    /*let textarea = document.createElement('textarea');
                     textarea.style.width = '255px';
                     textarea.style.position = 'absolute';
                     textarea.style.fontSize = '20px';
                     textarea.style.fontFamily = 'Arial';
                     textarea.style.overflow = 'auto';
                     textarea.style.fontWeight = 'normal';
                     textarea.style.padding = '0px';
                     textarea.style.color = 'rgb(0, 0, 0)';
                     textarea.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                     textarea.style.zIndex = '2';
                     textarea.style.left = this._lastPosition.x * zoom + 'px';
                     textarea.style.top = this._lastPosition.y * zoom + document.querySelector('#iPaintCanvas').offsetTop + 'px';
                     textarea.style.height = '46px';
                     textarea.id = 'textAreaBox';
                     textarea.classList.add('form-control');

                     console.log(this._lastPosition.y * zoom)

                     if (!document.querySelectorAll('#textAreaBox').length > 0) {
                     document.querySelector('#viewElement').appendChild(textarea);
                     }*/

                    // this.context.font = "10px Courier New";
                    // this.context.fillStyle = "blue";
                    // this.context.fillText("CodePlayer+中文测试", this._lastPosition.x, this._lastPosition.y);

                }

            }
        }
    }

    /**
     * Mouse up handlers
     * @param event
     * @private
     */
    _mouseUp(event) {
        if (this._sketching) {
            this.strokes.push($.extend(true, {}, this._currentStroke));
            this._sketching = false;
        }

        this.canvas.removeEventListener('mousemove', this._mouseMove);
    }

    /**
     * Mouse move handlers
     * @param event
     * @private
     */
    _mouseMove(event) {
        let currentPosition = this._cursorPosition(event);
        switch (this.type) {
            case 'pen':
                this._draw(this._lastPosition, currentPosition, this.color, this.penSize);
                break;
            case 'eraser':
                this.context.clearRect(currentPosition.x - 5, currentPosition.y - 5, 20, 20);
        }

        this._currentStroke.lines.push({
            id: new Date().getTime(),
            start: $.extend(true, {}, this._lastPosition),
            end: $.extend(true, {}, currentPosition),
        });

        this._lastPosition = currentPosition;
    }

    // drawArc(context, x, y, radius, startRad, endRad, anticlockwise, color) {
    //     context.beginPath();
    //     context.fillStyle = color || '#000000';
    //     context.arc(x, y, radius, startRad, endRad, anticlockwise);
    //     context.fill();
    //     context.closePath();
    // }

    /**
     * Touch start handlers
     * @param event
     * @private
     */
    _touchStart(event) {
        event.preventDefault();
        if (this._sketching) {
            return;
        }
        this._lastPosition = this._cursorPosition(event.changedTouches[0]);
        this._currentStroke.color = this.color;
        this._currentStroke.size = this.penSize;
        this._currentStroke.lines = [];
        this._sketching = true;

        if (this.isOpenPaint) {
            switch (this.type) {
                case 'pick':
                    break;
                case 'pen':
                    this.canvas.addEventListener('touchmove', this._touchMove, false);
                    break;
                case 'text':
                    let zoom = this.zoom / 100;

                    if(router.currentRoute.path == '/pic-manages/view-second-detail'){
                        app.$children[0].$children[0].createTextDialog(this._lastPosition.x,this._lastPosition.y)
                    }

                    if(router.currentRoute.path == '/pic-manages/view-detail'){
                        app.$children[0].$children[0].createTextDialog(this._lastPosition.x,this._lastPosition.y)
                    }
                    /*viewApp.paint.x = this._lastPosition.x;
                    viewApp.paint.y = this._lastPosition.y;
                    viewApp.createTextDialog();*/
                    /*let zoom = this.zoom / 100;
                    let textarea = document.createElement('textarea');
                    textarea.style.width = '255px';
                    textarea.style.position = 'absolute';
                    textarea.style.fontSize = '20px';
                    textarea.style.fontFamily = 'Arial';
                    textarea.style.overflow = 'auto';
                    textarea.style.fontWeight = 'normal';
                    textarea.style.padding = '0px';
                    textarea.style.border = '1px solid rgb(136, 136, 136)';
                    textarea.style.color = 'rgb(0, 0, 0)';
                    textarea.style.backgroundColor = 'rgba(0, 0, 0, 0)';
                    textarea.style.zIndex = '2';
                    textarea.style.left = this._lastPosition.x * zoom + 'px';
                    textarea.style.top = this._lastPosition.y * zoom + 'px';
                    textarea.style.height = '46px';
                    textarea.id = 'textareaElem';
                    document.querySelector('#viewElement').appendChild(textarea);*/
            }
        }
    }

    /**
     * Touch end handlers
     * @param event
     * @private
     */
    _touchEnd(event) {
        event.preventDefault();
        if (this._sketching) {
            this.strokes.push($.extend(true, {}, this._currentStroke));
            this._sketching = false;
        }
        this.canvas.removeEventListener('touchmove', this._touchMove);
    }

    /**
     * Touch cancel handlers
     * @param event
     * @private
     */
    _touchCancel(event) {
        event.preventDefault();
        if (this._sketching) {
            this.strokes.push($.extend(true, {}, this._currentStroke));
            this._sketching = false;
        }
        this.canvas.removeEventListener('touchmove', this._touchMove);
    }

    /**
     * Touch leave handlers
     * @param event
     * @private
     */
    _touchLeave(event) {
        event.preventDefault();
        if (this._sketching) {
            this.strokes.push($.extend(true, {}, this._currentStroke));
            this._sketching = false;
        }
        this.canvas.removeEventListener('touchmove', this._touchMove);
    }

    /**
     * Touch move handlers
     * @param event
     * @private
     */
    _touchMove(event) {
        event.preventDefault();
        let currentPosition = this._cursorPosition(event.changedTouches[0]);

        this._draw(this._lastPosition, currentPosition, this.color, this.penSize);
        this._currentStroke.lines.push({
            start: $.extend(true, {}, this._lastPosition),
            end: $.extend(true, {}, currentPosition),
        });

        this._lastPosition = currentPosition;
    }

    /**
     * Reset and Init render
     */
    reset() {
        // Set attributes
        let _this;
        _this = this;
        this.canvas['width'] = this._width;
        this.canvas['height'] = this._height;
        this.context = this.canvas.getContext('2d');

        // Setup event listeners
        this.redraw(this.strokes, this.textes);

        if (this.readOnly) return;

        let _zwibblerToolbar = document.querySelector('#zwibbler-toolbar');
        if (_zwibblerToolbar) {
            let _zwibblerButton = _zwibblerToolbar.querySelectorAll('.zwibbler-button');
            for (let i = 0; i < _zwibblerButton.length; i++) {
                _zwibblerButton[i].addEventListener('click', function () {
                    for (let j = 0; j < _zwibblerButton.length; j++) _zwibblerButton[j].classList.remove('zwibbler-selected');
                    this.classList.add('zwibbler-selected');
                    _this.type = this.getAttribute('data-type');
                    switch (_this.type) {
                        case 'undo':
                            _this.undo();
                            break;
                        case 'redo':
                            _this.redo();
                            break;
                    }
                })
            }
        }


        // Mouse
        this.canvas.addEventListener('mousedown', this._mouseDown);
        this.canvas.addEventListener('mouseout', this._mouseUp);
        this.canvas.addEventListener('mouseup', this._mouseUp);

        // Touch
        this.canvas.addEventListener('touchstart', this._touchStart);
        this.canvas.addEventListener('touchend', this._touchEnd);
        this.canvas.addEventListener('touchcancel', this._touchCancel);
        this.canvas.addEventListener('touchleave', this._touchLeave);
    }

    /**
     * Draw stroke
     * @param stroke
     */
    drawStroke(stroke) {
        for (let j = 0, len = stroke.lines.length; j < len; j++) {
            let line = stroke.lines[j];
            this._draw(line.start, line.end, stroke.color, stroke.size);
        }
    }

    /**
     * Draw text
     * @param color
     * @param size
     * @param content
     */
    drawText(color, size, content,x,y) {
        this._fill(color, size, content,x,y);
    }

    /**
     * Reset draw
     * @param strokes
     * @param textes
     */
    redraw(strokes, textes) {
        for (let i = 0, len = strokes.length; i < len; i++) {
            this.drawStroke(strokes[i]);
        }
        for (let j = 0, len = textes.length; j < len; j++) {
            this.drawText(textes[j].color, textes[j].size, textes[j].content,textes[j].x,textes[j].y);
        }
    }

    /**
     * ToObject
     * @returns {{width, height, strokes: (*|Array), undoHistory: (*|Array)}}
     */
    toObject() {
        return {
            width: this.canvas.width,
            height: this.canvas.height,
            strokes: this.strokes,
            textes: this.textes,
            undoHistory: this.undoHistory,
        };
    }

    /**
     * ToJson
     */
    toJSON() {
        return JSON.stringify(this.toObject());
    }

    /**
     * Create a animation
     * @param ms
     * @param loop
     * @param loopDelay
     */
    animate(ms, loop, loopDelay) {
        this.clear();
        let delay = ms;
        let callback = null;
        for (let i = 0, len = this.strokes.length; i < len; i++) {
            let stroke = this.strokes[i];
            for (let j = 0, len = stroke.lines.length; j < len; j++) {
                let line = stroke.lines[j];
                callback = this._draw.bind(this, line.start, line.end,
                    stroke.color, stroke.size);
                this.animateIds.push(setTimeout(callback, delay));
                delay += ms;
            }
        }
        if (loop) {
            loopDelay = loopDelay || 0;
            callback = this.animate.bind(this, ms, loop, loopDelay);
            this.animateIds.push(setTimeout(callback, delay + loopDelay));
        }
    }

    /**
     * Cancel animation
     */
    cancelAnimation() {
        for (let i = 0; i < this.animateIds.length; i++) {
            clearTimeout(this.animateIds[i]);
        }
    }

    /**
     * Clear draw
     */
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.strokes = [];
        this.textes = [];
        this.undoHistory = [];
    }

    clearDraw() {
        this.clear();
        this.undoHistory = this.strokes;
        this.strokes = [];
    }

    /**
     * Undo action
     */
    undo() {
        this.clear();
        let stroke = this.strokes.pop();
        if (stroke) {
            this.undoHistory.push(stroke);
            this.redraw(this.strokes);
        }
    }

    /**
     * Redo action
     */
    redo() {
        let stroke = this.undoHistory.pop();
        if (stroke) {
            this.strokes.push(stroke);
            this.drawStroke(stroke);
        }
    }

    destroy() {
        const triggerDerive = (ele) => {
            // mouse
            ele.removeEventListener('mousedown', this._mouseDown);
            ele.removeEventListener('mousemove', this._mouseMove);
            ele.removeEventListener('mouseout', this._mouseUp);
            ele.removeEventListener('mouseup', this._mouseUp);

            // touch
            this.canvas.removeEventListener('touchstart', this._touchStart);
            this.canvas.removeEventListener('touchend', this._touchEnd);
            this.canvas.removeEventListener('touchcancel', this._touchCancel);
            this.canvas.removeEventListener('touchleave', this._touchLeave);
        }


        if (this.canvas) {
            this.canvas.remove();
            triggerDerive(this.canvas)
        }
    }
}