DV.Schema.models.document = {
  application:                DV.Schema,
  currentPageIndex:           0,
  offsets:                    [],
  baseHeightsPortion:         [],
  baseHeightsPortionOffsets:  [],
  paddedOffsets:              [],
  totalDocumentHeight:        0,
  totalPages:                 0,
  additionalPaddingOnPage:    0,

  ZOOM_RANGES:                [500, 700, 800, 900, 1000],

  init: function(){
    var data                      = DV.Schema.data;

    this.state                    = data.state;
    this.baseImageURL             = data.baseImageURL;
    this.additionalPaddingOnPage  = data.additionalPaddingOnPage;
    this.pageWidthPadding         = data.pageWidthPadding;
    this.totalPages               = data.totalPages;
    this.chapterModel             = DV.controller.models.chapters;
    this.pageModel                = this.application.models.pages;

    if (DV.options.zoom == 'auto') {
      this.zoomLevel              = data.zoomLevel;
    } else {
      this.zoomLevel              = DV.options.zoom || data.zoomLevel;
    }

    // The zoom level cannot go over the maximum image width.
    var maxZoom = _.last(this.ZOOM_RANGES);
    if (this.zoomLevel > maxZoom) this.zoomLevel = maxZoom;

  },
  setPageIndex : function(index) {
    this.currentPageIndex = index;
    DV.controller.elements.currentPage.text(this.currentPage());
    this.application.helpers.setActiveChapter(this.chapterModel.getChapterId(index));
    return index;
  },
  currentPage : function() {
    return this.currentPageIndex + 1;
  },
  currentIndex : function() {
    return this.currentPageIndex;
  },
  nextPage : function() {
    var nextIndex = this.currentIndex() + 1;
    if (nextIndex >= this.totalPages) return this.currentIndex();
    return this.setPageIndex(nextIndex);
  },
  previousPage : function() {
    var previousIndex = this.currentIndex() - 1;
    if (previousIndex < 0) return this.currentIndex();
    return this.setPageIndex(previousIndex);
  },
  zoom: function(zoomLevel,force){
    if(this.zoomLevel != zoomLevel || force === true){
      this.zoomLevel   = zoomLevel;
      this.application.models.pages.resize(this.zoomLevel);
      this.application.models.annotations.renderAnnotations();
      this.computeOffsets();
    }
  },
  computeOffsets: function() {
    // this.application.helpers.removeObserver('drawPages');

    var annotationModel  = this.application.models.annotations;
    var totalDocHeight   = 0;
    var adjustedOffset   = 0;
    var len              = this.totalPages;
    var diff             = 0;
    var scrollPos        = DV.controller.elements.window[0].scrollTop;

    for(var i = 0; i < len; i++) {
      if(annotationModel.offsetsAdjustments[i]){
        adjustedOffset   = annotationModel.offsetsAdjustments[i];
      }

      var pageHeight     = this.pageModel.getPageHeight(i);
      var previousOffset = this.offsets[i];
      var h              = this.offsets[i] = adjustedOffset + totalDocHeight;

      if((previousOffset !== h) && (h - pageHeight < scrollPos)) {
        diff += (h - previousOffset - diff);
      }

      this.baseHeightsPortion[i]        = Math.round((pageHeight + this.additionalPaddingOnPage) / 3);
      this.baseHeightsPortionOffsets[i] = (i == 0) ? 0 : h - this.baseHeightsPortion[i];

      totalDocHeight                    += (pageHeight + this.additionalPaddingOnPage);
    }

    // artificially set the scrollbar height
    if(totalDocHeight != this.totalDocumentHeight){
      diff = (this.totalDocumentHeight != 0) ? diff : totalDocHeight - this.totalDocumentHeight;
      this.application.helpers.setDocHeight(totalDocHeight,diff);
      this.totalDocumentHeight = totalDocHeight;
    }

    // this.application.helpers.addObserver('drawPages');
  },

  getOffset: function(_index){
    return this.offsets[_index];
  }
};
