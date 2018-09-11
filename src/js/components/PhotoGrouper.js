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