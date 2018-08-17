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

    updateLoading() {
        this.container.html("")

        this.loading = $(this.html.loading).appendTo(this.container)
        $(this.selectors.status).html(this.loadingMessage_)
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
        this.container.html(`
        <div class="sign-in-container">
        <div class="sign-in-inner">
            <a class="button sign-in" href="#" onclick="gapi.load('client:auth2', loadDriveAPI)">
                ${html.google} Sign in with Google
            </a>

            <a class="privacy-policy" href="privacy.html" target="blank">Privacy Policy</a>
            </div>
            </div>
        `)
    }

    hideStatus() {
        this.loading.hide()
    }
}