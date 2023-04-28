import browser from '../../scripts/browser';
import { appHost } from '../../components/apphost';
import * as htmlMediaHelper from '../../components/htmlMediaHelper';
import profileBuilder from '../../scripts/browserDeviceProfile';
import { getIncludeCorsCredentials } from '../../scripts/settings/webSettings';
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

function requireHlsPlayer(callback) {
    import('hls.js/dist/hls.js').then(({ default: hls }) => {
        hls.DefaultConfig.lowLatencyMode = false;
        hls.DefaultConfig.backBufferLength = Infinity;
        hls.DefaultConfig.liveBackBufferLength = 90;
        window.Hls = hls;
        callback();
    });
}

function enableHlsPlayer(url, item, mediaSource, mediaType) {
    if (!htmlMediaHelper.enableHlsJsPlayer(mediaSource.RunTimeTicks, mediaType)) {
        return Promise.reject();
    }

    if (url.indexOf('.m3u8') !== -1) {
        return Promise.resolve();
    }

    // issue head request to get content type
    return new Promise(function(resolve, reject) {
        import('../../components/fetchhelper').then((fetchHelper) => {
            fetchHelper.ajax({
                url: url,
                type: 'HEAD'
            }).then(function(response) {
                const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
                if (contentType === 'application/vnd.apple.mpegurl' || contentType === 'application/x-mpegurl') {
                    resolve();
                } else {
                    reject();
                }
            }, reject);
        });
    });
}

class SpotifyAudioPlayer {
    constructor() {
        const self = this;

        self.name = 'Spotify Audio Player';
        self.type = PluginType.MediaPlayer;
        self.id = 'spotifyaudioplayer';
        self.isLocalPlayer = true; // We play in this browser not a different one
        self.token = null;
        self.authTries = 0;
        self.playerInstance = null;

        // Let any players created by plugins take priority
        self.priority = 1;
        initializeSpotify();
        console.debug('spotify play, spotify ready');

        self.play = async function(options) {
            self._started = false;
            self._timeUpdated = false;
            self._currentTime = null;

            // self.player.togglePlay().then((res) => console.log("Toggle play ", res));
            if (self.token === null) {
                // This should only happen while we are requesting a new token in spotifyAuth.
                console.log(`spotify play, cannot play ${options.item.Name} because access token is null`);
                return;
            }

            console.debug('spotify play : ' + JSON.stringify(options));
            try {
                let req = new Request(`https://api.spotify.com/v1/me/player/play?device_id=${self.playerInstance.device_id}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        uris: [`spotify:track:${options.item.Path.split("/").reverse()[0]}`],
                    }),
                    headers: { Authorization: `Bearer ${self.token}` }
                });

                let resp = await fetch(req);
                console.log(`spotify play response : ${JSON.stringify(resp)}`);
            } catch (e) {
                console.log(`spotify play error : ${e}`);
                return e;
            }
        };

        async function spotifyAuth(cb) {
            const apiClient = ServerConnections.currentApiClient();
            let tokenUrl = null;
            if (self.authTries == 0 && self.token !== null) {
                // We have a cached token and we haven't tried to use it yet
                self.authTries += 1;
                return cb(resp.AccessToken);
            } else if (self.authTries > 0 && self.token !== null) {
                // We've tried to auth with this token before and it doesn't work. Invalidate it then try to refresh.
                self.token = null;
                tokenUrl = apiClient.getUrl('Spotify/RefreshToken');
            } else if (self.token == null) {
                // We don't have any cached token, get one
                tokenUrl = apiClient.getUrl('Spotify/AccessToken');
            }

            try {
                let resp = await apiClient.getJSON(tokenUrl);
                console.log(`Spotify auth, get/refresh token response : ${JSON.stringify(resp)}`);
                if (resp.AccessToken != null) {
                    self.token = resp.AccessToken;
                    self.authTries += 1;
                    cb(resp.AccessToken);
                } else if (resp.RedirectURL != null) {
                    window.location.assign(resp.RedirectURL);
                }
            } catch (error) {
                console.log(`Spotify auth with refreshed token, RefreshToken error : ${JSON.stringify(error)}`);
            }
        }

        function initializeSpotify() {
            if (document.querySelector('.spotify-load') !== null) {
                // spotify alread intialized
                return;
            }

            window.onSpotifyWebPlaybackSDKReady = () => {
                self.player = new Spotify.Player({
                    name: 'Jellyfin',
                    getOAuthToken: spotifyAuth,
                    volume: 0.5
                });

                self.player.addListener('ready', (instance) => {
                    // Called (once?) when the spotify player is connected
                    console.log('Spotify client ready with Device ID ', instance.device_id);
                    self.authTries = 0; // We have successfully logged-in, reset auth try counter.
                    self.playerInstance = instance;
                });

                self.player.addListener('player_state_changed', (state) => {
                    // Called (once?) when the spotify player is connected
                    console.log('Spotify client state changed : ', JSON.stringify(state));
                });

                self.player.addListener('not_ready', ({ device_id }) => {
                    // This event can fire after a successful initialization, so we don't reject the promise here
                    console.log(`Spotify client ${device_id} has gone offline`);
                });

                self.player.addListener('initialization_error', ({ message }) => {
                    console.error(`Spotify client init error ${message}`);
                });

                self.player.addListener('authentication_error', ({ message }) => {
                    self.token = null; // This token must be invalid
                    console.error(`Spotify client auth error ${message}`);
                });

                self.player.addListener('account_error', ({ message }) => {
                    console.error(`Spotify client account error ${message}`);
                });

                self.player.connect().then((status) => {
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

        function setCurrentSrc(elem, options) {
            unBindEvents(elem);
            bindEvents(elem);

            let val = options.url;
            console.debug('spotify playing url: ' + val);

            // Convert to seconds
            const seconds = (options.playerStartPositionTicks || 0) / 10000000;
            if (seconds) {
                val += '#t=' + seconds;
            }

            htmlMediaHelper.destroyHlsPlayer(self);

            self._currentPlayOptions = options;

            const crossOrigin = htmlMediaHelper.getCrossOriginValue(options.mediaSource);
            if (crossOrigin) {
                elem.crossOrigin = crossOrigin;
            }

            return enableHlsPlayer(val, options.item, options.mediaSource, 'Audio').then(function() {
                return new Promise(function(resolve, reject) {
                    requireHlsPlayer(async () => {
                        const includeCorsCredentials = await getIncludeCorsCredentials();

                        const hls = new Hls({
                            manifestLoadingTimeOut: 20000,
                            xhrSetup: function(xhr) {
                                xhr.withCredentials = includeCorsCredentials;
                            }
                        });
                        hls.loadSource(val);
                        hls.attachMedia(elem);

                        htmlMediaHelper.bindEventsToHlsPlayer(self, hls, elem, onError, resolve, reject);

                        self._hlsPlayer = hls;

                        self._currentSrc = val;
                    });
                });
            }, async () => {
                elem.autoplay = true;

                const includeCorsCredentials = await getIncludeCorsCredentials();
                if (includeCorsCredentials) {
                    // Safari will not send cookies without this
                    elem.crossOrigin = 'use-credentials';
                }

                return htmlMediaHelper.applySrc(elem, val, options).then(function() {
                    self._currentSrc = val;

                    return htmlMediaHelper.playWithPromise(elem, onError);
                });
            });
        }

        function bindEvents(elem) {
            elem.addEventListener('timeupdate', onTimeUpdate);
            elem.addEventListener('ended', onEnded);
            elem.addEventListener('volumechange', onVolumeChange);
            elem.addEventListener('pause', onPause);
            elem.addEventListener('playing', onPlaying);
            elem.addEventListener('play', onPlay);
            elem.addEventListener('waiting', onWaiting);
        }

        function unBindEvents(elem) {
            elem.removeEventListener('timeupdate', onTimeUpdate);
            elem.removeEventListener('ended', onEnded);
            elem.removeEventListener('volumechange', onVolumeChange);
            elem.removeEventListener('pause', onPause);
            elem.removeEventListener('playing', onPlaying);
            elem.removeEventListener('play', onPlay);
            elem.removeEventListener('waiting', onWaiting);
            elem.removeEventListener('error', onError); // bound in htmlMediaHelper
        }

        self.stop = function(destroyPlayer) {
            cancelFadeTimeout();
            console.debug('spotify stop : ' + destroyPlayer);

            const elem = self._mediaElement;
            const src = self._currentSrc;

            if (elem && src) {
                if (!destroyPlayer || !supportsFade()) {
                    elem.pause();

                    htmlMediaHelper.onEndedInternal(self, elem, onError);

                    if (destroyPlayer) {
                        self.destroy();
                    }
                    return Promise.resolve();
                }

                const originalVolume = elem.volume;

                return fade(self, elem, elem.volume).then(function() {
                    elem.pause();
                    elem.volume = originalVolume;

                    htmlMediaHelper.onEndedInternal(self, elem, onError);

                    if (destroyPlayer) {
                        self.destroy();
                    }
                });
            }
            return Promise.resolve();
        };

        self.destroy = function() {
            console.debug('spotify stop : ' + destroyPlayer);
            unBindEvents(self._mediaElement);
            htmlMediaHelper.resetSrc(self._mediaElement);
        };

        function createMediaElement() {
            let elem = self._mediaElement;

            if (elem) {
                return elem;
            }

            elem = document.querySelector('.mediaPlayerAudio');

            if (!elem) {
                elem = document.createElement('audio');
                elem.classList.add('mediaPlayerAudio');
                elem.classList.add('hide');

                document.body.appendChild(elem);
            }

            elem.volume = htmlMediaHelper.getSavedVolume();

            self._mediaElement = elem;

            return elem;
        }

        function onEnded() {
            htmlMediaHelper.onEndedInternal(self, this, onError);
        }

        function onTimeUpdate() {
            // Get the player position + the transcoding offset
            const time = this.currentTime;

            // Don't trigger events after user stop
            if (!self._isFadingOut) {
                self._currentTime = time;
                Events.trigger(self, 'timeupdate');
            }
        }

        function onVolumeChange() {
            if (!self._isFadingOut) {
                htmlMediaHelper.saveVolume(this.volume);
                Events.trigger(self, 'volumechange');
            }
        }

        function onPlaying(e) {
            if (!self._started) {
                self._started = true;
                this.removeAttribute('controls');

                htmlMediaHelper.seekOnPlaybackStart(self, e.target, self._currentPlayOptions.playerStartPositionTicks);
            }
            Events.trigger(self, 'playing');
        }

        function onPlay() {
            Events.trigger(self, 'unpause');
        }

        function onPause() {
            Events.trigger(self, 'pause');
        }

        function onWaiting() {
            Events.trigger(self, 'waiting');
        }

        function onError() {
            const errorCode = this.error ? (this.error.code || 0) : 0;
            const errorMessage = this.error ? (this.error.message || '') : '';
            console.error('spotify media element error: ' + errorCode.toString() + ' ' + errorMessage);

            let type;

            switch (errorCode) {
                case 1:
                    // MEDIA_ERR_ABORTED
                    // This will trigger when changing media while something is playing
                    return;
                case 2:
                    // MEDIA_ERR_NETWORK
                    type = 'network';
                    break;
                case 3:
                    // MEDIA_ERR_DECODE
                    if (self._hlsPlayer) {
                        htmlMediaHelper.handleHlsJsMediaError(self);
                        return;
                    } else {
                        type = 'mediadecodeerror';
                    }
                    break;
                case 4:
                    // MEDIA_ERR_SRC_NOT_SUPPORTED
                    type = 'medianotsupported';
                    break;
                default:
                    // seeing cases where Edge is firing error events with no error code
                    // example is start playing something, then immediately change src to something else
                    return;
            }

            htmlMediaHelper.onErrorInternal(self, type);
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
        console.debug("Spotify player, can play items ? I think not");
        return false;
    }

    canPlayUrl(url) {
        console.debug(`Spotify player, can play url ${url}`);
        return url.toLowerCase().indexOf('api.spotify.com') !== -1;
    }

    getDeviceProfile(item) {
        if (appHost.getDeviceProfile) {
            return appHost.getDeviceProfile(item);
        }

        return getDefaultProfile();
    }

    // Save this for when playback stops, because querying the time at that point might return 0
    currentTime(val) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            if (val != null) {
                mediaElement.currentTime = val / 1000;
                return;
            }

            const currentTime = this._currentTime;
            if (currentTime) {
                return currentTime * 1000;
            }

            return (mediaElement.currentTime || 0) * 1000;
        }
    }

    duration() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            const duration = mediaElement.duration;
            if (htmlMediaHelper.isValidDuration(duration)) {
                return duration * 1000;
            }
        }

        return null;
    }

    seekable() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            const seekable = mediaElement.seekable;
            if (seekable && seekable.length) {
                let start = seekable.start(0);
                let end = seekable.end(0);

                if (!htmlMediaHelper.isValidDuration(start)) {
                    start = 0;
                }
                if (!htmlMediaHelper.isValidDuration(end)) {
                    end = 0;
                }

                return (end - start) > 0;
            }

            return false;
        }
    }

    getBufferedRanges() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return htmlMediaHelper.getBufferedRanges(this, mediaElement);
        }

        return [];
    }

    pause() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.pause();
        }
    }

    // This is a retry after error
    resume() {
        this.unpause();
    }

    unpause() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.play();
        }
    }

    paused() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.paused;
        }

        return false;
    }

    setPlaybackRate(value) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.playbackRate = value;
        }
    }

    getPlaybackRate() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.playbackRate;
        }
        return null;
    }

    setVolume(val) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.volume = Math.pow(val / 100, 3);
        }
    }

    getVolume() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return Math.min(Math.round(Math.pow(mediaElement.volume, 1 / 3) * 100), 100);
        }
    }

    volumeUp() {
        this.setVolume(Math.min(this.getVolume() + 2, 100));
    }

    volumeDown() {
        this.setVolume(Math.max(this.getVolume() - 2, 0));
    }

    setMute(mute) {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            mediaElement.muted = mute;
        }
    }

    isMuted() {
        const mediaElement = this._mediaElement;
        if (mediaElement) {
            return mediaElement.muted;
        }
        return false;
    }

    supports(feature) {
        if (!supportedFeatures) {
            supportedFeatures = getSupportedFeatures();
        }

        return supportedFeatures.indexOf(feature) !== -1;
    }
}

let supportedFeatures;

function getSupportedFeatures() {
    const list = [];
    const audio = document.createElement('audio');

    if (typeof audio.playbackRate === 'number') {
        list.push('PlaybackRate');
    }

    return list;
}

export default SpotifyAudioPlayer;
