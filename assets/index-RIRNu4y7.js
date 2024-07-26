(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))e(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&e(s)}).observe(document,{childList:!0,subtree:!0});function o(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function e(r){if(r.ep)return;r.ep=!0;const n=o(r);fetch(r.href,n)}})();const l="4ace2233e1cb4565918c80fdbfa696d2";async function f(t){const a=h(128),o=await y(a);localStorage.setItem("verifier",a);const e=new URLSearchParams;e.append("client_id",t),e.append("response_type","code"),e.append("redirect_uri","http://localhost:5173/callback"),e.append("scope","user-read-private user-read-email user-read-currently-playing user-read-recently-played playlist-modify-public playlist-modify-private playlist-read-collaborative"),e.append("code_challenge_method","S256"),e.append("code_challenge",o),document.location=`https://accounts.spotify.com/authorize?${e.toString()}`}function h(t){let a="",o="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";for(let e=0;e<t;e++)a+=o.charAt(Math.floor(Math.random()*o.length));return a}async function y(t){const a=new TextEncoder().encode(t),o=await window.crypto.subtle.digest("SHA-256",a);return btoa(String.fromCharCode.apply(null,[...new Uint8Array(o)])).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function d(){return localStorage.getItem("access_token")!==null}async function c(){const t=localStorage.getItem("expires_at");return t&&t<Date.now()&&await g(),localStorage.getItem("access_token")}async function g(){const t=localStorage.getItem("refresh_token"),a=new URLSearchParams;a.append("client_id",l),a.append("grant_type","refresh_token"),a.append("refresh_token",t);const o=await fetch("https://accounts.spotify.com/api/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:a}),{access_token:e,expires_in:r}=await o.json();localStorage.setItem("access_token",e),localStorage.setItem("expires_at",r+Date.now())}async function w(t,a){const o=localStorage.getItem("verifier"),e=new URLSearchParams;e.append("client_id",t),e.append("grant_type","authorization_code"),e.append("code",a),e.append("redirect_uri","http://localhost:5173/callback"),e.append("code_verifier",o);const r=await fetch("https://accounts.spotify.com/api/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:e}),{access_token:n,expires_in:s,refresh_token:i}=await r.json();localStorage.setItem("access_token",n),localStorage.setItem("expires_at",parseInt(s)*1e3+parseInt(Date.now())),localStorage.setItem("refresh_token",i)}async function k(){let t="[none]",a="N/A";try{const e=await(await fetch("https://api.spotify.com/v1/me/player/currently-playing",{method:"GET",headers:{Authorization:`Bearer ${await c()}`}})).json();t=e.item.name,a=e.item.artists.map(r=>r.name).join(", ")}catch{console.log("No tunes playing")}return{name:t,artists:a}}async function u(){let t=[];try{localStorage.getItem("previous_after")||localStorage.setItem("previous_after",parseInt(Date.now()-60*60*2*1e3));const a=localStorage.getItem("previous_after"),e=await(await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=20&after="+a,{method:"GET",headers:{Authorization:`Bearer ${await c()}`}})).json();e.items.forEach(s=>{t.push({name:s.track.name,artists:s.track.artists.map(i=>i.name).join(", ")})});let r=[];const n=localStorage.getItem("awaits_tracks_registration");if(n)try{const s=JSON.parse(n)}catch{}e.items.forEach(s=>{(!n||!r.includes(s.track.uri))&&r.push(s.track.uri)}),localStorage.setItem("awaits_tracks_registration",JSON.stringify(r))}catch{console.error("No recent tracks")}return t}async function S(){const t=[];try{(await(await fetch("https://api.spotify.com/v1/me/playlists",{method:"GET",headers:{Authorization:`Bearer ${await c()}`}})).json()).items.forEach(e=>{t.push({id:e.id,name:e.name})})}catch{}return t}async function _(t){const a=[];try{(await(await fetch(`https://api.spotify.com/v1/playlists/${t}`,{method:"GET",headers:{Authorization:`Bearer ${await c()}`}})).json()).tracks.items.forEach(r=>{a.push(r.track.uri)})}catch{throw new Error("Failed to fetch playlist tracks")}return a}async function T(t){if(t===0)return;let a=[];try{a=await _(t)}catch{alert("Failed to fetch playlist data for given playlist.");return}const o=localStorage.getItem("awaits_tracks_registration");if(o){const e=JSON.parse(o),r=[];if(e.forEach(n=>{a.includes(n)||r.push(n)}),r)for(let s=0;s<r.length;s+=99){const i=r.slice(s,s+99);await fetch(`https://api.spotify.com/v1/playlists/${t}/tracks`,{method:"POST",headers:{Authorization:`Bearer ${await c()}`,"Content-Type":"application/json"},body:JSON.stringify({uris:i})})}}localStorage.setItem("awaits_tracks_registration","")}async function v(){return await(await fetch("https://api.spotify.com/v1/me",{method:"GET",headers:{Authorization:`Bearer ${await c()}`}})).json()}function I(t){document.getElementById("displayName").innerText=t.display_name}function E(t){document.getElementById("currentTrackName").innerText=t.name,document.getElementById("currentTrackArtist").innerText=t.artists}function m(t){const a=document.getElementById("previousTracks");a.innerHTML="",t.forEach(o=>{const e=document.createElement("li"),r=document.createElement("h3");r.innerText=o.name;const n=document.createElement("p");n.innerText=o.artists,e.appendChild(r),e.appendChild(n),a.appendChild(e)})}function x(t){const a=document.getElementById("playlists");a.innerHTML="";const o=document.createElement("option");o.text="Select playlist",o.value=0,a.appendChild(o),t.forEach(e=>{const r=document.createElement("option");r.text=e.name,r.value=e.id,a.appendChild(r)})}const P=new URLSearchParams(window.location.search),p=P.get("code");d()?await c():p&&await w(l,p);if(d()){document.querySelector("#authenticated").style.display="flex",document.querySelector("#player").style.display="block",document.querySelector("#unauthenticated").style.display="none";const t=await v();I(t);const a=await k();E(a);const o=await u();m(o);const e=await S();x(e)}document.querySelector("#logout").addEventListener("click",()=>{localStorage.clear(),window.location.href=window.location.origin});document.querySelector("#login").addEventListener("click",()=>{f(l)});document.querySelector("#resetPreviousTracks").addEventListener("click",async()=>{localStorage.setItem("previous_after",parseInt(Date.now())),localStorage.setItem("awaits_tracks_registration",""),m(await u())});document.querySelector("#synchronizePlaylist").addEventListener("click",async()=>{const t=document.querySelector("#playlists").value;T(t)});
