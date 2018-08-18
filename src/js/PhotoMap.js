class PhotoMap {
    constructor() {
        this.state = "unloaded"
        this.status = {
            drive: false,
            maps: false,
            photos: false
        }
        this.photos = []
        this.geocodeCount = 0
        this.markers = []
        this.infoWindows = []

        this.PAGE_SIZE = 1000
        this.MAX_PHOTOS = 4000
        this.RECURSE = true
        this.GEOCODE = false
        this.SIDEBAR = false

        this.ui = new UI(this)
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

    get loaded() {
        if (this.status.drive && this.status.maps)
            return true
        else
            return false
    }

    get maxPhotosReached() {
        return (this.photos.length >= this.MAX_PHOTOS)
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
            zoom: 2
        });


        this.map.addListener('zoom_changed', () => { photoMap.resetClusters(); })


        this.geocoder = new google.maps.Geocoder()

        var script = document.createElement('script');
        script.onload = function () {
            photoMap.status.maps = true
        };
        script.src = "dist/richmarker.js";

        document.head.appendChild(script);
    }

    async updateSidebarPlaces() {
        this.ui.emptyPlaces()

        for (let cluster of this.clusterer.clusters_) {
            if (!cluster.clusterIcon_.url_)
                continue

            this.ui.addPlace({
                lat: cluster.center_.lat(),
                long: cluster.center_.lng(),
                count: get(['clusterIcon_', 'sums_', 'text'], cluster),
                cover: Photo.resize(cluster.clusterIcon_.url_, 512)
            })
        }
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
     * 
     * @param {Photo} photo 
     */
    processPhoto(photo) {
        this.photos.push(photo)

        $("#content-loading").remove()

        if (photo.hasLocation()) {
            if (this.SIDEBAR) {
                var c = document.createElement('div')
                c.className = "photo-list-item"
                c.id = photo.id
                c.innerHTML = `
                <div class="photo-container">
                    <img data-src="${photo.getSize(440)}">
                </div>
                <div class="photo-meta-container">
                    <div class="photo-meta-tags">
                        <!--<span class="photo-meta-tag-type"><i class="fas fa-question-circle"></i> Still</span>
                        <span class="photo-meta-tag-camera"><i class="fas fa-camera"></i> ${photo.camera}</span>
                        <span class="photo-meta-tag-resolution"><i class="fas fa-image"></i> ${photo.width} x ${photo.height}</span>-->
                    </div>
                    <div class="photo-meta-location-container">
                        <span class="fa-layers fa-fw">
                            <i class="fas fa-location-arrow"></i> 
                        </span> 
                    
                        <span class="photo-meta-location">${html.dots}</span>
                    </div>
                    
                </div>
            `
                this.photo_list[0].appendChild(c);

                //photo_list_item.append(...)
            }

            this.photoToMap(photo)

            // Bind listener to marker
            $(document).on('click', `.photo-list-item[data-id='${photo.id}']`, function () {
                let marker = photoMap.markers.filter(o => { return o.id == photo.id })[0]
                new google.maps.event.trigger(marker, 'click');
            })

            this.getLocation(photo)

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
            content: `<div><img style="height: 64px; border-radius: 5%; border: 4px solid white;" src="${photo.getSize(256)}"/></div>`,
            draggable: false,
            flat: true,
            anchor: RichMarkerPosition.TOP,
            cover: photo.getSize(128)
        })

        // Assign custom marker id
        marker.id = photo.id

        // Listen for click event
        marker.addListener('click', () => {
            if (photoMap.infoWindow)
                photoMap.infoWindow.close()

            photoMap.infoWindow = new google.maps.InfoWindow({
                content: `<a href="https://drive.google.com/file/d/${photo.id}/view" target="_blank"><img src="${photo.getSize()}"></a>`
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
                cssClass: 'cluster'
            });
    }

    /**
     * Takes a photo and returns a string of the human readable
     * location.
     * @param {object} photo 
     */
    async getLocation(photo, isRetry = false) {
        const RETRY_WAIT_MS = 1000

        if (isRetry)
            await sleep(RETRY_WAIT_MS)

        //console.log(`Attempting to fetch location for ${photo.id}`)

        if (this.GEOCODE)
            this.executeGeocodeRequest(photo)
    }

    async executeGeocodeRequest(photo) {
        const BUSY_WAIT_MS = 1000

        while (this.geocodeCount >= MAX_GEOCODE_CONNECTIONS)
            await sleep(BUSY_WAIT_MS)

        this.geocodeCount++

        let latlng = { lat: photo.latitude, lng: photo.longitude };

        this.geocoder.geocode({ 'location': latlng }, function (results, status) {
            if (status === 'OK') {
                if (results[0]) {
                    photoMap.processGeocode(results[0], photo)
                } else {
                    console.log('No results found');
                }
            } else if (status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
                photoMap.getLocation(photo, true)
                //console.log(`Retrying ${photo.id} in ${RETRY_WAIT_MS}ms due to query limit reached...`)
            } else {
                console.log('Geocoder failed due to: ' + status);
            }

            photoMap.geocodeCount--
        });

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

        console.log(`${photo.id} : ${formatted_address}`)

        $(`#${photo.id} > div.photo-meta-container > div.photo-meta-location-container > span.photo-meta-location`).html(formatted_address)

        photo.meta.location.address = formatted_address
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
            } else if (this.photos.length >= this.MAX_PHOTOS) {
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
        this.updateSidebarPlaces()

        if (r.nextPageToken && this.RECURSE) {
            this.getPhotos(r.nextPageToken)
            this.ui.statusMessage = `Fetched ${this.photos.length} photos...`
        } else if (!r.nextPageToken)
            this.allPhotosLoaded = true
    }
}