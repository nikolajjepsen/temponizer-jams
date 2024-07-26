import {
    clientId,
    redirectToAuthCodeFlow,
    fetchProfile,
    populateProfile,
    populateCurrent,
    populatePrevious,
    populatePlaylists,
    hasAccessToken,
    getAccessToken,
    fetchAccessToken,
    currentTrack,
    recentTracks,
    getPlaylists,
    synchroniseTracks
} from "./spotify.js";


const params = new URLSearchParams(window.location.search);
const code = params.get("code")

if (hasAccessToken()) {
    await getAccessToken();
} else if (code) {
    await fetchAccessToken(clientId, code);
}

if (hasAccessToken()) {
    document.querySelector('#authenticated').style.display = 'flex';
    document.querySelector('#player').style.display = 'block';

    document.querySelector('#unauthenticated').style.display = 'none';

    const profile = await fetchProfile();
    populateProfile(profile);

    const playback = await currentTrack();
    populateCurrent(playback);

    const previous = await recentTracks();
    populatePrevious(previous);

    const playlists = await getPlaylists();
    populatePlaylists(playlists);
}

document.querySelector('#logout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'https://nikolajjepsen.github.io/temponizer-jams/';
});

document.querySelector('#login').addEventListener('click', () => {
    redirectToAuthCodeFlow(clientId);
});

document.querySelector('#resetPreviousTracks').addEventListener('click', async () => {
    localStorage.setItem('previous_after', parseInt(Date.now()));
    localStorage.setItem('awaits_tracks_registration', '');
    populatePrevious(await recentTracks())
});

document.querySelector('#synchronizePlaylist').addEventListener('click', async () => {
    const playlistId = document.querySelector('#playlists').value;
    synchroniseTracks(playlistId);
});
