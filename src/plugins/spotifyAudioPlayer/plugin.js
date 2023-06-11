import browser from '../../scripts/browser';
import { appHost } from '../../components/apphost';
import profileBuilder from '../../scripts/browserDeviceProfile';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';
import ServerConnections from '../../components/ServerConnections';
import toast from '../../components/toast/toast';

function getDefaultProfile() {
    return profileBuilder({});
}

let fadeTimeout;
function fade(instance, elem, startingVolume) {
    instance._isFadingOut = true;

    // Need to record the starting volume on each pass rather than querying elem.volume
    // This is due to iOS safari not allowing volume changes and always returning the system volume value
    const newVolume = Math.max(0, startingVolume - 0.15);
    console.debug('fading volume to ' + newVolume);
    elem.volume = newVolume;

    if (newVolume <= 0) {
        instance._isFadingOut = false;
        return Promise.resolve();
    }

    return new Promise(function(resolve, reject) {
        cancelFadeTimeout();
        fadeTimeout = setTimeout(function() {
            fade(instance, elem, newVolume).then(resolve, reject);
        }, 100);
    });
}

function cancelFadeTimeout() {
    const timeout = fadeTimeout;
    if (timeout) {
        clearTimeout(timeout);
        fadeTimeout = null;
    }
}

function supportsFade() {
    // Not working on tizen.
    // We could possibly enable on other tv's, but all smart tv browsers tend to be pretty primitive
    return !browser.tv;
}

class SpotifyToken {
    constructor() {
        this.token = null;
        this.getPromise = null;
        this.devices = null;
    }

    isValidDevice(deviceId) {
        if (this.devices === null) {
            // our access token has not been verified !
            console.log("Warning, checking for a valid device but the access token has not been verified yet");
            return false;
        }

        for (const dev of this.devices) {
            if (dev.id == deviceId) {
                return true;
            }
        }

        console.log(`Current deviceId ${deviceId} has not been found among valid devices ${JSON.stringify(this.devices)}`)
        return false;
    }

    markInvalid() {
        if (this.getPromise === null) {
            // Token is not currently being renewed, we can set it to null
            this.token = null;
        }
    }

    async getDevices() {
        let req = new Request("https://api.spotify.com/v1/me/player/devices", {
            method: "GET",
            headers: { Authorization: `Bearer ${this.token}` }
        });
        let resp = await fetch(req);
        // let json = await resp.json();
        console.log(`Spotify get devices status : ${resp.status}`);
        if (resp.status >= 200 && resp.status < 300) {
            // Token valid
            const body = await resp.json();
            this.devices = body.devices;
            return true;
        } else if (resp.status >= 400 && resp.status < 500) {
            // Token invalid, refresh token
            console.log("Spotify API token probably expired, invalidate it");
            this.token = null;
        } else {
            console.log("Spotify API Server error");
        }

        return false;
    }

    async get() {
        if (this.getPromise !== null) {
            console.log("Token get/refresh already in progress, waiting for existing promise to resolve");
            return await Promise.resolve(this.getPromise);
        }

        console.log("Starting Token get/refresh");
        this.getPromise = this.getOrRefresh();
        let token = null;
        try {
            token = await Promise.resolve(this.getPromise);
        } catch (error) {
            throw error;
        } finally {
            console.log("Token get/refresh ended");
            this.getPromise = null; // Get/Refresh is done (or failed)
        }

        return token;
    }

    async getOrRefresh() {
        const apiClient = ServerConnections.currentApiClient();
        if (this.token === null) {
            // We don't have any token, get one
            const tokenUrl = apiClient.getUrl('Spotify/AccessToken');
            let resp = await apiClient.getJSON(tokenUrl);
            console.log(`Spotify auth, get token response : ${JSON.stringify(resp)}`);
            if (resp.AccessToken !== undefined && resp.AccessToken !== null) {
                this.token = resp.AccessToken;
            } else if (resp.RedirectURL !== undefined && resp.RedirectURL !== null) {
                window.location.assign(resp.RedirectURL);
            } else {
                throw new Error(`Invalid response from server ${JSON.stringify(resp)}`);
            }
        }

        // Check current token validity
        if (!await this.getDevices()) {
            // We couldn't get the devices, this token must have expired, refresh it
            const tokenUrl = apiClient.getUrl('Spotify/RefreshToken');
            let resp = await apiClient.getJSON(tokenUrl);
            console.log(`Spotify auth, refresh token response : ${JSON.stringify(resp)}`);
            if (resp.AccessToken !== undefined && resp.AccessToken !== null) {
                this.token = resp.AccessToken;
            } else if (resp.RedirectURL !== undefined && resp.RedirectURL !== null) {
                window.location.assign(resp.RedirectURL);
            } else {
                throw new Error(`Invalid response from server ${JSON.stringify(resp)}`);
            }

            if (!await this.getDevices()) {
                // This shouldn't happen, it means spotify sent us an invalid refreshed token.
                throw new Error("Error, refreshed token is still invalid");
            }
        };

        if (this.token === null) {
            console.log("Error, token should never be null here !");
            throw new Error("Spotify token.get() bug");
        }

        return this.token;
    }
}

class SpotifyAudioPlayer {
    constructor() {
        this.connecting = false;
        this.connectingPromise = null;
        this.name = 'Spotify Audio Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'spotifyaudioplayer';
        this.isLocalPlayer = true; // We play in this browser not a different one
        this.token = new SpotifyToken();
        this.authTries = 0;
        this.playerInstance = null;
        this.updateInterval = null;
        this.state = {
            duration: 0,
            paused: true,
            repeatMode: 0,
            position: 0,
            volume: 50,
            muted: false,
            lastCheck: new Date(),
        };

        // Let any players created by plugins take priority
        this.priority = 1;
        this.initializeSpotify();
    }

    async play(options) {
        this._started = false;
        this._timeUpdated = false;
        this._currentTime = 0;
        this.state.lastCheck = new Date();
        this.state.duration = 0;
        this.state.position = 0;
        const token = await this.token.get(); // This should always return a valid access token (or throw an error);
        const status = await this.ensureConnected();
        if (!status) {
            console.log(`spotify play, cannot play ${options.item.Name} because access token is null and reconnection failed`);
            return;
        }

        console.debug('spotify play : ' + options.item.Path);
        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
        }

        this.updateInterval = setInterval(() => this.onTimeUpdate(), 1000);
        try {
            const uri = `spotify:track:${options.item.Path.split("/").reverse()[0]}`;
            let req = new Request(`https://api.spotify.com/v1/me/player/play?device_id=${this.playerInstance.device_id}`, {
                method: "PUT",
                body: JSON.stringify({
                    // TOOD: start at options.playerStartPositionTicks
                    uris: [uri],
                }),
                headers: { Authorization: `Bearer ${token}` }
            });

            Events.trigger(this, 'waiting');
            // Workaround spotify web playback bug on new play :
            // We sometimes get 502 bad gateways when the current player is still playing).
            await this.player.pause();
            let resp = await fetch(req);
            console.log(`spotify play response : ${resp.status} | ${resp.statusText}`);
            if (resp.status >= 200 && resp.status < 300) {
                this._currentSrc = uri;
                await this.player.resume(); // Workaround spotify web playback bug on first play
                Events.trigger(this, 'playing');
            } else if (resp.status == 401) {
                console.log("Spotify API authorization error");
                toast("Spotify player not connected, reconnecting...");
                clearInterval(this.updateInterval);
                this.ensureConnected(true); // no need to await here, there's no point if we don't retry, and if we do this.play() will wait anyway
                if (options.retry !== false) {
                    options.retry = false;
                    this.play(options);
                }
            } else if (resp.status == 403) {
                toast("Spotify player connection error.");
                // This indicates a bug somewhere and is probably not something we can recover from.
                console.error("Spotify API play OAuth error");
                clearInterval(this.updateInterval);
            } else if (resp.status == 404) {
                // This happens when the device id is not valid anymore
                toast("Spotify player connection expired, reconnecting...");
                console.error("Spotify API device not found");
                this.playerInstance = null;
                clearInterval(this.updateInterval);
                this.ensureConnected(true); // no need to await here, there's no point if we don't retry, and if we do this.play() will wait anyway
                if (options.retry !== false) {
                    options.retry = false;
                    this.play(options);
                }
            } else if (resp.status == 429) {
                // TODO: handle rate-limiting somehow ?
                console.log("Spotify API play failed because of rate-limiting");
            } else if (resp.status >= 500) {
                // Server error, wait a bit and retry (once)
                const self = this;
                if (options.retry !== false) {
                    options.retry = false;
                    setTimeout(() => self.play(options), 1000);
                }
            }
        } catch (e) {
            console.log(`spotify play error : ${e}`);
            clearInterval(this.updateInterval);
            return e;
        }
    }

    async spotifyAuth(cb) {
        try {
            cb(await this.token.get());
        } catch (error) {
            console.log(`Spotify get/refresh token error : ${error.message}`);
            cb(); // cb *has* to be called, otherwise the player.connect() promise will never resolve/reject
        }
    }

    initializeSpotify() {
        if (document.querySelector('.spotify-load') !== null) {
            // spotify alread intialized
            return;
        }

        window.onSpotifyWebPlaybackSDKReady = () => {
            this.player = new Spotify.Player({
                name: 'Jellyfin',
                getOAuthToken: (cb) => this.spotifyAuth(cb),
                volume: 0.5 // TODO: Can we get the global volume somewhere ?
            });

            this.player.addListener('player_state_changed', (state) => {
                this.spotifyStateChanged(state);
            });

            this.player.addListener('not_ready', ({ device_id }) => {
                // This event can fire after a successful initialization, so we don't reject the promise here
                console.log(`Spotify client ${device_id} has gone offline`);
            });

            this.player.on('playback_error', ({ message }) => {
                console.log('Failed to perform playback', message);
            });

            this.ensureConnected();
        }

        const spotifyEl = document.createElement('script');
        spotifyEl.setAttribute('src', 'https://sdk.scdn.co/spotify-player.js');
        spotifyEl.setAttribute('id', 'spotify-load');
        document.head.insertAdjacentElement('beforeend', spotifyEl);
    }

    async ensureConnected(forceReconnect) {
        // Are we already connecting ?
        if (this.connecting) {
            console.log("Ignoring spotify reconnection request because one is already in progress");
            return await Promise.resolve(this.connectingPromise);
        }

        // We are forced to reconnect, or we never connected at all, or we tried to connect but it failed :
        if (forceReconnect === true || this.connectingPromise === null || this.playerInstance === null || !this.token.isValidDevice(this.playerInstance.device_id)) {
            this.connectingPromise = this.spotifyReconnect();
            let connectionResult = await Promise.resolve(this.connectingPromise);
            if (connectionResult) {
                toast("Spotify player connected.");
            } else {
                toast("Spotify player connection failed.");
            }
            return connectionResult;
        }

        // We are already connected
        return true;
    }

    async spotifyReconnect() {
        let status = false;
        this.connecting = true;
        try {
            await this.player.disconnect(); // The doc says player.disconnect() returns void. It's a lie : It returns a promise that resolves to void.

            this.player.removeListener('ready');
            this.player.removeListener('initialization_error');
            this.player.removeListener('authentication_error');
            this.player.removeListener('account_error');
            const self = this;
            const readyPromise = new Promise((resolve, reject) => {
                self.player.addListener('ready', (instance) => {
                    // Called (once?) when the spotify player is connected
                    console.log('Spotify client ready with Device ID ', instance.device_id);
                    self.authTries = 0; // We have successfully logged-in, reset auth try counter.
                    self.playerInstance = instance;
                    resolve();
                });

                self.player.on('initialization_error', ({ message }) => {
                    console.error(`Spotify client init error ${message}`);
                    reject();
                });

                self.player.on('authentication_error', ({ message }) => {
                    self.token.markInvalid(); // This token must be invalid, this shouldn't happen if we take care to use this.token.get() in the spotifyAuth callback
                    console.error(`Spotify client auth error ${message}`);
                    reject();
                });

                self.player.on('account_error', ({ message }) => {
                    console.error(`Spotify client account error ${message}`);
                    reject();
                });
            });

            // Warning, if the callback in spotifyAuth is never executed player.connect() will never resolve or reject.
            status = await this.player.connect();
            if (status) {
                console.log("Spotify player connection succeeded");
                // Make sure the player is ready :
                let timeoutId = null;
                await Promise.race([readyPromise, new Promise((resolve, reject) => {
                    timeoutId = setTimeout(() => {
                        // if we're neither ready nor failed after 2s assume something has gone wrong
                        // TODO: retry connection ?
                        console.log("Spotify client ready timeout expired");
                        timeoutId = null;
                        reject();
                    }, 3000);
                })]);
                if (timeoutId !== null) {
                    // This is just to prevent a spurious 'timeout expired' message on the console
                    clearTimeout(timeoutId);
                }
            } else {
                console.log("Spotify player connection failed");
            }
        } catch (error) {
            console.log(`Spotify player reconnect error : ${error}`);
            status = false;
            this.playerInstance = null;
        }

        this.connecting = false;
        return status;
    }

    destroy() {
        console.debug('spotify destroy');
        // Nothing to destroy
    }

    onEnded() {
        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
        }

        this.state.position = 0;
        this._currentTime = 0;
        this._currentSrc = null;
        this.state.duration = 0;
        Events.trigger(this, 'stopped');
    }

    async stop(destroyPlayer) {
        // cancelFadeTimeout();
        console.debug('spotify stop, destroyPlayer : ' + destroyPlayer);
        await this.player.pause();
        this.onEnded();
        Events.trigger(this, 'timeupdate');
        if (destroyPlayer) {
            this.destroy();
        }
    }

    onTimeUpdate() {
        this.updateSpotifyStatus(); // This may start an async state update
        // console.log("Spotify plugin onTimeUpdate");

        // Don't trigger events after user stop
        if (!this._isFadingOut) {
            Events.trigger(this, 'timeupdate');
        }
    }

    spotifyStateChanged(state) {
        // Status sent by spotify often seems to differ from reality. Hum, except position maybe ?
        if (state === null) {
            return;
        }

        // console.log(`Spotify status change : duration ${state.duration}`);
        // console.log(`Spotify status change : loading ${state.loading}`);
        // console.log(`Spotify status change : paused ${state.paused}`);
        // console.log(`Spotify status change : position ${state.position}`);
        // console.log(`Spotify status change : repeat_mode ${state.repeat_mode}`);
        // console.log(`Spotify status change : shuffle ${state.shuffle}`);

        if (this.state.duration != 0) {
            // We may be stopped
            this.state.position = state.position;
        }

        this.state.duration = state.duration;
        if (state.paused != this.state.paused) {
            this.state.paused = state.paused;
            if (state.paused) {
                console.log(`Spotify initiated pause event. Current duration ${state.duration}, position ${state.position}`);
                if (state.position == 0) {
                    // This track has ended
                    this.onEnded();
                } else {
                    Events.trigger(this, 'pause');
                }
            } else {
                Events.trigger(this, 'unpause');
            }
        }

        this.state.lastCheck = new Date();
    }

    async updateSpotifyStatus() {
        const now = new Date();
        const timeDiff = (now - this.state.lastCheck);
        if (!this.state.paused) {
            this._currentTime = this.state.position + timeDiff; // Estimate currentTime from last known position + time since check
        } else {
            this._currentTime = this.state.position;
        }

        if (timeDiff > 5*1000) {
            // We haven't checked the status for more than 10s, do a refresh
            const state = await this.player.getCurrentState();
            if (!state) {
                // Not playing
                this._currentSrc = null;
            }

            this.spotifyStateChanged(state);
            if (!this.state.muted) {
                this.state.volume = Math.floor((await this.player.getVolume())*100);
            }
        }
    }

    currentSrc() {
        return this._currentSrc;
    }

    canPlayMediaType(mediaType) {
        return (mediaType || '').toLowerCase() === 'audio';
    }

    canPlayItem() {
        // Does not play server items
        return false;
    }

    canPlayUrl(url) {
        console.debug(`Spotify player, can play url ${url}`);
        return url.toLowerCase().indexOf('api.spotify.com') !== -1;
    }

    getDeviceProfile(item) {
        // console.log(`Spotify plugin getDeviceProfile : ${item}`);
        if (appHost.getDeviceProfile) {
            return appHost.getDeviceProfile(item);
        }

        return getDefaultProfile();
    }

    currentTime(newTime) {
        const self = this;
        if (newTime !== null && newTime !== undefined) {
            this.player.seek(newTime).then(() => {
                self._currentTime = newTime;
                self.state.position = newTime;
                self.state.lastCheck = new Date();
                Events.trigger(self, 'timeupdate');
            })
        }

        return this._currentTime;
    }

    duration() {
        console.log("Spotify plugin duration");
        return this.state.duration;
    }

    seekable() {
        console.log("Spotify plugin seekable");
        return true;
    }

    getBufferedRanges() {
        // console.log("Spotify plugin getBufferedRanges");
        // We can't get this info from the player
        return [];
    }

    async pause() {
        console.log("Spotify plugin pause");
        await this.player.pause();
        this.state.paused = true;
        Events.trigger(this, 'pause');
    }

    // This is a retry after error
    resume() {
        this.unpause();
    }

    async unpause() {
        console.log("Spotify plugin unpause");
        await this.player.resume();
        this.state.paused = false;
        Events.trigger(this, 'unpause');
    }

    paused() {
        return this.state.paused;
    }

    setVolume(val) {
        console.log(`Spotify set volume to ${val}`);
        this.player.setVolume(val/100);
        this.state.volume = val;
    }

    getVolume() {
        return this.state.volume;
    }

    volumeUp() {
        console.log("Spotify setVolumeUp");
        this.setVolume(Math.min(this.getVolume() + 2, 100));
    }

    volumeDown() {
        console.log("Spotify setVolumeDown");
        this.setVolume(Math.max(this.getVolume() - 2, 0));
    }

    setMute(mute) {
        console.log(`Spotify setMute ${mute}`);
        if (mute) {
            this.state.muted = true;
            this.player.setVolume(0);
        } else {
            this.state.muted = false;
            this.player.setVolume(this.state.volume/100);
        }

        Events.trigger(this, 'volumechange');
    }

    isMuted() {
        return this.state.muted;
    }

    supports(feature) {
        return false; // We don't support any feature
    }
}

export default SpotifyAudioPlayer;
