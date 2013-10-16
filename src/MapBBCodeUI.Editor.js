/*
 * Map BBCode Editor, extends bbcode display module.
 * See editor() and editorWindow() methods.
 */
window.MapBBCode.include({
    _layerToObject: function( layer ) {
        var obj = {};
        if( layer instanceof L.Marker ) {
            obj.coords = [layer.getLatLng()];
        } else {
            obj.coords = layer.getLatLngs();
            if( layer instanceof L.Polygon )
                obj.coords.push(obj.coords[0]);
        }

        obj.params = layer._objParams || [];
        this._eachParamHandler(function(handler) {
            if( handler.text ) {
                var text = handler.layerToObject(layer, '', this);
                if( text )
                    obj.text = text;
            } else {
                // remove relevant params
                var lastParams = [], j;
                for( j = obj.params.length - 1; j >= 0; j-- )
                    if( handler.reKeys.test(obj.params[j]) )
                        lastParams.unshift(obj.params.splice(j, 1));
                var p = handler.layerToObject(layer, lastParams, this);
                if( p && p.length > 0 ) {
                    for( j = 0; j < p.length; j++ )
                        obj.params.push(p[j]);
                }
            }
        }, this, layer);
        return obj;
    },

    _makeEditable: function( layer, drawn ) {
        var buttonDiv = document.createElement('div');
        buttonDiv.style.textAlign = 'center';
        buttonDiv.style.clear = 'both';
        var closeButton = document.createElement('input');
        closeButton.type = 'button';
        closeButton.value = this.strings.close;
        closeButton.onclick = function() {
            layer.closePopup();
        };
        buttonDiv.appendChild(closeButton);
        if( drawn ) {
            var deleteButton = document.createElement('input');
            deleteButton.type = 'button';
            deleteButton.value = this.strings.remove;
            deleteButton.onclick = function() {
                layer.closePopup();
                drawn.removeLayer(layer);
            };
            buttonDiv.appendChild(deleteButton);
        }
        var parentDiv = document.createElement('div');
        layer.options.clickable = true;
        if( layer instanceof L.Polyline || layer instanceof L.Polygon )
            layer.editing.enable();

        this._eachParamHandler(function(handler) {
            var div = handler.createEditorPanel ? handler.createEditorPanel(layer, this) : null;
            if( div )
                parentDiv.appendChild(div);
        }, this, layer);

        parentDiv.appendChild(buttonDiv);
        layer.bindPopup(parentDiv);
        return layer;
    },

    _findMapInTextArea: function( textarea ) {
        var pos = textarea.selectionStart,
            value = textarea.value;
        if( pos >= value.length || value.length < 10 || value.indexOf('[/map]') < 0 )
            return '';
        // check if cursor is inside a map
        var start = value.lastIndexOf('[map', pos);
        if( start >= 0 ) {
            var end = value.indexOf('[/map]', start);
            if( end + 5 >= pos ) {
                var mapPart = value.substring(start, end + 6);
                if( window.MapBBCodeProcessor.isValid(mapPart) )
                    return mapPart;
            }
        }
        return '';
    },

    _updateMapInTextArea: function( textarea, oldCode, newCode ) {
        var pos = textarea.selectionStart,
            value = textarea.value;
        if( oldCode.length && value.indexOf(oldCode) >= 0 )
            textarea.value = value.replace(oldCode, newCode);
        else if( pos >= value.length )
            textarea.value = value + newCode;
        else {
            textarea.value = value.substring(0, pos) + newCode + value.substring(pos);
        }
    },

    // Show editor in element. BBcode can be textarea element. Callback is always called, null parameter means cancel
    editor: function( element, bbcode, callback, context ) {
        var el = typeof element === 'string' ? document.getElementById(element) : element;
        if( !el ) return;
        while( el.firstChild )
            el.removeChild(el.firstChild);
        var mapDiv = el.ownerDocument.createElement('div');
        mapDiv.style.height = this._px(this.options.editorHeight);
        el.appendChild(mapDiv);

        var map = L.map(mapDiv, L.extend({}, { zoomControl: false }, this.options.leafletOptions));
        map.addControl(new L.Control.Zoom({ zoomInTitle: this.strings.zoomInTitle, zoomOutTitle: this.strings.zoomOutTitle }));
        if( L.Control.Search )
            map.addControl(new L.Control.Search());
        this._addLayers(map);

        var drawn = new L.FeatureGroup();
        drawn.addTo(map);

        var textArea;
        if( typeof bbcode !== 'string' ) {
            textArea = bbcode;
            bbcode = this._findMapInTextArea(textArea);
        }
        var data = window.MapBBCodeProcessor.stringToObjects(bbcode), objs = data.objs;
        for( var i = 0; i < objs.length; i++ )
            this._makeEditable(this._objectToLayer(objs[i]).addTo(drawn), drawn);
        this._zoomToLayer(map, drawn, { zoom: data.zoom, pos: data.pos }, true);

        // now is the time to update leaflet.draw strings
        L.drawLocal.draw.toolbar.actions.text = this.strings.cancel;
        L.drawLocal.draw.toolbar.actions.title = this.strings.drawCancelTitle;
        L.drawLocal.draw.toolbar.buttons.polyline = this.strings.polylineTitle;
        L.drawLocal.draw.toolbar.buttons.polygon = this.strings.polygonTitle;
        L.drawLocal.draw.toolbar.buttons.marker = this.strings.markerTitle;
        L.drawLocal.draw.handlers.marker.tooltip.start = this.strings.markerTooltip;
        L.drawLocal.draw.handlers.polyline.tooltip.start = this.strings.polylineStartTooltip;
        L.drawLocal.draw.handlers.polyline.tooltip.cont = this.strings.polylineContinueTooltip;
        L.drawLocal.draw.handlers.polyline.tooltip.end = this.strings.polylineEndTooltip;
        L.drawLocal.draw.handlers.polygon.tooltip.start = this.strings.polygonStartTooltip;
        L.drawLocal.draw.handlers.polygon.tooltip.cont = this.strings.polygonContinueTooltip;
        L.drawLocal.draw.handlers.polygon.tooltip.end = this.strings.polygonEndTooltip;

        var drawControl = new L.Control.Draw({
            position: 'topleft',
            draw: {
                marker: true,
                polyline: {
                    showLength: false,
                    guidelineDistance: 10,
                    shapeOptions: {
                        color: '#000000',
                        weight: 5,
                        opacity: 0.7
                    }
                },
                polygon: this.options.enablePolygons ? {
                    showArea: false,
                    guidelineDistance: 10,
                    shapeOptions: {
                        color: '#000000',
                        weight: 3,
                        opacity: 0.7,
                        fillOpacity: this.options.polygonOpacity
                    }
                } : false,
                rectangle: false,
                circle: false
            },
            edit: {
                featureGroup: drawn,
                edit: false,
                remove: false
            }
        });
        this._eachParamHandler(function(handler) {
            if( handler.initDrawControl )
                handler.initDrawControl(drawControl);
        });
        map.addControl(drawControl);
        map.on('draw:created', function(e) {
            var layer = e.layer;
            this._eachParamHandler(function(handler) {
                if( handler.initLayer )
                    handler.initLayer(layer);
            }, this, layer);
            this._makeEditable(layer, drawn);
            drawn.addLayer(layer);
            if( e.layerType === 'marker' )
                layer.openPopup();
        }, this);

        if( this.options.editorCloseButtons ) {
            var apply = L.functionButton('<b>'+this.strings.apply+'</b>', { position: 'topleft', title: this.strings.applyTitle });
            apply.on('clicked', function() {
                var objs = [];
                drawn.eachLayer(function(layer) {
                    objs.push(this._layerToObject(layer));
                }, this);
                el.removeChild(el.firstChild);
                var newCode = window.MapBBCodeProcessor.objectsToString({ objs: objs, zoom: objs.length ? 0 : map.getZoom(), pos: objs.length ? 0 : map.getCenter() });
                if( textArea )
                    this._updateMapInTextArea(textArea, bbcode, newCode);
                if( callback )
                    callback.call(context, newCode);
            }, this);
            map.addControl(apply);

            var cancel = L.functionButton(this.strings.cancel, { position: 'topright', title: this.strings.cancelTitle });
            cancel.on('clicked', function() {
                el.removeChild(el.firstChild);
                if( callback )
                    callback.call(context, null);
            }, this);
            map.addControl(cancel);
        }

        if( this.options.showHelp ) {
            var help = L.functionButton('<span style="font-size: 18px; font-weight: bold;">?</span>', { position: 'topright', title: this.strings.helpTitle });
            help.on('clicked', function() {
                var str = '',
                    help = this.strings.helpContents,
                    features = 'resizable,dialog,scrollbars,height=' + this.options.windowHeight + ',width=' + this.options.windowWidth;
                var win = window.open('', 'mapbbcode_help', features);
                for( var i = 0; i < help.length; i++ ) {
                    str += !i ? '<h1>'+help[0]+'</h1>' : help[i].substr(0, 1) === '#' ? '<h2>'+help[i].replace(/^#\s*/, '')+'</h2>' : '<p>'+help[i]+'</p>';
                }
                str += '<div id="close"><input type="button" value="' + this.strings.close + '" onclick="javascript:window.close();"></div>';
                var css = '<style>body { font-family: sans-serif; font-size: 12pt; } p { line-height: 1.5; } h1 { text-align: center; font-size: 18pt; } h2 { font-size: 14pt; } #close { text-align: center; margin-top: 1em; }</style>';
                win.document.open();
                win.document.write(css);
                win.document.write(str);
                win.document.close();
            }, this);
            map.addControl(help);
        }
        
        return {
            _ui: this,
            map: map,
            close: function() {
                var finalCode = this.getBBCode();
                this.map = null;
                this._ui = null;
                this.getBBCode = function() { return finalCode; };
                el.removeChild(el.firstChild);
            },
            getBBCode: function() {
                var objs = [];
                drawn.eachLayer(function(layer) {
                    objs.push(this._layerToObject(layer));
                }, this._ui);
                return window.MapBBCodeProcessor.objectsToString({ objs: objs, zoom: objs.length ? 0 : map.getZoom(), pos: objs.length ? 0 : map.getCenter() });
            }
        };
    },

    // Opens editor window. Requires options.labPath to be correct
    editorWindow: function( bbcode, callback, context ) {
        window.storedMapBB = {
            bbcode: bbcode,
            callback: callback,
            context: context,
            caller: this
        };

        var features = this.options.windowFeatures,
            featSize = 'height=' + this.options.windowHeight + ',width=' + this.options.windowWidth,
            basePath = location.href.match(/^(.+\/)([^\/]+)?$/)[1],
            libUrl = basePath + this.options.libPath,
            win = window.open(this.options.usePreparedWindow ? (typeof this.options.usePreparedWindow === 'string' ? this.options.usePreparedWindow : libUrl + 'mapbbcode-window.html') : '', 'mapbbcode_editor', features + ',' + featSize);

        if( !this.options.usePreparedWindow ) {
            var content = '<script src="' + libUrl + 'leaflet.js"></script>';
            content += '<script src="' + libUrl + 'leaflet.draw.js"></script>';
            content += '<script src="' + libUrl + 'mapbbcode.js"></script>';
            content += '<script src="' + libUrl + 'mapbbcode-config.js"></script>'; // yes, this is a stretch
            content += '<link rel="stylesheet" href="' + libUrl + 'leaflet.css" />';
            content += '<link rel="stylesheet" href="' + libUrl + 'leaflet.draw.css" />';
            content += '<div id="edit"></div>';
            content += '<script>opener.storedMapBB.caller.editorWindowCallback.call(opener.storedMapBB.caller, window, opener.storedMapBB);</script>';
            win.document.open();
            win.document.write(content);
            win.document.close();
        }
    },

    editorWindowCallback: function( w, ctx ) {
        w.document.body.style.margin = 0;
        var anotherMapBB = new w.MapBBCode(this.options);
        anotherMapBB.setStrings(this.strings);
        anotherMapBB.options.editorHeight = '100%';
        anotherMapBB.editor('edit', ctx.bbcode, function(res) {
            w.close();
            if( ctx.callback )
                ctx.callback.call(ctx.context, res);
            this.storedMapBB = null;
        }, this);
    }
});
