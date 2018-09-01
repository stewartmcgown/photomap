let html = {
    spinner: `<svg class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
            </svg>`,
    spinner_small: `<svg class="spinner spinner-small" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
            </svg>`,
    mdswitch: `<input type="checkbox" id="id-name--1" name="set-name" class="switch-input">
    <label for="id-name--1" class="switch-label">Switch <span class="toggle--on">On</span><span class="toggle--off">Off</span></label>`,
    dots: `<div class="ellipses">
    <span class="one">.</span><span class="two">.</span><span class="three">.</span>
  </div>`,
    placeholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==',
    loading: `<div class="loading">
    <svg class="spinner" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
        <circle class="path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
    </svg>
</div>`,
    google: `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48"><defs><path id="a" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></defs><clipPath id="b"><use xlink:href="#a" overflow="visible"/></clipPath><path clip-path="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z"/><path clip-path="url(#b)" fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z"/><path clip-path="url(#b)" fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z"/><path clip-path="url(#b)" fill="#4285F4" d="M48 48L17 24l-4-3 35-10z"/></svg>`
}

const get = (p, o, r = null) =>
    p.reduce((xs, x) => (xs && xs[x]) ? xs[x] : r, o)

// Client ID and API key from the Developer Console
const API_KEY = 'AIzaSyBLjH1zVUY5zh3NM65NqRVP3eQxZy6ifcA';
const CLIENT_ID = '257316982603-nr1g6o1icrqoiaui4rrhu31865ph11r3.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.photos.readonly';

class Geocoder {
    constructor(photoMap, service=null) {
        this.activeGeocodeCount = 0
        this.service_ = service

        this.BUSY_WAIT_MS = 1000
        this.MAX_CONNECTIONS = 10
    }

    get loaded() {
        return (this.service != null)
    }

    get service() {
        return this.service_
    }

    set service(service) {
        this.service_ = service
    }

    /**
     * 
     */
    async load() {
        
    }

    /**
     * Takes a photo and returns a string of the human readable
     * location.
     * @param {Photo} photo 
     */
    async getLocation(photo, isRetry = false) {
        const RETRY_WAIT_MS = 1000

        if (isRetry)
            await sleep(RETRY_WAIT_MS)

        //console.log(`Attempting to fetch location for ${photo.id}`)
        this.executeGeocodeRequest(photo)
    }

    async executeGeocodeRequest(photo) {
        while(this.isBusy)
            await sleep(200)

        this.activeGeocodeCount++

        let latlng = { lat: photo.latitude, lng: photo.longitude };

        this.service.geocode({ 'location': latlng }, (results, status) => {
            if (status === 'OK') {
                if (results[0])
                    this.processGeocode(results[0], photo)
                else
                    console.log('No results found');
            } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                this.getLocation(photo, isRetry=true)
            } else {
                console.log('Geocoder failed due to: ' + status);
            }

            this.activeGeocodeCount--
        });

    }

    get isBusy() {
        if (this.geocodeCount >= this.MAX_CONNECTIONS)
            return true
        else
            return false   
    }

    processGeocode(result, photo) {
        let formatted_address = result.formatted_address
        let country, region

        for (let c of result.address_components) {
            if (c.types.includes("country"))
                country = c.long_name
            else if (c.types.includes("locality") || c.types.includes("administrative_area_level_1"))
                region = c.long_name
        }

        if (country && region)
            formatted_address = `${country}, ${region}`

        //$(`#${photo.id} > div.photo-meta-container > div.photo-meta-location-container > span.photo-meta-location`).html(formatted_address)

        console.log(formatted_address)

        // TODO: Push address name to photo on server
        //photo.address = formatted_address
    }
}
/**
 * @name PhotoClusterer for Google Maps v3
 * @version version 1.0.2
 * @author Stewart McGown
 * @fileoverview
 * The library creates and manages per-zoom-level clusters for large amounts of
 * markers.
 * 
 * 
 * This library is derived from the original (no longer maintained)
 * version by Luke Mahe, called Marker Clusterer.
 *
 */

/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * A Marker Clusterer that clusters markers.
 *
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>=} opt_markers Optional markers to add to
 *   the cluster.
 * @param {Object=} opt_options support the following options:
 *     'gridSize': (number) The grid size of a cluster in pixels.
 *     'maxZoom': (number) The maximum zoom level that a marker can be part of a
 *                cluster.
 *     'zoomOnClick': (boolean) Whether the default behaviour of clicking on a
 *                    cluster is to zoom into it.
 *     'averageCenter': (boolean) Whether the center of each cluster should be
 *                      the average of all markers in the cluster.
 *     'minimumClusterSize': (number) The minimum number of markers to be in a
 *                           cluster before the markers are hidden and a count
 *                           is shown.
 *     'styles': (object) An object that has style properties:
 *       'url': (string) The image url.
 *       'height': (number) The image height.
 *       'width': (number) The image width.
 *       'anchor': (Array) The anchor position of the label text.
 *       'textColor': (string) The text color.
 *       'textSize': (number) The text size.
 *       'backgroundPosition': (string) The position of the backgound x, y.
 * @constructor
 * @extends google.maps.OverlayView
 */
function MarkerClusterer(map, opt_markers, opt_options) {
  // MarkerClusterer implements google.maps.OverlayView interface. We use the
  // extend function to extend MarkerClusterer with google.maps.OverlayView
  // because it might not always be available when the code is defined so we
  // look for it at the last possible moment. If it doesn't exist now then
  // there is no point going ahead :)
  this.extend(MarkerClusterer, google.maps.OverlayView);
  this.map_ = map;

  /**
   * @type {Array.<google.maps.Marker>}
   * @private
   */
  this.markers_ = [];

  /**
   *  @type {Array.<Cluster>}
   */
  this.clusters_ = [];

  this.sizes = [53, 56, 66, 78, 90];

  /**
   * @private
   */
  this.styles_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.ready_ = false;

  var options = opt_options || {};

  /**
   * @type {number}
   * @private
   */
  this.gridSize_ = options['gridSize'] || 60;

  /**
   * @private
   */
  this.minClusterSize_ = options['minimumClusterSize'] || 2;


  /**
   * @type {?number}
   * @private
   */
  this.maxZoom_ = options['maxZoom'] || null;

  this.styles_ = options['styles'] || [];

  this.cssClass_ = options['cssClass'] || null;

  this.inivisibleMarkers = options['invisibleMarkers'] || false;

  /**
   * @type {string}
   * @private
   */
  this.imagePath_ = options['imagePath'] ||
      this.MARKER_CLUSTER_IMAGE_PATH_;

  /**
   * @type {string}
   * @private
   */
  this.imageExtension_ = options['imageExtension'] ||
      this.MARKER_CLUSTER_IMAGE_EXTENSION_;

  /**
   * @type {boolean}
   * @private
   */
  this.zoomOnClick_ = true;

  if (options['zoomOnClick'] != undefined) {
    this.zoomOnClick_ = options['zoomOnClick'];
  }

  /**
   * @type {boolean}
   * @private
   */
  this.averageCenter_ = false;

  if (options['averageCenter'] != undefined) {
    this.averageCenter_ = options['averageCenter'];
  }

  this.setupStyles_();

  this.setMap(map);

  /**
   * @type {number}
   * @private
   */
  this.prevZoom_ = this.map_.getZoom();

  // Add the map event listeners
  var that = this;
  google.maps.event.addListener(this.map_, 'zoom_changed', function() {
    // Determines map type and prevent illegal zoom levels
    var zoom = that.map_.getZoom();
    var minZoom = that.map_.minZoom || 0;
    var maxZoom = Math.min(that.map_.maxZoom || 100,
                         that.map_.mapTypes[that.map_.getMapTypeId()].maxZoom);
    zoom = Math.min(Math.max(zoom,minZoom),maxZoom);

    if (that.prevZoom_ != zoom) {
      that.prevZoom_ = zoom;
      that.resetViewport();
    }
  });

  google.maps.event.addListener(this.map_, 'idle', function() {
    that.redraw();
  });

  // Finally, add the markers
  if (opt_markers && (opt_markers.length || Object.keys(opt_markers).length)) {
    this.addMarkers(opt_markers, false);
  }
}


MarkerClusterer.prototype.getCssClass = function() {
  return this.cssClass_
}

/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_PATH_ = '../images/m';


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_EXTENSION_ = 'png';


/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
MarkerClusterer.prototype.extend = function(obj1, obj2) {
  return (function(object) {
    for (var property in object.prototype) {
      this.prototype[property] = object.prototype[property];
    }
    return this;
  }).apply(obj1, [obj2]);
};


/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.onAdd = function() {
  this.setReady_(true);
};

/**
 * Implementaion of the interface method.
 * @ignore
 */
MarkerClusterer.prototype.draw = function() {};

/**
 * Sets up the styles object.
 *
 * @private
 */
MarkerClusterer.prototype.setupStyles_ = function() {
  if (this.styles_.length) {
    return;
  }

  for (var i = 0, size; size = this.sizes[i]; i++) {
    this.styles_.push({
      url: this.imagePath_ + (i + 1) + '.' + this.imageExtension_,
      height: size,
      width: size
    });
  }
};

/**
 *  Fit the map to the bounds of the markers in the clusterer.
 */
MarkerClusterer.prototype.fitMapToMarkers = function() {
  var markers = this.getMarkers();
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0, marker; marker = markers[i]; i++) {
    bounds.extend(marker.getPosition());
  }

  this.map_.fitBounds(bounds);
};


/**
 *  Sets the styles.
 *
 *  @param {Object} styles The style to set.
 */
MarkerClusterer.prototype.setStyles = function(styles) {
  this.styles_ = styles;
};


/**
 *  Gets the styles.
 *
 *  @return {Object} The styles object.
 */
MarkerClusterer.prototype.getStyles = function() {
  return this.styles_;
};


/**
 * Whether zoom on click is set.
 *
 * @return {boolean} True if zoomOnClick_ is set.
 */
MarkerClusterer.prototype.isZoomOnClick = function() {
  return this.zoomOnClick_;
};

/**
 * Whether average center is set.
 *
 * @return {boolean} True if averageCenter_ is set.
 */
MarkerClusterer.prototype.isAverageCenter = function() {
  return this.averageCenter_;
};


/**
 *  Returns the array of markers in the clusterer.
 *
 *  @return {Array.<google.maps.Marker>} The markers.
 */
MarkerClusterer.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 *  Returns the number of markers in the clusterer
 *
 *  @return {Number} The number of markers.
 */
MarkerClusterer.prototype.getTotalMarkers = function() {
  return this.markers_.length;
};


/**
 *  Sets the max zoom for the clusterer.
 *
 *  @param {number} maxZoom The max zoom level.
 */
MarkerClusterer.prototype.setMaxZoom = function(maxZoom) {
  this.maxZoom_ = maxZoom;
};


/**
 *  Gets the max zoom for the clusterer.
 *
 *  @return {number} The max zoom level.
 */
MarkerClusterer.prototype.getMaxZoom = function() {
  return this.maxZoom_;
};


/**
 *  The function for calculating the cluster icon image.
 *
 *  @param {Array.<google.maps.Marker>} markers The markers in the clusterer.
 *  @param {number} numStyles The number of styles available.
 *  @return {Object} A object properties: 'text' (string) and 'index' (number).
 *  @private
 */
MarkerClusterer.prototype.calculator_ = function(markers, numStyles) {
  var index = 0;
  var count = markers.length;
  var dv = count;
  while (dv !== 0) {
    dv = parseInt(dv / 10, 10);
    index++;
  }

  index = Math.min(index, numStyles);
  return {
    text: count,
    index: index
  };
};


/**
 * Set the calculator function.
 *
 * @param {function(Array, number)} calculator The function to set as the
 *     calculator. The function should return a object properties:
 *     'text' (string) and 'index' (number).
 *
 */
MarkerClusterer.prototype.setCalculator = function(calculator) {
  this.calculator_ = calculator;
};


/**
 * Get the calculator function.
 *
 * @return {function(Array, number)} the calculator function.
 */
MarkerClusterer.prototype.getCalculator = function() {
  return this.calculator_;
};


/**
 * Add an array of markers to the clusterer.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarkers = function(markers, opt_nodraw) {
  if (markers.length) {
    for (var i = 0, marker; marker = markers[i]; i++) {
      this.pushMarkerTo_(marker);
    }
  } else if (Object.keys(markers).length) {
    for (var marker in markers) {
      this.pushMarkerTo_(markers[marker]);
    }
  }
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Pushes a marker to the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.pushMarkerTo_ = function(marker) {
  marker.isAdded = false;
  if (marker['draggable']) {
    // If the marker is draggable add a listener so we update the clusters on
    // the drag end.
    var that = this;
    google.maps.event.addListener(marker, 'dragend', function() {
      marker.isAdded = false;
      that.repaint();
    });
  }
  this.markers_.push(marker);
};


/**
 * Adds a marker to the clusterer and redraws if needed.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
MarkerClusterer.prototype.addMarker = function(marker, opt_nodraw) {
  this.pushMarkerTo_(marker);
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Removes a marker and returns true if removed, false if not
 *
 * @param {google.maps.Marker} marker The marker to remove
 * @return {boolean} Whether the marker was removed or not
 * @private
 */
MarkerClusterer.prototype.removeMarker_ = function(marker) {
  var index = -1;
  if (this.markers_.indexOf) {
    index = this.markers_.indexOf(marker);
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        index = i;
        break;
      }
    }
  }

  if (index == -1) {
    // Marker is not in our list of markers.
    return false;
  }

  marker.setMap(null);

  this.markers_.splice(index, 1);

  return true;
};


/**
 * Remove a marker from the cluster.
 *
 * @param {google.maps.Marker} marker The marker to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 * @return {boolean} True if the marker was removed.
 */
MarkerClusterer.prototype.removeMarker = function(marker, opt_nodraw) {
  var removed = this.removeMarker_(marker);

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  } else {
   return false;
  }
};


/**
 * Removes an array of markers from the cluster.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 */
MarkerClusterer.prototype.removeMarkers = function(markers, opt_nodraw) {
  var removed = false;

  for (var i = 0, marker; marker = markers[i]; i++) {
    var r = this.removeMarker_(marker);
    removed = removed || r;
  }

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  }
};


/**
 * Sets the clusterer's ready state.
 *
 * @param {boolean} ready The state.
 * @private
 */
MarkerClusterer.prototype.setReady_ = function(ready) {
  if (!this.ready_) {
    this.ready_ = ready;
    this.createClusters_();
  }
};


/**
 * Returns the number of clusters in the clusterer.
 *
 * @return {number} The number of clusters.
 */
MarkerClusterer.prototype.getTotalClusters = function() {
  return this.clusters_.length;
};


/**
 * Returns the google map that the clusterer is associated with.
 *
 * @return {google.maps.Map} The map.
 */
MarkerClusterer.prototype.getMap = function() {
  return this.map_;
};


/**
 * Sets the google map that the clusterer is associated with.
 *
 * @param {google.maps.Map} map The map.
 */
MarkerClusterer.prototype.setMap = function(map) {
  this.map_ = map;
};


/**
 * Returns the size of the grid.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getGridSize = function() {
  return this.gridSize_;
};


/**
 * Sets the size of the grid.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setGridSize = function(size) {
  this.gridSize_ = size;
};


/**
 * Returns the min cluster size.
 *
 * @return {number} The grid size.
 */
MarkerClusterer.prototype.getMinClusterSize = function() {
  return this.minClusterSize_;
};

/**
 * Sets the min cluster size.
 *
 * @param {number} size The grid size.
 */
MarkerClusterer.prototype.setMinClusterSize = function(size) {
  this.minClusterSize_ = size;
};


/**
 * Extends a bounds object by the grid size.
 *
 * @param {google.maps.LatLngBounds} bounds The bounds to extend.
 * @return {google.maps.LatLngBounds} The extended bounds.
 */
MarkerClusterer.prototype.getExtendedBounds = function(bounds) {
  var projection = this.getProjection();

  // Turn the bounds into latlng.
  var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getNorthEast().lng());
  var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
      bounds.getSouthWest().lng());

  // Convert the points to pixels and the extend out by the grid size.
  var trPix = projection.fromLatLngToDivPixel(tr);
  trPix.x += this.gridSize_;
  trPix.y -= this.gridSize_;

  var blPix = projection.fromLatLngToDivPixel(bl);
  blPix.x -= this.gridSize_;
  blPix.y += this.gridSize_;

  // Convert the pixel points back to LatLng
  var ne = projection.fromDivPixelToLatLng(trPix);
  var sw = projection.fromDivPixelToLatLng(blPix);

  // Extend the bounds to contain the new bounds.
  bounds.extend(ne);
  bounds.extend(sw);

  return bounds;
};


/**
 * Determins if a marker is contained in a bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @param {google.maps.LatLngBounds} bounds The bounds to check against.
 * @return {boolean} True if the marker is in the bounds.
 * @private
 */
MarkerClusterer.prototype.isMarkerInBounds_ = function(marker, bounds) {
  return bounds.contains(marker.getPosition());
};


/**
 * Clears all clusters and markers from the clusterer.
 */
MarkerClusterer.prototype.clearMarkers = function() {
  this.resetViewport(true);

  // Set the markers a empty array.
  this.markers_ = [];
};


/**
 * Clears all existing clusters and recreates them.
 * @param {boolean} opt_hide To also hide the marker.
 */
MarkerClusterer.prototype.resetViewport = function(opt_hide) {
  // Remove all the clusters
  for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
    cluster.remove();
  }

  // Reset the markers to not be added and to be invisible.
  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    marker.isAdded = false;
    if (opt_hide) {
      marker.setMap(null);
    }
  }

  this.clusters_ = [];
};

/**
 *
 */
MarkerClusterer.prototype.repaint = function() {
  var oldClusters = this.clusters_.slice();
  this.clusters_.length = 0;
  this.resetViewport();
  this.redraw();

  // Remove the old clusters.
  // Do it in a timeout so the other clusters have been drawn first.
  window.setTimeout(function() {
    for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
      cluster.remove();
    }
  }, 0);
};


/**
 * Redraws the clusters.
 */
MarkerClusterer.prototype.redraw = function() {
  this.createClusters_();
};


/**
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @private
*/
MarkerClusterer.prototype.distanceBetweenPoints_ = function(p1, p2) {
  if (!p1 || !p2) {
    return 0;
  }

  var R = 6371; // Radius of the Earth in km
  var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
  var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};


/**
 * Add a marker to a cluster, or creates a new cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
MarkerClusterer.prototype.addToClosestCluster_ = function(marker) {
  var distance = 40000; // Some large number
  var clusterToAddTo = null;
  var pos = marker.getPosition();
  for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
    var center = cluster.getCenter();
    if (center) {
      var d = this.distanceBetweenPoints_(center, marker.getPosition());
      if (d < distance) {
        distance = d;
        clusterToAddTo = cluster;
      }
    }
  }

  if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
    clusterToAddTo.addMarker(marker);
  } else {
    var cluster = new Cluster(this);
    cluster.addMarker(marker);
    this.clusters_.push(cluster);
  }
};


/**
 * Creates the clusters.
 *
 * @private
 */
MarkerClusterer.prototype.createClusters_ = function() {
  if (!this.ready_) {
    return;
  }

  // Get our current map view bounds.
  // Create a new bounds object so we don't affect the map.
  var mapBounds = new google.maps.LatLngBounds(this.map_.getBounds().getSouthWest(),
      this.map_.getBounds().getNorthEast());
  var bounds = this.getExtendedBounds(mapBounds);

  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
      this.addToClosestCluster_(marker);
    }
  }
};


/**
 * A cluster that contains markers.
 *
 * @param {MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
function Cluster(markerClusterer) {
  this.markerClusterer_ = markerClusterer;
  this.map_ = markerClusterer.getMap();
  this.gridSize_ = markerClusterer.getGridSize();
  this.minClusterSize_ = markerClusterer.getMinClusterSize();
  this.averageCenter_ = markerClusterer.isAverageCenter();
  this.inivisibleMarkers = markerClusterer.inivisibleMarkers;
  this.center_ = null;
  this.markers_ = [];
  this.bounds_ = null;
  //this.clusterIcon_ = new ClusterIcon(this, markerClusterer.getStyles(),
  //    markerClusterer.getGridSize());
  this.cssClass = markerClusterer.getCssClass();
  
  this.clusterIcon_ = new ClusterIcon(this, markerClusterer.getStyles(),
      markerClusterer.getGridSize());
}

/**
 * MODIFIED FOR PHOTOMAP
 * 
 * Get front cover pic for cluster
 * 
 * @return {Array.object} Styles object containing front cover
 */
Cluster.prototype.getFrontCoverStyles = function() {
  let styles = []
  for (let i = 0; i < 5; i++) {
    styles.push({
      url: clusters_[0].markers_[0].cover,
      height: 64,
      width: 64
    });
  }
  return styles;
}

Cluster.prototype.getFrontCover = function() {
  return this.markers_[0].cover
}

/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker is already added.
 */
Cluster.prototype.isMarkerAlreadyAdded = function(marker) {
  if (this.markers_.indexOf) {
    return this.markers_.indexOf(marker) != -1;
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Add a marker the cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @return {boolean} True if the marker was added.
 */
Cluster.prototype.addMarker = function(marker) {
  if (this.isMarkerAlreadyAdded(marker)) {
    return false;
  }

  if (!this.center_) {
    this.center_ = marker.getPosition();
    this.calculateBounds_();
  } else {
    if (this.averageCenter_) {
      var l = this.markers_.length + 1;
      var lat = (this.center_.lat() * (l-1) + marker.getPosition().lat()) / l;
      var lng = (this.center_.lng() * (l-1) + marker.getPosition().lng()) / l;
      this.center_ = new google.maps.LatLng(lat, lng);
      this.calculateBounds_();
    }
  }

  marker.isAdded = true;
  this.markers_.push(marker);

  var len = this.markers_.length;
  if (len < this.minClusterSize_ && marker.getMap() != this.map_ && !this.inivisibleMarkers) {
    // Min cluster size not reached so show the marker.
    marker.setMap(this.map_);
  }

  if (len == this.minClusterSize_) {
    // Hide the markers that were showing.
    for (var i = 0; i < len; i++) {
      this.markers_[i].setMap(null);
    }
  }

  if (len >= this.minClusterSize_) {
    marker.setMap(null);
  }

  this.updateIcon();

  return true;
};


/**
 * Returns the marker clusterer that the cluster is associated with.
 *
 * @return {MarkerClusterer} The associated marker clusterer.
 */
Cluster.prototype.getMarkerClusterer = function() {
  return this.markerClusterer_;
};


/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 */
Cluster.prototype.getBounds = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
  var markers = this.getMarkers();
  for (var i = 0, marker; marker = markers[i]; i++) {
    bounds.extend(marker.getPosition());
  }
  return bounds;
};


/**
 * Removes the cluster
 */
Cluster.prototype.remove = function() {
  this.clusterIcon_.remove();
  this.markers_.length = 0;
  delete this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {number} The cluster center.
 */
Cluster.prototype.getSize = function() {
  return this.markers_.length;
};


/**
 * Returns the center of the cluster.
 *
 * @return {Array.<google.maps.Marker>} The cluster center.
 */
Cluster.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {google.maps.LatLng} The cluster center.
 */
Cluster.prototype.getCenter = function() {
  return this.center_;
};


/**
 * Calculated the extended bounds of the cluster with the grid.
 *
 * @private
 */
Cluster.prototype.calculateBounds_ = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
  this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
};


/**
 * Determines if a marker lies in the clusters bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Cluster.prototype.isMarkerInClusterBounds = function(marker) {
  return this.bounds_.contains(marker.getPosition());
};


/**
 * Returns the map that the cluster is associated with.
 *
 * @return {google.maps.Map} The map.
 */
Cluster.prototype.getMap = function() {
  return this.map_;
};


/**
 * Updates the cluster icon
 */
Cluster.prototype.updateIcon = function() {
  var zoom = this.map_.getZoom();
  var mz = this.markerClusterer_.getMaxZoom();

  if (mz && zoom > mz) {
    // The zoom is greater than our max zoom so show all the markers in cluster.
    for (var i = 0, marker; marker = this.markers_[i]; i++) {
      marker.setMap(this.map_);
    }
    return;
  }

  if (this.markers_.length < this.minClusterSize_) {
    // Min cluster size not yet reached.
    this.clusterIcon_.hide();
    return;
  }

  var numStyles = this.markerClusterer_.getStyles().length;
  var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
  this.clusterIcon_.setCenter(this.center_);
  this.clusterIcon_.setSums(sums);
  this.clusterIcon_.setCover(this.getFrontCover())
  this.clusterIcon_.show();

  
};


/**
 * A cluster icon
 *
 * @param {Cluster} cluster The cluster to be associated with.
 * @param {Object} styles An object that has style properties:
 *     'url': (string) The image url.
 *     'height': (number) The image height.
 *     'width': (number) The image width.
 *     'anchor': (Array) The anchor position of the label text.
 *     'textColor': (string) The text color.
 *     'textSize': (number) The text size.
 *     'backgroundPosition: (string) The background postition x, y.
 * @param {number=} opt_padding Optional padding to apply to the cluster icon.
 * @param {string} cover Cover for the cluster
 * @constructor
 * @extends google.maps.OverlayView
 * @ignore
 */
function ClusterIcon(cluster, styles, opt_padding) {
  cluster.getMarkerClusterer().extend(ClusterIcon, google.maps.OverlayView);

  this.styles_ = styles;
  this.padding_ = opt_padding || 0;
  this.cluster_ = cluster;
  this.center_ = null;
  this.map_ = cluster.getMap();
  this.div_ = null;
  this.sums_ = null;
  this.visible_ = false;
  this.cover = ""

  this.setMap(this.map_);
}


/**
 * Triggers the clusterclick event and zoom's if the option is set.
 */
ClusterIcon.prototype.triggerClusterClick = function() {
  var markerClusterer = this.cluster_.getMarkerClusterer();

  // Trigger the clusterclick event.
  google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_);

  if (markerClusterer.isZoomOnClick()) {
    // Zoom into the cluster.
    this.map_.fitBounds(this.cluster_.getBounds());
  }
};


/**
 * Adding the cluster icon to the dom.
 * @ignore
 */
ClusterIcon.prototype.onAdd = function() {
  this.div_ = document.createElement('DIV');
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.className = this.cluster_.cssClass
    this.div_.innerHTML = `<span class="_cluster_inner">${this.sums_.text}</span>`;
  }

  var panes = this.getPanes();
  panes.overlayMouseTarget.appendChild(this.div_);

  var that = this;
  google.maps.event.addDomListener(this.div_, 'click', function() {
    that.triggerClusterClick();
  });
};


/**
 * Returns the position to place the div dending on the latlng.
 *
 * @param {google.maps.LatLng} latlng The position in latlng.
 * @return {google.maps.Point} The position in pixels.
 * @private
 */
ClusterIcon.prototype.getPosFromLatLng_ = function(latlng) {
  var pos = this.getProjection().fromLatLngToDivPixel(latlng);
  pos.x -= parseInt(this.width_ / 2, 10);
  pos.y -= parseInt(this.height_ / 2, 10);
  return pos;
};


/**
 * Draw the icon.
 * @ignore
 */
ClusterIcon.prototype.draw = function() {
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.top = pos.y + 'px';
    this.div_.style.left = pos.x + 'px';
  }
};


/**
 * Hide the icon.
 */
ClusterIcon.prototype.hide = function() {
  if (this.div_) {
    this.div_.style.display = 'none';
  }
  this.visible_ = false;
};


/**
 * Position and show the icon.
 */
ClusterIcon.prototype.show = function() {
  if (this.div_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.style.display = '';
  }
  this.visible_ = true;
};


/**
 * Remove the icon from the map
 */
ClusterIcon.prototype.remove = function() {
  this.setMap(null);
};


/**
 * Implementation of the onRemove interface.
 * @ignore
 */
ClusterIcon.prototype.onRemove = function() {
  if (this.div_ && this.div_.parentNode) {
    this.hide();
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};


/**
 * Set the sums of the icon.
 *
 * @param {Object} sums The sums containing:
 *   'text': (string) The text to display in the icon.
 *   'index': (number) The style index of the icon.
 */
ClusterIcon.prototype.setSums = function(sums) {
  this.sums_ = sums;
  this.text_ = sums.text;
  this.index_ = sums.index;
  if (this.div_) {
    this.div_.innerHTML = sums.text;
  }

  // PHOTOMAP: Disable default style behaviour
  //this.useStyle();
  this.setCover(this.cover)
};


/**
 * Sets the icon to the the styles.
 */
ClusterIcon.prototype.useStyle = function() {
  var index = Math.max(0, this.sums_.index - 1);
  index = Math.min(this.styles_.length - 1, index);
  var style = this.styles_[index];
  this.url_ = style['url'];
  this.height_ = style['height'];
  this.width_ = style['width'];
  this.textColor_ = style['textColor'];
  this.anchor_ = style['anchor'];
  this.textSize_ = style['textSize'];
  this.backgroundPosition_ = style['backgroundPosition'];
};

ClusterIcon.prototype.setCover = function(cover) {
  this.url_ = cover
  this.height_ = 64;
  this.width_ = 64;
}

/**
 * Sets the center of the icon.
 *
 * @param {google.maps.LatLng} center The latlng to set as the center.
 */
ClusterIcon.prototype.setCenter = function(center) {
  this.center_ = center;
};


/**
 * Create the css text based on the position of the icon.
 *
 * @param {google.maps.Point} pos The position.
 * @return {string} The css style text.
 */
ClusterIcon.prototype.createCss = function(pos) {
  var style = [];
  style.push('background-image:url(' + this.url_ + ');');
  var backgroundPosition = this.backgroundPosition_ ? this.backgroundPosition_ : '0 0';
  style.push('background-position:' + backgroundPosition + ';');

  if (typeof this.anchor_ === 'object') {
    if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
        this.anchor_[0] < this.height_) {
      style.push('height:' + (this.height_ - this.anchor_[0]) +
          'px; padding-top:' + this.anchor_[0] + 'px;');
    } else {
      style.push('height:' + this.height_ + 'px; line-height:' + this.height_ +
          'px;');
    }
    if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
        this.anchor_[1] < this.width_) {
      style.push('width:' + (this.width_ - this.anchor_[1]) +
          'px; padding-left:' + this.anchor_[1] + 'px;');
    } else {
      style.push('width:' + this.width_ + 'px; text-align:center;');
    }
  } else {
    style.push('height:' + this.height_ + 'px; line-height:' +
        this.height_ + 'px; width:' + this.width_ + 'px; text-align:center;');
  }

  var txtColor = this.textColor_ ? this.textColor_ : 'black';
  var txtSize = this.textSize_ ? this.textSize_ : 11;

  style.push('cursor:pointer; top:' + pos.y + 'px; left:' +
      pos.x + 'px; color:' + txtColor + '; position:absolute; font-size:' +
      txtSize + 'px; font-family:Arial,sans-serif; font-weight:bold');
  return style.join('');
};

class Photo {
    constructor(photo) {
        this.id = photo.id
        this.url = photo.thumbnailLink

        if (photo.imageMediaMetadata)
            this.meta = photo.imageMediaMetadata
        else
            this.meta = {}

        this.addedTime = new Date()
        
        this.THUMB_LIFETIME = 9e5
    }



    get camera() {
        let make = get(['cameraMake'], this.meta)
        let model = get(['cameraModel'], this.meta)

        if (!make || !model)
            return "None"

        return `${make.charAt(0).toUpperCase()}${make.substr(1)} ${model}`
    }

    get height() {
        return this.meta.height
    }

    get width() {
        return this.meta.width
    }

    get latitude() {
        return get(['location', 'latitude'],this.meta)
    }

    get longitude() {
        return this.meta.location.longitude
    }

    get location() {
        let that = this
        return {
            latitude: that.latitude,
            longitude: that.longitude
        }
    }

    hasLocation() {
        return this.meta.location != undefined
    }

    /**
     * Update the remote with a new location for this photo
     * 
     * @param {Object.<location>} location // Contains a lat and long
     */
    setLocation(location) {

    }

    /**
     * Stub. Should return a street name
     */
    getFormattedAddress() {

    }

    isExpired() {
        return (new Date).getTime() - this.addedTime.getTime() > this.THUMB_LIFETIME
    }

    /**
     * Returns a link to the photo
     * 
     * https://drive.google.com/thumbnail?authuser=0&sz=w546-h585-p-k-nu&id=1F05ZRe390FeklNnveX3I-cTeSPnN7TOyFg
     * 
     * @param {Object} options {
     *      width: Number,
     *      height: Number,
     *      aspect: Boolean,
     *      crop: Boolean
     * }
     */
    getSize(options) {
        // Util: Appends parameter to list of parameters
        let append = (s, v) => {
            if (params.length > 0)
                params+="-"

            params += s

            if (v)
                params += v
        }

        let params = ""

        if (options.crop && !options.height)
            options.height = options.width

        options.width && append("w", Math.floor(options.width))
        options.height && append("h", Math.floor(options.height))
        options.crop && append("p-k-nu")
        options.aspect && append("no")

        return `https://drive.google.com/thumbnail?authuser=0&id=${this.id}&sz=${params}`
        
    }

    static resize(url, width) {
        let base = url.substr(0, url.length - 3)
        return `${base}${width}`
    }

}
/**
 * A class for handling the areas. Adapted from the
 * markerclusterer geometry section.
 * 
 * @see MarkerClusterer.js
 */
class PhotoGrouper {
    /**
     * Build a photogrouper using markers and a max group radius
     * @param {google.maps.Marker[]} markers 
     * @param {Number} distance 
     */
    constructor(map) {
        this.map = map
        this.groups = []
    }
    /**
     * Calculates the distance between two latlng locations in km.
     * @see http://www.movable-type.co.uk/scripts/latlong.html
     *
     * @param {google.maps.LatLng} p1 The first lat lng point.
     * @param {google.maps.LatLng} p2 The second lat lng point.
     * @return {number} The distance between the two points in km.
    */
    distance(p1, p2) {
        if (!p1 || !p2) {
            return 0;
        }

        var R = 6371; // Radius of the Earth in km
        var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
        var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d;
    }

    /**
     * Groups marker into a fixed area. If no group
     * is available, create one
     * 
     * @param {RichMarker} marker 
     */
    group(marker) {
        let distance = 40000
        let targetGroup = null
        let position = marker.getPosition()

        for (let group of this.groups) {
            let center = group.getCenter();
            if (center) {
                var d = this.distanceBetweenPoints_(center, marker.getPosition());
                if (d < distance) {
                    distance = d;
                    targetGroup = group
                }
            }
        }

        if (targetGroup) {
            targetGroup.addMarker(marker);
          } else {
            var group = new Group(this);
            group.addMarker(marker);
            this.groups.push(cluster);
          }
    }

    /**
     * Creates groups
     */

    createGroups() {
        for (let marker of this.markers) {
            this.group(marker)
        }
    }
}

/**
 * A group to hold markers and resolve them to addresses
 */
class Group {
    constructor() {
        this.markers = []
    }   

    addMarker(marker) {
        this.markers.push(markers)
    }
}
class PhotoMap {
    constructor() {
        this.state = "unloaded"
        this.status = {
            drive: false,
            maps: false,
            photos: false
        }
        this.photos = []
        this.markers = []
        this.infoWindows = []

        this.PAGE_SIZE = 1000
        this.MAX_PHOTOS = 10000
        this.RECURSE = true
        this.GEOCODE = true
        this.GEOCODE_ALL = false
        this.SIDEBAR = true

        this.ui = new UI(this)
        this.geocoder = new Geocoder(this);
    }

    get isFirstTime() {
        if (localStorage.getItem("isFirstTime") == "false")
            return false
        else
            return true
    }

    set isFirstTime(a) {
        localStorage.setItem("isFirstTime", a)
    }

    get clusterClass() {
        return 'cluster'
    }

    get loaded() {
        if (this.status.drive && this.status.maps)
            return true
        else
            return false
    }

    get maxPhotosReached() {
        return (this.photos.length >= this.MAX_PHOTOS && this.MAX_PHOTOS != 0)
    }

    set allPhotosLoaded(a) {
        // Callback for set
        this.status.photos = true

        this.ui.status = "loaded"
    }

    get allPhotosLoaded() {
        return this.status.photos
    }

    loadMap() {
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: { lat: 0, lng: 0 },
            zoom: 3
        });


        this.map.addListener('zoom_changed', () => { photoMap.resetClusters(); })

        var script = document.createElement('script');
        script.onload = function () {
            photoMap.status.maps = true
        };
        script.src = "dist/richmarker.js";

        document.head.appendChild(script);

        this.geocoder.service = new google.maps.Geocoder();
    }


    clearMap() {
        for (let m of this.markers) {
            m.setMap(null);
        }

        this.markers.length = 0;
    }

    reset() {
        this.clearMap()
        this.photos.length = 0
    }

   

    /**
     * Search for a given query
     * @param {String} q 
     */
    search(q) {
        if (q == "")
            q = undefined

        this.query = q
        this.ui.load()
    }

    /**
     * 
     * @param {Photo} photo 
     */
    processPhoto(photo) {
        this.photos.push(photo)

        $("#content-loading").remove()

        if (photo.hasLocation()) {
            this.photoToMap(photo)

            // Bind listener to marker
            $(document).on('click', `.photo-list-item[data-id='${photo.id}']`, function () {
                let marker = photoMap.markers.filter(o => { return o.id == photo.id })[0]
                new google.maps.event.trigger(marker, 'click');
            })

            if (this.GEOCODE_ALL && !this.address)
                this.geocoder.getLocation(photo)

        } else {
            /*photo_list_item.find(".photo-meta-location-container").html(`<span class="fa-layers fa-fw">
            <i class="fas fa-location-arrow"></i>
            <i class="fas fa-ban" data-fa-transform="grow-4" style="color:gray"></i>
        </span> `)*/
        }
    }

    photoToMap(photo) {
        let latLng = new google.maps.LatLng(photo.latitude,
            photo.longitude);


        let marker = new RichMarker({
            position: latLng,
            map: this.map,
            content: `<div><img style="height: 64px; border-radius: 5%; border: 4px solid white;" src="${photo.getSize({ width: 256 })}"/></div>`,
            draggable: false,
            flat: true,
            anchor: RichMarkerPosition.TOP,
            cover: photo.getSize({ width: 256 }),
            id: photo.id
        })

        // Assign custom marker id
        marker.id = photo.id

        // Listen for click event
        marker.addListener('click', () => {
            if (photoMap.infoWindow)
                photoMap.infoWindow.close()

            photoMap.infoWindow = new google.maps.InfoWindow({
                content: `<a href="https://drive.google.com/file/d/${photo.id}/view" target="_blank"><img src="${photo.getSize({ aspect: true })}"></a>`
            })

            photoMap.infoWindow.open(this.map, marker)

            if (photoMap.map.zoom < 20)
                photoMap.map.setZoom(21)
            photoMap.map.panTo(marker.position)
        })

        // Add to app marker array
        this.markers.push(marker)

    }

    /**
     * Called every time a view change is detected
     * or a new set of photos are added
     */
    resetClusters() {
        if (this.clusterer)
            this.clusterer.clearMarkers()

        this.clusterer = new MarkerClusterer(this.map, this.markers,
            {
                maxZoom: 21,
                minimumClusterSize: 2,
                cssClass: this.clusterClass,
                gridSize: 40
            });
    }

    async getPhotos(nextPageToken) {
        const DEFAULT_Q = 'mimeType contains "image/" and trashed=false'

        let q

        if (this.query)
            q = `fullText contains '${this.query}' and ${DEFAULT_Q}`
        else
            q = DEFAULT_Q

        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(() => gapi.client.drive.files.list({
            'q': q,
            'spaces': 'photos, drive',
            'fields': "nextPageToken,files(id,imageMediaMetadata,thumbnailLink)",
            'pageToken': nextPageToken,
            pageSize: this.PAGE_SIZE
        })).then((response) => {
            if (response.result.error) {
                this.getPhotos(nextPageToken)
            } else if (this.maxPhotosReached) {
                console.log("Reached max photo count")
                this.allPhotosLoaded = true
            } else if (response.result.files) {
                this.addListOfPhotos(response.result)
            }
        })


    }

    addListOfPhotos(r) {
        for (let p of r.files)
            this.processPhoto(new Photo(p))

        // Update cluster
        this.resetClusters()

        // Update siderbar
        if (this.SIDEBAR)
            this.updateSidebarPlaces()

        if (r.nextPageToken && this.RECURSE) {
            this.getPhotos(r.nextPageToken)
            this.ui.statusMessage = `Fetched ${this.photos.length} photos...`
        } else if (!r.nextPageToken)
            this.allPhotosLoaded = true
    }


    /**
     * TODO make this check for exsiting elements in sidebar
     */
    async updateSidebarPlaces() {
        let clusters = await this.getFixedSizeGrid(1);
        this.ui.emptyPlaces()
        for (let cluster of clusters) {
            if (!cluster.clusterIcon_.url_)
                continue

            this.ui.addPhoto({
                latitude: cluster.center_.lat(),
                longitude: cluster.center_.lng(),
                count: get(['clusterIcon_', 'sums_', 'text'], cluster),
                cover: Photo.resize(cluster.clusterIcon_.url_, 512)
            })
        }
    }

    async getFixedSizeGrid(size = 1) {
        let a = new MarkerClusterer(this.map, this.markers,
            {
                maxZoom: 21,
                minimumClusterSize: 2,
                cssClass: 'cluster-hidden',
                invisibleMarkers: true,
                gridSize: 1
            })

        while (a.clusters_.length == 0)
            await sleep(100)

        let d = [...a.clusters_]

        a.clearMarkers()

        return d
    }
}
class UI {
    constructor(map) {
        this.photoMap = map

        this.html = {
            loading: `<div class="loading">
                        ${html.spinner_small} <span class="status">Fetching your Photos...</span>
                    </div>`,
            photoList: `<div class="photo-list"></div>`
        }

        this.selectors = {
            overlay: "#overlay",
            container: "#overlay .content",
            status: "#overlay .content .loading .status"
        }

        this.container = $(this.selectors.container)
        this.bindings()
        this.load()
    }

    set status(status) {
        this.status_ = status

        if (this.status_ == "loaded") {
            this.hideStatus()
        }
    }

    get status() {
        return this.status_
    }

    set statusMessage(message) {
        this.loadingMessage_ = message

        this.updateLoading()
    }

    bindings() {
        let that = this
        $(`${this.selectors.overlay} .close-icon`).on('click', function () {
            $(that.selectors.overlay).toggleClass("minimised")
            $(`.close-icon > svg`).toggleClass("fa-rotate-180")
        })

        this.bindSearch()
    }

    /**
    * Binds the search bar to the map
    */
    bindSearch() {
        // Get the input box
        var textInput = document.getElementById('search');

        // Init a timeout variable to be used below
        var timeout = null;

        // Listen for keystroke events
        textInput.onkeyup = (e) => {

            // Clear the timeout if it has already been set.
            // This will prevent the previous task from executing
            // if it has been less than <MILLISECONDS>
            clearTimeout(timeout);

            // Make a new timeout set to go off in 800ms
            timeout = setTimeout(() => {
                this.photoMap.search(textInput.value)
            }, 500);
        };
    }

    updateLoading(reset) {
        if (reset)
            this.container.html("")

        if (!this.loading)
            this.loading = $(this.html.loading).appendTo(this.container)
        this.loading.show()

        $(this.selectors.status).html(this.loadingMessage_)
    }

    emptyPlaces() {
        this.photo_list.empty()
    }

    addPhoto(photo) {
        var c = document.createElement('div')
        c.className = "photo-list-item"
        c.id = photo.trim()
        c.innerHTML = `
                <div class="photo-container">
                    <div class="photo-img" style="background-image:url('${photo.cover}')"></div>
                </div>
                <div class="photo-meta-container">
                    <div class="photo-meta-tags">
                        <!--<span class="photo-meta-tag-type"><i class="fas fa-question-circle"></i> Still</span>
                        <span class="photo-meta-tag-camera"><i class="fas fa-camera"></i> </span>
                        <span class="photo-meta-tag-resolution"><i class="fas fa-image"></i> </span>-->
                    </div>
                    <div class="photo-meta-location-container">
                        <span class="fa-layers fa-fw">
                            <i class="fas fa-location-arrow"></i>
                        </span> 
                    
                        <span class="photo-meta-location">${html.dots}</span>
                    </div>
                    
                </div>
            `

        c.onclick = () => { this.photoMap.map.setCenter(new google.maps.LatLng(photo.latitude, photo.longitude)); this.photoMap.map.setZoom(17) }

        this.photoMap.geocoder.getLocation(photo, )

        this.photo_list[0].appendChild(c);
    }

    async load() {
        while (!this.photoMap.loaded) {
            await sleep(200)
        }

        this.photoMap.reset()

        this.statusMessage = "Fetching photos..."

        this.photo_list = $(this.html.photoList).appendTo(this.container);

        this.photoMap.getPhotos()
    }

    showSignIn() {
        this.container.html("")
        this.container.append(`
        <div class="sign-in-container">
        <div class="sign-in-inner">
            <a class="button sign-in" href="#" onclick="signInHandler()">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48"><defs><path id="a" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/></defs><clipPath id="b"><use xlink:href="#a" overflow="visible"/></clipPath><path clip-path="url(#b)" fill="#FBBC05" d="M0 37V11l17 13z"/><path clip-path="url(#b)" fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z"/><path clip-path="url(#b)" fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z"/><path clip-path="url(#b)" fill="#4285F4" d="M48 48L17 24l-4-3 35-10z"/></svg> Sign in with Google
            </a>

            <a class="privacy-policy" href="privacy.html" target="blank">Privacy Policy</a>
            </div>
            </div>
        `)
    }

    hideSignIn() {
        this.container.find(".sign-in-container").remove()
    }

    hideStatus() {
        this.loading.hide()
    }
}
async function loadMap() {
    photoMap.loadMap()
    console.log("Loaded Map")
}

async function signInHandler(authenticated=false) {
    photoMap.ui.hideSignIn();
    photoMap.ui.statusMessage = "Signing in..."

    gapi.auth2.authorize({
        'client_id': CLIENT_ID,
        'immediate': false,
        'scope': SCOPES
    }, () => {
        photoMap.status.drive = true

        photoMap.isFirstTime = false

        console.log("Loaded API")
    });
       
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


function init() {
    if (!photoMap.isFirstTime) {
        signInHandler(true)
    } else {
        photoMap.ui.showSignIn()
    }
}

window.photoMap = new PhotoMap()
