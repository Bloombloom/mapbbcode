/*
 * Map panel that displays BBCode. See show() method and options.
 * Localization is in 'strings/*.js' files.
 */
window.MapBBCode = L.Class.extend({
    options: {
        createLayers: function() { return ['OSM']; },
        maxInitialZoom: 15,
        defaultPosition: [22, 11],
        defaultZoom: 2,
        lineColors: {
            def: '#0022dd',
            blue: '#0022dd',
            red: '#bb0000',
            green: '#007700',
            black: '#000000'
        },
        polygonOpacity: 0.1,

        editorHeight: '400px',
        viewWidth: '600px',
        viewHeight: '300px',
        fullViewHeight: '600px',
        fullScreenButton: true,
        fullFromStart: false,
        windowWidth: 0,
        windowHeight: 0,

        windowFeatures: 'resizable,status,dialog',
        libPath: 'lib/',
        outerLinkTemplate: false, // 'http://openstreetmap.org/#map={zoom}/{lat}/{lon}',
        showHelp: true,
        allowedHTML: '[auib]|span|br|em|strong|tt',
        letterIcons: true,
        enablePolygons: true
    },

    strings: {},

    initialize: function( options ) {
        L.setOptions(this, options);
    },

    setStrings: function( strings ) {
        this.strings = L.extend({}, this.strings, strings);
    },

    _zoomToLayer: function( map, layer, stored, initial ) {
        var bounds = layer.getBounds();
        if( !bounds || !bounds.isValid() ) {
            if( stored && stored.zoom )
                map.setView(stored.pos || this.options.defaultPosition, stored.zoom);
            else if( initial )
                map.setView(this.options.defaultPosition, this.options.defaultZoom);
            return;
        }

        var applyZoom = function() {
            if( stored && stored.pos ) {
                map.setView(stored.pos, stored.zoom || this.options.maxInitialZoom);
            } else {
                var maxZoom = this.options.maxInitialZoom;
                map.fitBounds(bounds, { animate: false });
                if( stored && stored.zoom )
                    map.setZoom(stored.zoom, { animate: false });
                else if( initial && map.getZoom() > maxZoom )
                    map.setZoom(maxZoom, { animate: false });
            }
        };

        var boundsZoom = map.getBoundsZoom(bounds, false);
        if( boundsZoom )
            applyZoom.call(this);
        else
            map.on('load', applyZoom, this);
    },

    _objectToLayer: function( obj ) {
        var colors = this.options.lineColors,
            color = obj.params.length > 0 && obj.params[0] in colors ? colors[obj.params[0]] : colors.def,
            m;
            
        if( obj.coords.length == 1 ) {
            m = L.marker(obj.coords[0]);
        } else if( obj.coords.length > 2 && obj.coords[0].equals(obj.coords[obj.coords.length-1]) ) {
            obj.coords.splice(obj.coords.length - 1, 1);
            m = L.polygon(obj.coords, { color: color, weight: 3, opacity: 0.7, fill: true, fillColor: color, fillOpacity: this.options.polygonOpacity });
        } else {
            m = L.polyline(obj.coords, { color: color, weight: 5, opacity: 0.7 });
        }
        
        if( obj.text ) {
            m._text = obj.text;
            if( L.LetterIcon && m instanceof L.Marker && this.options.letterIcons && obj.text.length >= 1 && obj.text.length <= 2 ) {
                m.setIcon(new L.LetterIcon(obj.text));
                m.options.clickable = false;
            } else {
                m.bindPopup(obj.text.replace(new RegExp('<(?!/?(' + this.options.allowedHTML + ')[ >])', 'g')), '&lt;');
            }
        } else
            m.options.clickable = false;
            
        m._objParams = obj.params;
        return m;
    },

    createOpenStreetMapLayer: function() {
        return L.tileLayer('http://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            name: 'OpenStreetMap',
            attribution: 'Map &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
            minZoom: 2,
            maxZoom: 18
        });
    },

    _addLayers: function( map ) {
        var layers = this.options.createLayers ? this.options.createLayers.call(this) : null;
        if( !layers || !layers.length )
            layers = [this.createOpenStreetMapLayer()];
        for( var i = 0; i < layers.length; i++ )
            if( layers[i] === 'OSM' )
                layers[i] = this.createOpenStreetMapLayer();
        map.addLayer(layers[0]);
        
        if( layers.length > 1 ) {
            var control = L.control.layers();
            for( var i = 0; i < layers.length; i++ )
                control.addBaseLayer(layers[i], layers[i].options.name);
            map.addControl(control);
        }
    },

    // Create map panel, parse and display bbcode (it can be skipped: so it's an attribute or contents of element)
    show: function( element, bbcode ) {
        var el = typeof element === 'string' ? document.getElementById(element) : element;
        if( !el ) return;
        if( !bbcode )
            bbcode = el.getAttribute('bbcode') || el.innerHTML.replace(/^\s+|\s+$/g, '');
        if( !bbcode ) return;
        while( el.firstChild )
            el.removeChild(el.firstChild);
        var mapDiv = el.ownerDocument.createElement('div');
        mapDiv.style.width = this.options.fullFromStart ? '100%' : this.options.viewWidth;
        mapDiv.style.height = this.options.fullFromStart ? this.options.fullViewHeight : this.options.viewHeight;
        el.appendChild(mapDiv);

        var map = L.map(mapDiv, { scrollWheelZoom: false, zoomControl: false });
        map.addControl(new L.Control.Zoom({ zoomInTitle: this.strings.zoomInTitle, zoomOutTitle: this.strings.zoomOutTitle }));
        this._addLayers(map);

        var drawn = new L.FeatureGroup();
        drawn.addTo(map);
        var data = window.MapBBCodeProcessor.stringToObjects(bbcode), objs = data.objs;
        for( var i = 0; i < objs.length; i++ )
            this._objectToLayer(objs[i]).addTo(drawn);
        this._zoomToLayer(map, drawn, { zoom: data.zoom, pos: data.pos }, true);

        if( this.options.fullScreenButton && !this.options.fullFromStart ) {
            var fs = new L.Fullscreen({ height: this.options.fullViewHeight, title: this.strings.fullScreenTitle });
            map.addControl(fs);
            fs.on('clicked', function() {
                this._zoomToLayer(map, drawn);
            }, this);
        }

        if( this.options.outerLinkTemplate ) {
            var outer = L.functionButton(window.MapBBCode.buttonsImage, { position: 'topright', bgPos: L.point(52, 0), title: this.strings.outerTitle });
            outer.on('clicked', function() {
                var template = this.options.outerLinkTemplate;
                template = template.replace('{zoom}', map.getZoom()).replace('{lat}', map.getCenter().lat).replace('{lon}', map.getCenter().lng);
                window.open(template, 'mapbbcode_outer');
            }, this);
            map.addControl(outer);
        }
    }
});
