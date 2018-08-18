async function loadMap() {
    photoMap.loadMap()
    console.log("Loaded Map")
}

function loadDriveAPI() {
    gapi.load('client:auth2', async function () {
        
    })
}

async function signInHandler() {
    photoMap.ui.hideSignIn();
    photoMap.ui.statusMessage = "Signing in..."

    await gapi.auth.authorize({
        'client_id': CLIENT_ID,
        'immediate': false,
        'scope': SCOPES
    });
    
    photoMap.status.drive = true

    photoMap.isFirstTime = false

    console.log("Loaded API")
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function init() {
    loadDriveAPI()
    
    if (!photoMap.isFirstTime) {
        
    } else {
        photoMap.ui.showSignIn()
    }

    
}

window.photoMap = new PhotoMap()
