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
        $(`${this.selectors.overlay} .close-icon`).on('click', function() {
            $(that.selectors.overlay).toggleClass("minimised")
            $(`.close-icon > svg`).toggleClass("fa-rotate-180")
        })
    }

    updateLoading(reset) {
        if (reset)
            this.container.html("")

        if (!this.loading)
            this.loading = $(this.html.loading).appendTo(this.container)
        
        $(this.selectors.status).html(this.loadingMessage_)
    }

    emptyPlaces() {
        this.photo_list.empty()
    }

    addPlace(place) {
        var c = document.createElement('div')
                c.className = "photo-list-item"
                c.innerHTML = `
                <div class="photo-container">
                    <img src="${place.cover}">
                </div>
                <div class="photo-meta-container">
                    <div class="photo-meta-tags">
                        <!--<span class="photo-meta-tag-type"><i class="fas fa-question-circle"></i> Still</span>-->
                        <span class="photo-meta-tag-camera"><i class="fas fa-camera"></i> </span>
                        <span class="photo-meta-tag-resolution"><i class="fas fa-image"></i> </span>
                    </div>
                    <div class="photo-meta-location-container">
                        <span class="fa-layers fa-fw">
                            <i class="fas fa-location-arrow"></i>
                        </span> 
                    
                        <span class="photo-meta-location"> </span>
                    </div>
                    
                </div>
            `
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
        
    }

    hideSignIn() {
        this.container.find(".sign-in-container").remove()
    }

    hideStatus() {
        this.loading.hide()
    }
}