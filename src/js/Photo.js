class Photo {
    constructor(photo) {
        this.id = photo.id
        this.url = photo.thumbnailLink

        if (photo.imageMediaMetadata)
            this.meta = photo.imageMediaMetadata
        else
            this.meta = {}
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
        return this.meta.location.latitude
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

    /**
     * 
     * @param {int} width 
     * @param {int} height 
     */
    getSize(width, height) {
        if (!width) {
            width = this.width
            height = this.height
        } 
        
        if (height) {
            let base = this.url.substr(0, this.url.length - 4)
            return `${base}w${width}-h${height}-p-k-nu`
        } else {
            let base = this.url.substr(0, this.url.length - 3)
            return `${base}${width}`
        }
    }

    static resize(url, width) {
        let base = url.substr(0, url.length - 3)
        return `${base}${width}`
    }

}