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