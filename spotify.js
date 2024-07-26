export const clientId = "4ace2233e1cb4565918c80fdbfa696d2";

export async function redirectToAuthCodeFlow(clientId) {
    const verifier = generateCodeVerifier(128);
    const challenge = await generateCodeChallenge(verifier);

    localStorage.setItem("verifier", verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", "https://nikolajjepsen.github.io/temponizer-jams");
    params.append("scope", "user-read-private user-read-email user-read-currently-playing user-read-recently-played playlist-modify-public playlist-modify-private playlist-read-collaborative");
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}


export function hasAccessToken() {
    return localStorage.getItem('access_token') !== null;
}

export async function getAccessToken() {
    const expiresAt = localStorage.getItem('expires_at');

    if (expiresAt && expiresAt < Date.now()) {
        await renewToken();
    }

    return localStorage.getItem('access_token');
}

async function renewToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    const params = new URLSearchParams();

    params.append("client_id", clientId);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params
    });

    const {access_token, expires_in} = await result.json();

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('expires_at', expires_in + Date.now());
}

export async function fetchAccessToken(clientId, code) {
    const verifier = localStorage.getItem("verifier");
    const params = new URLSearchParams();

    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", "http://localhost:5173/callback");
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: params
    });

    const {access_token, expires_in, refresh_token} = await result.json();

    localStorage.setItem('access_token', access_token);
    localStorage.setItem('expires_at', (parseInt(expires_in) * 1000) + parseInt(Date.now()));
    localStorage.setItem('refresh_token', refresh_token);
}

export async function currentTrack() {
    let name = '[none]';
    let artists = 'N/A';

    try {
        const result = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
            method: "GET", headers: {Authorization: `Bearer ${await getAccessToken()}`}
        });

        const response = await result.json();
        name = response.item.name;
        artists = response.item.artists.map(artist => artist.name).join(", ");
    } catch (e) {
        console.log('No tunes playing');
    }

    return {name: name, artists: artists}
}

export async function recentTracks() {
    let recentTracks = [];

    try {
        if (!localStorage.getItem('previous_after')) {
            localStorage.setItem('previous_after', parseInt(Date.now() - (60 * 60 * 2 * 1000)));
        }

        const after = localStorage.getItem('previous_after');
        const result = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20&after=" + after, {
            method: "GET", headers: {Authorization: `Bearer ${await getAccessToken()}`}
        });

        const response = await result.json();

        response.items.forEach(track => {
            recentTracks.push({
                name: track.track.name,
                artists: track.track.artists.map(artist => artist.name).join(", ")
            });
        });

        let registeredTracks = [];
        const storedTracks = localStorage.getItem('awaits_tracks_registration');
        if (storedTracks) {
            try {
                const registeredTracks = JSON.parse(storedTracks);
            } catch (e) {
            }
        }

        response.items.forEach(track => {
            if (!storedTracks || !registeredTracks.includes(track.track.uri)) {
                registeredTracks.push(track.track.uri);
            }
        })

        localStorage.setItem('awaits_tracks_registration', JSON.stringify(registeredTracks));

    } catch (e) {
        console.error('No recent tracks');
    }

    return recentTracks;
}

export async function getPlaylists() {
    const playlists = [];

    try {
        const result = await fetch("https://api.spotify.com/v1/me/playlists", {
            method: "GET", headers: {Authorization: `Bearer ${await getAccessToken()}`}
        });

        const response = await result.json();

        response.items.forEach(playlist => {
            playlists.push({id: playlist.id, name: playlist.name});
        });
    } catch (e) {
    }

    return playlists;
}

async function getPlaylistTracks(playlistId) {
    const tracks = [];

    try {
        const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
            method: "GET", headers: {Authorization: `Bearer ${await getAccessToken()}`}
        });

        const response = await result.json();
        response.tracks.items.forEach(track => {
            tracks.push(track.track.uri);
        })
    } catch (e) {
        throw new Error('Failed to fetch playlist tracks');
    }

    return tracks;
}

export async function synchroniseTracks(playlistId) {
    if (playlistId === 0) {
        return;
    }

    let existingTracks = [];
    try {
        existingTracks = await getPlaylistTracks(playlistId);
    } catch (e) {
        alert('Failed to fetch playlist data for given playlist.');
        return;
    }

    const storedTracks = localStorage.getItem('awaits_tracks_registration');
    if (storedTracks) {
        const trackList = JSON.parse(storedTracks);

        // Remove duplicates
        const newTracks = [];
        trackList.forEach(track => {
            if (!existingTracks.includes(track)) {
                newTracks.push(track);
            }
        });

        if (newTracks) {
            // Chunck to limit 100 tracks per request
            const chunkSize = 99;
            for (let i = 0; i < newTracks.length; i += chunkSize) {
                const chunk = newTracks.slice(i, i + chunkSize);

                await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                    method: "POST",
                    headers: {Authorization: `Bearer ${await getAccessToken()}`, "Content-Type": "application/json"},
                    body: JSON.stringify({uris: chunk}),
                });
            }
        }
    }

    localStorage.setItem('awaits_tracks_registration', '');
}

export async function fetchProfile() {
    const result = await fetch("https://api.spotify.com/v1/me", {
        method: "GET", headers: {Authorization: `Bearer ${await getAccessToken()}`}
    });

    return await result.json();
}

export function populateProfile(profile) {
    document.getElementById("displayName").innerText = profile.display_name;
}

export function populateCurrent(track) {
    document.getElementById("currentTrackName").innerText = track.name;
    document.getElementById("currentTrackArtist").innerText = track.artists;
}

export function populatePrevious(tracks) {
    const list = document.getElementById("previousTracks");
    list.innerHTML = '';

    tracks.forEach(track => {
        const item = document.createElement("li");
        const name = document.createElement("h3");
        name.innerText = track.name;

        const artists = document.createElement("p");
        artists.innerText = track.artists;

        item.appendChild(name);
        item.appendChild(artists);

        list.appendChild(item);
    });
}

export function populatePlaylists(playlists) {
    const list = document.getElementById("playlists");
    list.innerHTML = '';

    const defaultItem = document.createElement("option");
    defaultItem.text = "Select playlist";
    defaultItem.value = 0;
    list.appendChild(defaultItem);

    playlists.forEach(playlist => {
        const item = document.createElement("option");
        item.text = playlist.name;
        item.value = playlist.id;

        list.appendChild(item);
    });
}
