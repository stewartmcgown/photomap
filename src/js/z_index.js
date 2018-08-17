async function loadMap() {
    photoMap.loadMap()
    console.log("Loaded Map")
}

async function loadDriveAPI() {
    photoMap.ui.statusMessage = "Signing in..."

    gapi.load('client:auth2', async () => {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        })

        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen();

        // Handle the initial sign-in state.
        await gapi.auth2.getAuthInstance().signIn();

        photoMap.status.drive = true

        photoMap.isFirstTime = false

        console.log("Loaded API")
    })
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function init() {
    if (!photoMap.isFirstTime) {
        loadDriveAPI()
    } else {
        photoMap.ui.showSignIn()
    }
}

window.photoMap = new PhotoMap()
