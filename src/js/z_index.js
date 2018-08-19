async function loadMap() {
    photoMap.loadMap()
    console.log("Loaded Map")
}

async function signInHandler(authenticated=false) {
    photoMap.ui.hideSignIn();
    photoMap.ui.statusMessage = "Signing in..."

    gapi.auth2.authorize({
        'client_id': CLIENT_ID,
        'immediate': false,
        'scope': SCOPES
    }, () => {
        console.log(gapi)
        photoMap.status.drive = true

        photoMap.isFirstTime = false

        console.log("Loaded API")
    });
       
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}


function init() {
    if (!photoMap.isFirstTime) {
        signInHandler(true)
    } else {
        photoMap.ui.showSignIn()
    }
}

window.photoMap = new PhotoMap()
