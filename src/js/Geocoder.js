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

    /**
     * Connects to the mapping API and sets a location for
     * the given Photo.
     * @param {Photo} photo 
     */
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

    /**
     * Converts an API result into a formatted address.
     * @param {Object}} result 
     * @param {Photo} photo 
     */
    processGeocode(result, photo) {
        let formatted_address = result.formatted_address
        let country, region

        for (let component of result.address_components) {
            if (component.types.includes("country"))
                country = component.long_name
            else if (component.types.includes("locality") || component.types.includes("administrative_area_level_1"))
                region = component.long_name
        }

        if (country && region)
            formatted_address = `${country}, ${region}`

        // TODO: Push address name to photo on server
        //photo.address = formatted_address
    }
}