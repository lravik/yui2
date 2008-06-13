(function () {

var lang   = YAHOO.lang,
    util   = YAHOO.util,
    widget = YAHOO.widget,
    ua     = YAHOO.env.ua,
    
    Dom    = util.Dom,
    Ev     = util.Event,
    DS     = util.DataSourceBase,
    DT     = widget.DataTable,
    Pag    = widget.Paginator;
    
/**
 * The ScrollingDataTable class extends the DataTable class to provide
 * functionality for x-scrolling, y-scrolling, and xy-scrolling.
 *
 * @namespace YAHOO.widget
 * @class ScrollingDataTable
 * @extends YAHOO.widget.DataTable
 * @constructor
 * @param elContainer {HTMLElement} Container element for the TABLE.
 * @param aColumnDefs {Object[]} Array of object literal Column definitions.
 * @param oDataSource {YAHOO.util.DataSource} DataSource instance.
 * @param oConfigs {object} (optional) Object literal of configuration values.
 */
widget.ScrollingDataTable = function(elContainer,aColumnDefs,oDataSource,oConfigs) {
    oConfigs = oConfigs || {};
    
    // Prevent infinite loop
    if(oConfigs.scrollable) {
        oConfigs.scrollable = false;
    }

    widget.ScrollingDataTable.superclass.constructor.call(this, elContainer,aColumnDefs,oDataSource,oConfigs); 

    this.subscribe("columnShowEvent",this._syncColWidths);
};

var SDT = widget.ScrollingDataTable;

/////////////////////////////////////////////////////////////////////////////
//
// Public constants
//
/////////////////////////////////////////////////////////////////////////////
lang.augmentObject(SDT, {

    /**
     * Class name assigned to inner DataTable header container.
     *
     * @property DataTable.CLASS_HEADER
     * @type String
     * @static
     * @final
     * @default "yui-dt-hd"
     */
    CLASS_HEADER : "yui-dt-hd",
    
    /**
     * Class name assigned to inner DataTable body container.
     *
     * @property DataTable.CLASS_BODY
     * @type String
     * @static
     * @final
     * @default "yui-dt-bd"
     */
    CLASS_BODY : "yui-dt-bd",

    /**
     * Column filler color set in constructor due to Attribute chicken and egg
     * problem. Can be customized via COLOR_COLUMFILLER in initial config or
     * via myDataTable.set().
     *
     * @property DataTable.COLOR_COLUMNFILLER
     * @type String
     * @static
     * @final
     * @default "#F2F2F2"
     */
    COLOR_COLUMNFILLER : "#F2F2F2"
});

lang.extend(SDT, DT, {

/**
 * Container for fixed header TABLE element.
 *
 * @property _elHdContainer
 * @type HTMLElement
 * @private
 */
_elHdContainer : null,

/**
 * Fixed header TABLE element.
 *
 * @property _elHdTable
 * @type HTMLElement
 * @private
 */
_elHdTable : null,

/**
 * Container for scrolling body TABLE element.
 *
 * @property _elBdContainer
 * @type HTMLElement
 * @private
 */
_elBdContainer : null,

/**
 * Body THEAD element.
 *
 * @property _elBdThead
 * @type HTMLElement
 * @private
 */
_elBdThead : null,

/**
 * Offscreen container to temporarily clone SDT for auto-width calculation.
 *
 * @property _elTmpContainer
 * @type HTMLElement
 * @private
 */
_elTmpContainer : null,

/**
 * Offscreen TABLE element for auto-width calculation.
 *
 * @property _elTmpTable
 * @type HTMLElement
 * @private
 */
_elTmpTable : null,

/**
 * True if x-scrollbar is currently visible.
 * @property _bScrollbarX
 * @type Boolean
 * @private 
 */
_bScrollbarX : null,















/////////////////////////////////////////////////////////////////////////////
//
// Superclass methods
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Implementation of Element's abstract method. Sets up config values.
 *
 * @method initAttributes
 * @param oConfigs {Object} (Optional) Object literal definition of configuration values.
 * @private
 */

initAttributes : function(oConfigs) {
    oConfigs = oConfigs || {};
    SDT.superclass.initAttributes.call(this, oConfigs);

    /**
    * @attribute width
    * @description Table width for scrollable tables. Note: When setting width
    * and height at runtime, please set height first.
    * @type String
    */
    this.setAttributeConfig("width", {
        value: null,
        validator: lang.isString,
        method: function(oParam) {
            this._elHdContainer.style.width = oParam;
            this._elBdContainer.style.width = oParam;            
            this._syncScrollX();      
            this._syncScrollOverhang();
            ///TODO: is this nec? force gecko redraw
        }
    });

    /**
    * @attribute height
    * @description Table height for scrollable tables. Note: When setting width
    * and height at runtime, please set height first.    
    * @type String
    */
    this.setAttributeConfig("height", {
        value: null,
        validator: lang.isString,
        method: function(oParam) {
            this._elBdContainer.style.height = oParam;    
            this._syncScrollX();   
            this._syncScrollY();
            this._syncScrollOverhang();
        }
    });

    /**
    * @attribute COLOR_COLUMNFILLER
    * @description CSS color value assigned to header filler on scrollable tables.  
    * @type String
    * @default "#F2F2F2"
    */
    this.setAttributeConfig("COLOR_COLUMNFILLER", {
        value: "#F2F2F2",
        validator: lang.isString,
        method: function(oParam) {
            this._elHdContainer.style.backgroundColor = oParam;
        }
    });
},

/**
 * Initializes DOM elements for a ScrollingDataTable, including creation of
 * two separate TABLE elements.
 *
 * @method _initDomElements
 * @param elContainer {HTMLElement | String} HTML DIV element by reference or ID. 
 * return {Boolean} False in case of error, otherwise true 
 * @private
 */
_initDomElements : function(elContainer) {
    // Outer and inner containers
    this._initContainerEl(elContainer);
    if(this._elContainer && this._elHdContainer && this._elBdContainer) {
        // TABLEs
        this._initTableEl();
        
        if(this._elHdTable && this._elTable) {
            // COLGROUPs
            ///this._initColgroupEl(this._elHdTable, this._elTable);  
            this._initColgroupEl(this._elHdTable);        
            
            // THEADs
            this._initTheadEl(this._elHdTable, this._elTable);
            
            // Primary TBODY
            this._initTbodyEl(this._elTable);
            // Message TBODY
            this._initMsgTbodyEl(this._elTable);
            
            // Tmp elements for auto-width calculation
            this._initTmpEls();
        }
    }
    ///if(!this._elContainer || !this._elTable || !this._elColgroup ||  !this._elThead || !this._elTbody || !this._elMsgTbody ||
            ///!this._elHdTable || !this._elBdColgroup || !this._elBdThead) {
    if(!this._elContainer || !this._elTable || !this._elColgroup ||  !this._elThead || !this._elTbody || !this._elMsgTbody ||
            !this._elHdTable || !this._elBdThead) {
        YAHOO.log("Could not instantiate DataTable due to an invalid DOM elements", "error", this.toString());
        return false;
    }
    else {
        return true;
    }
},

/**
 * Destroy's tmp els used for auto-width calculation.
 *
 * @method _destroyTmpEls
 * @private
 */
_destroyTmpEls : function() {
    var elTmpContainer = this._elTmpContainer;
    if(elTmpContainer) {
        elTmpContainer.parentNode.removeChild(elTmpContainer);
        
        this._elTmpContainer = null;
        this._elTmpTable = null;
    }
},

/**
 * Resets tmp els back to initial state.
 *
 * @method _resetTmpEls
 * @private
 */
_resetTmpEls : function() {
    var elTmpTable = this._elTmpTable;
    if(elTmpTable) {
        elTmpTable.removeChild(elTmpTable.firstChild); // THEAD
        elTmpTable.removeChild(elTmpTable.firstChild); // TBODY
    }
},

/**
 * Initializes tmp els for auto-width calculation
 *
 * @method _initTmpEls
 * @param elContainer {HTMLElement | String} HTML DIV element by reference or ID.
 * @private
 */
_initTmpEls : function() {
    this._destroyTmpEls();

    // Attach tmp container as first child of body
    var elTmpContainer = document.createElement('div');
    elTmpContainer.className = DT.CLASS_DATATABLE + ' ' + DT.CLASS_TMP;
    var elTmpTable = elTmpContainer.appendChild(document.createElement('table'));
    this._elTmpTable = elTmpTable;
    this._elTmpContainer = document.body.insertBefore(elTmpContainer, document.body.firstChild);
},


/**
 * Destroy's the DataTable outer and inner container elements, if available.
 *
 * @method _destroyContainerEl
 * @private
 */
_destroyContainerEl : function() {
    SDT.superclass._destroyContainerEl.call(this);
    this._elHdContainer = null;
    this._elBdContainer = null;
},

/**
 * Initializes the DataTable outer container element and creates inner header
 * and body container elements.
 *
 * @method _initContainerEl
 * @param elContainer {HTMLElement | String} HTML DIV element by reference or ID.
 * @private
 */
_initContainerEl : function(elContainer) {
    SDT.superclass._initContainerEl.call(this, elContainer);
    
    if(this._elContainer) {
        elContainer = this._elContainer; // was constructor input, now is DOM ref
        Dom.addClass(elContainer, DT.CLASS_SCROLLABLE);
        
        // Container for header TABLE
        var elHdContainer = elContainer.appendChild(document.createElement("div"));
        // Since Attribute is not available at this point in the constructor
        elHdContainer.style.backgroundColor = this.get("COLOR_COLUMNFILLER") || SDT.COLOR_COLUMNFILLER;
        Dom.addClass(elHdContainer, SDT.CLASS_HEADER);
        this._elHdContainer = elHdContainer;
    
        // Container for body TABLE
        var elBdContainer = elContainer.appendChild(document.createElement("div"));
        Dom.addClass(elBdContainer, SDT.CLASS_BODY);
        Ev.addListener(elBdContainer, "scroll", this._onScroll, this); // to sync horiz scroll headers
        this._elBdContainer = elBdContainer;
    }
},

/**
 * Destroy's the DataTable head TABLE element, if available.
 *
 * @method _destroyHdTableEl
 * @private
 */
_destroyHdTableEl : function() {
    var elTable = this._elHdTable;
    if(elTable) {
        Ev.purgeElement(elTable, true);
        elTable.parentNode.removeChild(elTable);
        
        // A little out of place, but where else can we null out these extra elements?
        ///this._elBdColgroup = null;
        this._elBdThead = null;
    }
},

/**
 * Initializes ScrollingDataTable TABLE elements into the two inner containers.
 *
 * @method _initTableEl
 * @private
 */
_initTableEl : function() {
    // Head TABLE
    if(this._elHdContainer) {
        this._destroyHdTableEl();
    
        // Create TABLE
        this._elHdTable = this._elHdContainer.appendChild(document.createElement("table"));   
    } 
    // Body TABLE
    SDT.superclass._initTableEl.call(this, this._elBdContainer);
},

/**
 * Initializes ScrollingDataTable THEAD elements into the two inner containers.
 *
 * @method _initTheadEl
 * @param elHdTable {HTMLElement} (optional) Fixed header TABLE element reference.
 * @param elTable {HTMLElement} (optional) TABLE element reference.
 * @private
 */
_initTheadEl : function(elHdTable, elTable) {
    elHdTable = elHdTable || this._elHdTable;
    elTable = elTable || this._elTable;
    
    // Scrolling body's THEAD
    this._initBdTheadEl(elTable);
    // Standard fixed head THEAD
    SDT.superclass._initTheadEl.call(this, elHdTable);
},

/**
 * SDT changes ID so as not to duplicate the accessibility TH IDs.
 *
 * @method _initThEl
 * @param elTh {HTMLElement} TH element reference.
 * @param oColumn {YAHOO.widget.Column} Column object.
 * @private
 */
_initThEl : function(elTh, oColumn) {
    SDT.superclass._initThEl.call(this, elTh, oColumn);
    elTh.id = this.getId() +"-fixedth-" + oColumn.getSanitizedKey(); // Needed for getColumn by TH and ColumnDD
},

/**
 * Destroy's the DataTable body THEAD element, if available.
 *
 * @method _destroyBdTheadEl
 * @private
 */
_destroyBdTheadEl : function() {
    var elBdThead = this._elBdThead;
    if(elBdThead) {
        var elTable = elBdThead.parentNode;
        Ev.purgeElement(elBdThead, true);
        elTable.removeChild(elBdThead);
        this._elBdThead = null;

        this._destroyColumnHelpers();
    }
},

/**
 * Initializes body THEAD element.
 *
 * @method _initBdTheadEl
 * @param elTable {HTMLElement} TABLE element into which to create THEAD.
 * @return {HTMLElement} Initialized THEAD element. 
 * @private
 */
_initBdTheadEl : function(elTable) {
    if(elTable) {
        // Destroy previous
        this._destroyBdTheadEl();

        var elThead = elTable.insertBefore(document.createElement("thead"), elTable.firstChild);
        
        // Add TRs to the THEAD;
        var oColumnSet = this._oColumnSet,
            colTree = oColumnSet.tree,
            elTh, elTheadTr, oColumn, i, j, k, l;

        for(i=0, k=colTree.length; i<k; i++) {
            elTheadTr = elThead.appendChild(document.createElement("tr"));
    
            // ...and create TH cells
            for(j=0, l=colTree[i].length; j<l; j++) {
                oColumn = colTree[i][j];
                elTh = elTheadTr.appendChild(document.createElement("th"));
                this._initBdThEl(elTh,oColumn,i,j);
            }
        }
        this._elBdThead = elThead;
        YAHOO.log("Accessibility TH cells for " + this._oColumnSet.keys.length + " keys created","info",this.toString());
    }
},

/**
 * Populates TH element for the body THEAD element.
 *
 * @method _initBdThEl
 * @param elTh {HTMLElement} TH element reference.
 * @param oColumn {YAHOO.widget.Column} Column object.
 * @private
 */
_initBdThEl : function(elTh, oColumn) {
    elTh.id = this.getId()+"-th-" + oColumn.getSanitizedKey(); // Needed for accessibility
    elTh.rowSpan = oColumn.getRowspan();
    elTh.colSpan = oColumn.getColspan();
    
    ///TODO: strip links and form elements
    var sKey = oColumn.getKey();
    var sLabel = lang.isValue(oColumn.label) ? oColumn.label : sKey;
    elTh.innerHTML = sLabel;
},






























/**
 * Sets focus on the given element.
 *
 * @method _focusEl
 * @param el {HTMLElement} Element.
 * @private
 */
_focusEl : function(el) {
    el = el || this._elTbody;
    // http://developer.mozilla.org/en/docs/index.php?title=Key-navigable_custom_DHTML_widgets
    // The timeout is necessary in both IE and Firefox 1.5, to prevent scripts from doing
    // strange unexpected things as the user clicks on buttons and other controls.
    
    // Bug 1921135: Wrap the whole thing in a setTimeout
    setTimeout(function() {
        setTimeout(function() {
            try {
                el.focus();
            }
            catch(e) {
            }
        },0);
    }, 0);
},






















/**
 * Syncs Column widths whenever the render chain ends.
 *
 * @method _onRenderChainEnd
 * @private
 */
_onRenderChainEnd : function() {
    // Don't call validateMinWidths from here, since sync() will do it
    this._sync();
    this.hideTableMessage();
},

/**
 * Post render syncing of Column widths and scroll padding
 *
 * @method _sync
 * @private
 */
_sync : function() {
    this._syncColWidths();
    ///TODO: is this still necessary?
    this._repaintGecko(this._elContainer);
},

/**
 * Syncs up widths of THs and TDs across all those Columns without width values
 * while validating minWidth values. Actual adjustment is to the liner DIVs so
 * window resizing will not affect cells. 
 *
 * @method _syncColWidths
 * @private
 */
_syncColWidths : function() {
    if(this._elTbody.rows.length > 0) {
        // Validate there is at least one row with cells and at least one Column
        var allKeys   = this._oColumnSet.keys,
            elRow     = this.getFirstTrEl();
    
        if(allKeys && elRow && (elRow.cells.length === allKeys.length)) {
            // Temporarily unsnap container since it causes inaccurate calculations
            var sWidth = this.get("width");
            if(sWidth) {
                this._elHdContainer.style.width = "";
                this._elBdContainer.style.width = "";
            }
            this._elContainer.style.width = "";
    
            var i,
                oColumn,
                cellsLen = elRow.cells.length;
                
            // Iterate through all Columns
            for(i=0; i<cellsLen; i++) {
                oColumn = allKeys[i];
                
                // Only Columns without widths that are not hidden
                if(!oColumn.width && !oColumn.hidden) {
                    var elTh = oColumn.getThEl();
                    var elTd = elRow.cells[i];
                
                    // Compare auto-widths
                    if(elTh.offsetWidth !== elTd.offsetWidth) {
                        var elWider = (elTh.offsetWidth > elTd.offsetWidth) ?
                                oColumn.getThLinerEl() : elTd.firstChild;               

                        // Grab the wider liner width, unless the minWidth is wider
                        var newWidth = Math.max(0,
                            (elWider.offsetWidth -(parseInt(Dom.getStyle(elWider,"paddingLeft"),10)|0) - (parseInt(Dom.getStyle(elWider,"paddingRight"),10)|0)),
                            oColumn.minWidth);
                        
                        // Set to the wider auto-width
                        this._elTbody.style.display = "none";
                        this._setColumnWidth(oColumn, newWidth+'px', 'visible');
                        this._elTbody.style.display = "";
                    }
                }
            }
            
            // Resnap unsnapped containers
            if(sWidth) {
                this._elHdContainer.style.width = sWidth;
                this._elBdContainer.style.width = sWidth;
            } 
        }
    }
    this._syncScroll();
},

/**
 * Syncs padding around scrollable tables, including Column header right-padding
 * and container width and height.
 *
 * @method _syncScroll
 * @private
 */
_syncScroll : function() {
    this._syncScrollX();
    this._syncScrollY();
    this._syncScrollOverhang();
    if(ua.opera) {
        // Bug 1925874
        this._elHdContainer.scrollLeft = this._elBdContainer.scrollLeft;
        if(!this.get("width")) {
            // Bug 1926125
            document.body.style += '';
        }
    }
},

/**
 * Snaps container width for y-scrolling tables.
 *
 * @method _syncScrollY
 * @private
 */
_syncScrollY : function() {
    var elTbody = this._elTbody,
        elBdContainer = this._elBdContainer;
    
    // X-scrolling not enabled
    if(!this.get("width")) {
        // Snap outer container width to content
        // but account for y-scrollbar if it is visible
        this._elContainer.style.width = 
                (elBdContainer.scrollHeight >= elBdContainer.offsetHeight) ?
                (elTbody.parentNode.offsetWidth + 19) + "px" :
                //TODO: Can we detect left and right border widths instead of hard coding?
                (elTbody.parentNode.offsetWidth + 2) + "px";
    }
},

/**
 * Snaps container height for x-scrolling tables in IE. Syncs message TBODY width.
 *
 * @method _syncScrollX
 * @private
 */
_syncScrollX : function() {
    var elTbody = this._elTbody,
        elBdContainer = this._elBdContainer;
    
    // IE 6 and 7 only when y-scrolling not enabled
    if(!this.get("height") && (ua.ie)) {
        // Snap outer container height to content
        elBdContainer.style.height = 
                // but account for x-scrollbar if it is visible
                (elBdContainer.scrollWidth > elBdContainer.offsetWidth - 2) ?
                (elTbody.parentNode.offsetHeight + 19) + "px" : 
                elTbody.parentNode.offsetHeight + "px";
    }

    // Sync message tbody
    if(this._elTbody.rows.length === 0) {
        this._elMsgTbody.parentNode.style.width = this.getTheadEl().parentNode.offsetWidth + "px";
    }
    else {
        this._elMsgTbody.parentNode.style.width = "";
    }
},

/**
 * Adds/removes Column header overhang.
 *
 * @method _syncScrollOverhang
 * @private
 */
_syncScrollOverhang : function() {
    var elTbody = this._elTbody,
        elBdContainer = this._elBdContainer,
        aLastHeaders, len, prefix, i, elLiner, oColumn;
        
    // Overhang should be either 1 (default) or 18px, depending on the location of the right edge of the table
    var nPadding = 1;
    
    // Y-scrollbar is visible, which is when the overhang needs to jut out
    if(elBdContainer.scrollHeight > elBdContainer.offsetHeight) {
        // X-scrollbar is also visible, which means the right is jagged, not flush with the Column
        var nAdjustedOffsetWidth = elBdContainer.offsetWidth - 18; // Account for the y-scrollbar when using the offsetWidth
        var nScrollWidth = elBdContainer.scrollWidth;
        if(nScrollWidth >= nAdjustedOffsetWidth) {
            nPadding = ((nScrollWidth - nAdjustedOffsetWidth) >= 0) ? 18 : 1;
        }
    }
    
    // Set Column header overhang
    aLastHeaders = this._oColumnSet.headers[this._oColumnSet.headers.length-1];
    len = aLastHeaders.length;
    prefix = this._sId+"-fixedth-";
    for(i=0; i<len; i++) {
        //TODO: A better way to get all THs along the right edge
        oColumn = this.getColumn(Dom.get(prefix+aLastHeaders[i]));
        oColumn.getThEl().style.borderRight = nPadding + "px solid " + this.get("COLOR_COLUMNFILLER");
    }
},

/**
 * Validates a Column (if given) or else all Columns against given minWidths, if any,
 * and if Column is not hidden nor has a set width. 
 *
 * @method _validateMinWidths
 * @param oArg.column {YAHOO.widget.Column} Affected Column instance, if available.
 * @private
 */
_validateMinWidths : function(oArg) {
    //SDT.superclass._validateMinWidths.call(this, oArg);
    //this._sync();
},














































/**
 * Removes given Column. NOTE: You cannot remove nested Columns. You can only remove
 * non-nested Columns, and top-level parent Columns (which will remove all
 * children Columns).
 *
 * @method removeColumn
 * @param oColumn {YAHOO.widget.Column} Column instance.
 * @return oColumn {YAHOO.widget.Column} Removed Column instance.
 */
removeColumn : function(oColumn) {
    // Store scroll pos
    var hdPos = this._elHdContainer.scrollLeft;
    var bdPos = this._elBdContainer.scrollLeft;
    
    // Call superclass method
    oColumn = SDT.superclass.removeColumn.call(this, oColumn);
    
    // Restore scroll pos
    this._elHdContainer.scrollLeft = hdPos;
    this._elBdContainer.scrollLeft = bdPos;
    
    return oColumn;
},

/**
 * Inserts given Column at the index if given, otherwise at the end. NOTE: You
 * can only add non-nested Columns and top-level parent Columns. You cannot add
 * a nested Column to an existing parent.
 *
 * @method insertColumn
 * @param oColumn {Object | YAHOO.widget.Column} Object literal Column
 * definition or a Column instance.
 * @param index {Number} (optional) New tree index.
 * @return oColumn {YAHOO.widget.Column} Inserted Column instance. 
 */
insertColumn : function(oColumn, index) {
    // Store scroll pos
    var hdPos = this._elHdContainer.scrollLeft;
    var bdPos = this._elBdContainer.scrollLeft;
    
    // Call superclass method
    var oNewColumn = SDT.superclass.insertColumn.call(this, oColumn, index);
    
    // Restore scroll pos
    this._elHdContainer.scrollLeft = hdPos;
    this._elBdContainer.scrollLeft = bdPos;
    
    return oNewColumn;
},

/**
 * Removes given Column and inserts into given tree index. NOTE: You
 * can only reorder non-nested Columns and top-level parent Columns. You cannot
 * reorder a nested Column to an existing parent.
 *
 * @method reorderColumn
 * @param oColumn {YAHOO.widget.Column} Column instance.
 * @param index {Number} New tree index.
 */
reorderColumn : function(oColumn, index) {
    // Store scroll pos
    var hdPos = this._elHdContainer.scrollLeft;
    var bdPos = this._elBdContainer.scrollLeft;
    
    // Call superclass method
    var oNewColumn = SDT.superclass.reorderColumn.call(this, oColumn, index);
    
    // Restore scroll pos
    this._elHdContainer.scrollLeft = hdPos;
    this._elBdContainer.scrollLeft = bdPos;

    return oNewColumn;
},

























/**
 * Returns DOM reference to the DataTable's scrolling body container element, if any.
 *
 * @method getBdContainerEl
 * @return {HTMLElement} Reference to DIV element.
 */
getBdContainerEl : function() {
    return this._elBdContainer;
},


/**
 * Nulls out the entire DataTable instance and related objects, removes attached
 * event listeners, and clears out DOM elements inside the container. After
 * calling this method, the instance reference should be expliclitly nulled by
 * implementer, as in myDataTable = null. Use with caution!
 *
 * @method destroy
 */
destroy : function() {
    this._oChainRender.stop();
    
    //TODO: destroy static resizer proxy and column proxy?
    
    var i;
    // Destroy ColumnDDs
    var aTree = this._oColumnSet.tree[0];
    for(i=0; i<aTree.length; i++) {
        if(aTree[i]._dd) {
            aTree[i]._dd = aTree[i]._dd.unreg();
        }
    }

    // Destroy ColumnResizers
    var aKeys = this._oColumnSet.keys;
    for(i=0; i<aKeys.length; i++) {
        if(aKeys[i]._ddResizer) {
            aKeys[i]._ddResizer = aKeys[i]._ddResizer.unreg();
        }
    }
    
    // Destroy Cell Editor
    Ev.purgeElement(this._oCellEditor.container, true);
    document.body.removeChild(this._oCellEditor.container);

    var instanceName = this.toString();
    var elContainer = this._elContainer;

    // Unhook custom events
    this._oRecordSet.unsubscribeAll();
    this.unsubscribeAll();

    // Unhook DOM events
    Ev.purgeElement(elContainer, true);
    Ev.removeListener(document, "click", this._onDocumentClick);

    // Remove DOM elements
    elContainer.innerHTML = "";

    // Null out objects
    for(var param in this) {
        if(lang.hasOwnProperty(this, param)) {
            this[param] = null;
        }
    }
    
    // Clean up static values
    DT._nCurrentCount--;
    
    if(DT._nCurrentCount < 1) {
        if(DT._elDynStyleNode) {
            document.getElementsByTagName('head')[0].removeChild(DT._elDynStyleNode);
            DT._elDynStyleNode = null;
        }
    }

    YAHOO.log("DataTable instance destroyed: " + instanceName);
},

/**
 * Sets given Column to given pixel width. If new width is less than minimum
 * width, sets to minimum width. Updates oColumn.width value.
 *
 * @method setColumnWidth
 * @param oColumn {YAHOO.widget.Column} Column instance.
 * @param nWidth {Number} New width in pixels.
 */
setColumnWidth : function(oColumn, nWidth) {
    oColumn = this.getColumn(oColumn);
    if(oColumn) {
        // Validate new width against minimum width
        if(lang.isNumber(nWidth)) {
            nWidth = (nWidth > oColumn.minWidth) ? nWidth : oColumn.minWidth;

            // Save state
            oColumn.width = nWidth;
            
            // Resize the DOM elements
            this._setColumnWidth(oColumn, nWidth+"px");
            this._syncScrollOverhang();
            
            this.fireEvent("columnSetWidthEvent",{column:oColumn,width:nWidth});
            YAHOO.log("Set width of Column " + oColumn + " to " + nWidth + "px", "info", this.toString());
            return;
        }
    }
    YAHOO.log("Could not set width of Column " + oColumn + " to " + nWidth + "px", "warn", this.toString());
},


/**
 * Shows Cell Editor for given cell.
 *
 * @method showCellEditor
 * @param elCell {HTMLElement | String} Cell to edit.
 * @param oRecord {YAHOO.widget.Record} (Optional) Record instance.
 * @param oColumn {YAHOO.widget.Column} (Optional) Column instance.
 */
showCellEditor : function(elCell, oRecord, oColumn) {
    elCell = Dom.get(elCell);

    if(elCell && (elCell.ownerDocument === document)) {
        if(!oRecord || !(oRecord instanceof YAHOO.widget.Record)) {
            oRecord = this.getRecord(elCell);
        }
        if(!oColumn || !(oColumn instanceof YAHOO.widget.Column)) {
            oColumn = this.getColumn(elCell);
        }
        if(oRecord && oColumn) {
            var oCellEditor = this._oCellEditor;

            // Clear previous Editor
            if(oCellEditor.isActive) {
                this.cancelCellEditor();
            }

            // Editor not defined
            if(!oColumn.editor) {
                return;
            }

            // Update Editor values
            oCellEditor.cell = elCell;
            oCellEditor.record = oRecord;
            oCellEditor.column = oColumn;
            oCellEditor.validator = (oColumn.editorOptions &&
                    lang.isFunction(oColumn.editorOptions.validator)) ?
                    oColumn.editorOptions.validator : null;
            oCellEditor.value = oRecord.getData(oColumn.key);
            oCellEditor.defaultValue = null;

            // Move Editor
            var elContainer = oCellEditor.container;
            var x = Dom.getX(elCell);
            var y = Dom.getY(elCell);

            // SF doesn't get xy for cells in scrolling table
            // when tbody display is set to block
            if(isNaN(x) || isNaN(y)) {
                x = elCell.offsetLeft + // cell pos relative to table
                        Dom.getX(this._elTbody.parentNode) - // plus table pos relative to document
                        this._elTbody.scrollLeft; // minus tbody scroll
                y = elCell.offsetTop + // cell pos relative to table
                        Dom.getY(this._elTbody.parentNode) - // plus table pos relative to document
                        this._elTbody.scrollTop + // minus tbody scroll
                        this._elThead.offsetHeight; // account for fixed THEAD cells
            }

            elContainer.style.left = x + "px";
            elContainer.style.top = y + "px";

            // Hook to customize the UI
            this.doBeforeShowCellEditor(this._oCellEditor);

            //TODO: This is temporarily up here due so elements can be focused
            // Show Editor
            elContainer.style.display = "";

            // Handle ESC key
            Ev.addListener(elContainer, "keydown", function(e, oSelf) {
                // ESC hides Cell Editor
                if((e.keyCode == 27)) {
                    oSelf.cancelCellEditor();
                    oSelf.focusTbodyEl();
                }
                else {
                    oSelf.fireEvent("editorKeydownEvent", {editor:oSelf._oCellEditor, event:e});
                }
            }, this);

            // Render Editor markup
            var fnEditor;
            if(lang.isString(oColumn.editor)) {
                switch(oColumn.editor) {
                    case "checkbox":
                        fnEditor = DT.editCheckbox;
                        break;
                    case "date":
                        fnEditor = DT.editDate;
                        break;
                    case "dropdown":
                        fnEditor = DT.editDropdown;
                        break;
                    case "radio":
                        fnEditor = DT.editRadio;
                        break;
                    case "textarea":
                        fnEditor = DT.editTextarea;
                        break;
                    case "textbox":
                        fnEditor = DT.editTextbox;
                        break;
                    default:
                        fnEditor = null;
                }
            }
            else if(lang.isFunction(oColumn.editor)) {
                fnEditor = oColumn.editor;
            }

            if(fnEditor) {
                // Create DOM input elements
                fnEditor(this._oCellEditor, this);

                // Show Save/Cancel buttons
                if(!oColumn.editorOptions || !oColumn.editorOptions.disableBtns) {
                    this.showCellEditorBtns(elContainer);
                }

                oCellEditor.isActive = true;

                //TODO: verify which args to pass
                this.fireEvent("editorShowEvent", {editor:oCellEditor});
                YAHOO.log("Cell Editor shown for " + elCell, "info", this.toString());
                return;
            }
        }
    }
    YAHOO.log("Could not show Cell Editor for " + elCell, "warn", this.toString());
},

/**
 * Saves Cell Editor input to Record.
 *
 * @method saveCellEditor
 */
saveCellEditor : function() {
    if(this._oCellEditor.isActive) {
        var newData = this._oCellEditor.value;
        // Copy the data to pass to the event
        var oldData = YAHOO.widget.DataTable._cloneObject(this._oCellEditor.record.getData(this._oCellEditor.column.key));

        // Validate input data
        if(this._oCellEditor.validator) {
            newData = this._oCellEditor.value = this._oCellEditor.validator.call(this, newData, oldData, this._oCellEditor);
            if(newData === null ) {
                this.resetCellEditor();
                this.fireEvent("editorRevertEvent",
                        {editor:this._oCellEditor, oldData:oldData, newData:newData});
                YAHOO.log("Could not save Cell Editor input due to invalid data " +
                        lang.dump(newData), "warn", this.toString());
                return;
            }
        }
        // Update the Record
        this._oRecordSet.updateRecordValue(this._oCellEditor.record, this._oCellEditor.column.key, this._oCellEditor.value);
        // Update the UI
        this.formatCell(this._oCellEditor.cell.firstChild);
        
        // Bug fix 1764044
        this._oChainRender.add({
            method: function() {
                this._syncColWidths();
            },
            scope: this
        });
        this._oChainRender.run();
        // Clear out the Cell Editor
        this.resetCellEditor();

        this.fireEvent("editorSaveEvent",
                {editor:this._oCellEditor, oldData:oldData, newData:newData});
        YAHOO.log("Cell Editor input saved", "info", this.toString());
    }
    else {
        YAHOO.log("Cell Editor not active to save input", "warn", this.toString());
    }
},

/**
 * Displays message within secondary TBODY.
 *
 * @method showTableMessage
 * @param sHTML {String} (optional) Value for innerHTMlang.
 * @param sClassName {String} (optional) Classname.
 */
showTableMessage : function(sHTML, sClassName) {
    var elCell = this._elMsgTd;
    if(lang.isString(sHTML)) {
        elCell.firstChild.innerHTML = sHTML;
    }
    if(lang.isString(sClassName)) {
        Dom.addClass(elCell.firstChild, sClassName);
    }

    // Needed for SDT only
    var elThead = this.getTheadEl();
    var elTable = elThead.parentNode;
    var newWidth = elTable.offsetWidth;
    this._elMsgTbody.parentNode.style.width = this.getTheadEl().parentNode.offsetWidth + "px";

    this._elMsgTbody.style.display = "";

    this.fireEvent("tableMsgShowEvent", {html:sHTML, className:sClassName});
    YAHOO.log("DataTable showing message: " + sHTML, "info", this.toString());
},

























/////////////////////////////////////////////////////////////////////////////
//
// Private DOM Event Handlers
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Syncs scrolltop and scrollleft of all TABLEs.
 *
 * @method _onScroll
 * @param e {HTMLEvent} The scroll event.
 * @param oSelf {YAHOO.widget.ScrollingDataTable} ScrollingDataTable instance.
 * @private
 */
_onScroll : function(e, oSelf) {
    oSelf._elHdContainer.scrollLeft = oSelf._elBdContainer.scrollLeft;

    if(oSelf._oCellEditor && oSelf._oCellEditor.isActive) {
        oSelf.fireEvent("editorBlurEvent", {editor:oSelf._oCellEditor});
        oSelf.cancelCellEditor();
    }

    var elTarget = Ev.getTarget(e);
    var elTag = elTarget.nodeName.toLowerCase();
    oSelf.fireEvent("tableScrollEvent", {event:e, target:elTarget});
},

/**
 * Handles keydown events on the THEAD element.
 *
 * @method _onTheadKeydown
 * @param e {HTMLEvent} The key event.
 * @param oSelf {YAHOO.widget.ScrollingDataTable} ScrollingDataTable instance.
 * @private
 */
_onTheadKeydown : function(e, oSelf) {
    // If tabbing to next TH label link causes THEAD to scroll,
    // need to sync scrollLeft with TBODY
    if(Ev.getCharCode(e) === 9) {
        setTimeout(function() {
            if((oSelf instanceof SDT) && oSelf._sId) {
                oSelf._elBdContainer.scrollLeft = oSelf._elHdContainer.scrollLeft;
            }
        },0);
    }
    
    var elTarget = Ev.getTarget(e);
    var elTag = elTarget.nodeName.toLowerCase();
    var bKeepBubbling = true;
    while(elTarget && (elTag != "table")) {
        switch(elTag) {
            case "body":
                return;
            case "input":
            case "textarea":
                // TODO
                break;
            case "thead":
                bKeepBubbling = oSelf.fireEvent("theadKeyEvent",{target:elTarget,event:e});
                break;
            default:
                break;
        }
        if(bKeepBubbling === false) {
            return;
        }
        else {
            elTarget = elTarget.parentNode;
            if(elTarget) {
                elTag = elTarget.nodeName.toLowerCase();
            }
        }
    }
    oSelf.fireEvent("tableKeyEvent",{target:(elTarget || oSelf._elContainer),event:e});
}




/**
 * Fired when a fixed scrolling DataTable has a scroll.
 *
 * @event tableScrollEvent
 * @param oArgs.event {HTMLEvent} The event object.
 * @param oArgs.target {HTMLElement} The DataTable's CONTAINER element (in IE)
 * or the DataTable's TBODY element (everyone else).
 *
 */




});

})();
