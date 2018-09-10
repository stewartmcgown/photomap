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

        this.PAGE_SIZE = 100
        this.MAX_PHOTOS = 100
        this.RECURSE = true
        this.GEOCODE = true
        this.GEOCODE_ALL = false
        this.SIDEBAR = true

        this.ui = new UI(this)
        this.geocoder = new Geocoder(this);
    }

    /**
     * @return {boolean} is this the browser's first load
     */
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

    /**
     * Removes all markers
     */
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

    /**
     * Adds a photo to the map
     * 
     * @param {Photo} photo 
     */
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

    /**
     * A recursive function to get all the photos from a user's 
     * Google Drive.
     * @param {String} nextPageToken 
     */
    async getPhotos(nextPageToken) {
        const DEFAULT_Q = 'mimeType contains "image/" and trashed=false'

        let q

        if (this.query)
            q = `fullText contains '${this.query}' and ${DEFAULT_Q}`
        else
            q = DEFAULT_Q

        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID(),
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

    /**
     * Adds a list of photos to the map
     * @param {Array.<Photo>} listOfPhotos 
     */
    addListOfPhotos(listOfPhotos) {
        for (let p of listOfPhotos.files)
            this.processPhoto(new Photo(p))

        // Update cluster
        this.resetClusters()

        // Update siderbar
        if (this.SIDEBAR)
            this.updateSidebarPlaces()

        if (listOfPhotos.nextPageToken && this.RECURSE) {
            this.getPhotos(listOfPhotos.nextPageToken)
            this.ui.statusMessage = `Fetched ${this.photos.length} photos...`
        } else if (!listOfPhotos.nextPageToken)
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

    /**
     * 
     * @param {Number} size A default size for the grid
     */
    async getFixedSizeGrid(size = 1) {
        let clusterer = new MarkerClusterer(this.map, this.markers,
            {
                maxZoom: 21,
                minimumClusterSize: 2,
                cssClass: 'cluster-hidden',
                invisibleMarkers: true,
                gridSize: 1
            })

        while (clusterer.clusters_.length == 0)
            await sleep(100)

        let clusters = [...clusterer.clusters_]

        clusterer.clearMarkers()

        return clusters
    }
}