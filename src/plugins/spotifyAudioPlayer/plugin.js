import browser from '../../scripts/browser';
import { appHost } from '../../components/apphost';
import profileBuilder from '../../scripts/browserDeviceProfile';
import { PluginType } from '../../types/plugin.ts';
import Events from '../../utils/events.ts';
import ServerConnections from '../../components/ServerConnections';

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

class SpotifyAudioPlayer {
    constructor() {
        this.name = 'Spotify Audio Player';
        this.type = PluginType.MediaPlayer;
        this.id = 'spotifyaudioplayer';
        this.isLocalPlayer = true; // We play in this browser not a different one
        this.token = null;
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
        if (this.updateInterval !== null) {
            clearInterval(this.updateInterval);
        }
        this.updateInterval = setInterval(() => this.onTimeUpdate(), 2000);

        if (this.token === null) {
            // This should only happen while we are requesting a new token in spotifyAuth.
            console.log(`spotify play, cannot play ${options.item.Name} because access token is null`);
            return;
        }

        console.debug('spotify play : ' + JSON.stringify(options));
        try {
            const uri = `spotify:track:${options.item.Path.split("/").reverse()[0]}`;
            let req = new Request(`https://api.spotify.com/v1/me/player/play?device_id=${this.playerInstance.device_id}`, {
                method: "PUT",
                body: JSON.stringify({
                    // TOOD: start at options.playerStartPositionTicks
                    uris: [uri],
                }),
                headers: { Authorization: `Bearer ${this.token}` }
            });

            Events.trigger(this, 'waiting');
            let resp = await fetch(req);
            console.log(`spotify play response : ${resp.status} | ${resp.statusText}`);
            if (resp.status >= 200 && resp.status < 300) {
                this._currentSrc = uri;
                await this.player.resume(); // Try to workaround spotify web playback bug on first play
                Events.trigger(this, 'playing');
            } else if (resp.status == 401) {
                // TODO: refresh token
            } else if (resp.status == 403) {
                console.error("Spotify API play OAuth error");
            } else if (resp.status == 429) {
                // TODO: handle rate-limiting somehow ?
                console.log("Spotify API play failed because of rate-limiting");
            }

        } catch (e) {
            console.log(`spotify play error : ${e}`);
            return e;
        }
    }

    async spotifyAuth(cb) {
        const apiClient = ServerConnections.currentApiClient();
        let tokenUrl = null;
        if (this.authTries == 0 && this.token !== null) {
            // We have a cached token and we haven't tried to use it yet
            this.authTries += 1;
            return cb(this.token);
        } else if (this.authTries > 0 && this.token !== null) {
            // We've tried to auth with this token before and it doesn't work. Invalidate it, then try to refresh.
            this.token = null;
            tokenUrl = apiClient.getUrl('Spotify/RefreshToken');
        } else if (this.token == null) {
            // We don't have any cached token, get one
            tokenUrl = apiClient.getUrl('Spotify/AccessToken');
        }

        try {
            let resp = await apiClient.getJSON(tokenUrl);
            console.log(`Spotify auth, get/refresh token response : ${JSON.stringify(resp)}`);
            if (resp.AccessToken != null) {
                this.token = resp.AccessToken;
                this.authTries += 1;
                cb(resp.AccessToken);
            } else if (resp.RedirectURL != null) {
                window.location.assign(resp.RedirectURL);
            }
        } catch (error) {
            console.log(`Spotify auth with refreshed token, RefreshToken error : ${error}`);
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

            this.player.addListener('ready', (instance) => {
                // Called (once?) when the spotify player is connected
                console.log('Spotify client ready with Device ID ', instance.device_id);
                this.authTries = 0; // We have successfully logged-in, reset auth try counter.
                this.playerInstance = instance;
            });

            this.player.addListener('player_state_changed', (state) => {
                this.spotifyStateChanged(state);
            });

            this.player.addListener('not_ready', ({ device_id }) => {
                // This event can fire after a successful initialization, so we don't reject the promise here
                console.log(`Spotify client ${device_id} has gone offline`);
            });

            this.player.addListener('initialization_error', ({ message }) => {
                console.error(`Spotify client init error ${message}`);
            });

            this.player.addListener('authentication_error', ({ message }) => {
                this.token = null; // This token must be invalid
                console.error(`Spotify client auth error ${message}`);
            });

            this.player.addListener('account_error', ({ message }) => {
                console.error(`Spotify client account error ${message}`);
            });

            this.player.connect().then((status) => {
                if (status) {
                    console.log("Spotify player connect successful");
                }
            });
        }

        const spotifyEl = document.createElement('script');
        spotifyEl.setAttribute('src', 'https://sdk.scdn.co/spotify-player.js');
        spotifyEl.setAttribute('id', 'spotify-load');
        document.head.insertAdjacentElement('beforeend', spotifyEl);
    }

    destroy() {
        console.debug('spotify destroy');
        // Nothing to destroy
    }

    async stop(destroyPlayer) {
        // cancelFadeTimeout();
        console.debug('spotify stop, destroyPlayer : ' + destroyPlayer);
        if (self.updateInterval !== null) {
            clearInterval(self.updateInterval);
        }

        this.pause();
        this.state.position = 0;
        this._currentTime = 0;
        this._currentSrc = null;
        this.state.duration = 0;
        Events.trigger(this, 'timeupdate');
        Events.trigger(this, 'stopped');
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
        // Status sent by spotify seems to differ from reality. Hum, except position maybe ?
        if (state === null) {
            return;
        }

        // console.log(`Spotify status change : duration ${state.duration}`);
        // console.log(`Spotify status change : loading ${state.loading}`);
        // console.log(`Spotify status change : paused ${state.paused}`);
        // console.log(`Spotify status change : position ${state.position}`);
        // console.log(`Spotify status change : repeat_mode ${state.repeat_mode}`);
        // console.log(`Spotify status change : shuffle ${state.shuffle}`);

        this.state.position = state.position;
        this.state.duration = state.duration;
        if (state.paused != this.state.paused) {
            this.state.paused = state.paused;
            if (state.paused) {
                Events.trigger(this, 'pause');
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

        if (timeDiff > 10*1000) {
            // We haven't checked the status for more than 10s, do a refresh
            console.log("Spotify update stale status");
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
        console.log(`Spotify plugin currentSrc : ${this._currentSrc}`);
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
        if (newTime) {
            console.log(`Spotify plugin set currentTime : ${newTime}`);
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
        console.log(`Spotify plugin supports ${feature} ? No.`);
        return false; // We don't support any feature
    }
}

export default SpotifyAudioPlayer;
