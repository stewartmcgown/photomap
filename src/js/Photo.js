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