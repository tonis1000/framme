// Playlist Management Functions
// -----------------------------------------

/**
 * Load the internal playlist and update the sidebar.
 */
function loadMyPlaylist() {
    fetch('playlist.m3u')
        .then(response => response.text())
        .then(data => updateSidebarFromM3U(data))
        .catch(error => console.error('Fehler beim Laden der Playlist:', error));
}

/**
 * Load the external playlist and update the sidebar.
 */
function loadExternalPlaylist() {
    fetch('https://raw.githubusercontent.com/gdiolitsis/greek-iptv/refs/heads/master/ForestRock_GR')
        .then(response => response.text())
        .then(data => updateSidebarFromM3U(data))
        .catch(error => console.error('Fehler beim Laden der externen Playlist:', error));
}

/**
 * Placeholder function for loading the sports playlist.
 */
function loadSportPlaylist() {
    alert("Funktionalität für Sport-Playlist wird implementiert...");
}

/**
 * Fetch the resource from the given URL, with and without a CORS proxy.
 * @param {string} url - The URL of the resource.
 */
async function fetchResource(url) {
    let finalUrl = url;

    try {
        console.log('Trying with CORS proxy...');
        let response = await fetch('https://cors-anywhere.herokuapp.com/' + finalUrl);

        if (!response.ok) {
            console.log('CORS proxy request failed, trying HTTPS...');
            finalUrl = finalUrl.replace('http:', 'https:');
            response = await fetch('https://cors-anywhere.herokuapp.com/' + finalUrl);
        }

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.text();
        updateSidebarFromM3U(data);
    } catch (error) {
        console.error('Fehler beim Laden der Playlist mit CORS-Proxy:', error);
    }

    try {
        console.log('Trying without CORS proxy...');
        let response = await fetch(finalUrl);

        if (!response.ok) {
            console.log('Direct request failed, trying HTTPS...');
            finalUrl = finalUrl.replace('http:', 'https:');
            response = await fetch(finalUrl);
        }

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.text();
        updateSidebarFromM3U(data);
    } catch (error) {
        console.error('Fehler beim Laden der Playlist ohne CORS-Proxy:', error);
    }
}

// EPG Data Management Functions
// -----------------------------------------

let epgData = {};

/**
 * Load and parse the EPG data.
 */
function loadEPGData() {
    fetch('https://ext.greektv.app/epg/epg.xml')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data, "application/xml");
            const programmes = xmlDoc.getElementsByTagName('programme');
            Array.from(programmes).forEach(prog => {
                const channelId = prog.getAttribute('channel');
                const start = prog.getAttribute('start');
                const stop = prog.getAttribute('stop');
                const titleElement = prog.getElementsByTagName('title')[0];
                const descElement = prog.getElementsByTagName('desc')[0];
                if (titleElement) {
                    const title = titleElement.textContent;
                    const desc = descElement ? descElement.textContent : 'Keine Beschreibung verfügbar';
                    if (!epgData[channelId]) {
                        epgData[channelId] = [];
                    }
                    epgData[channelId].push({
                        start: parseDateTime(start),
                        stop: parseDateTime(stop),
                        title: title,
                        desc: desc
                    });
                }
            });
        })
        .catch(error => console.error('Fehler beim Laden der EPG-Daten:', error));
}

/**
 * Parse EPG datetime strings into Date objects.
 * @param {string} epgTime - The EPG datetime string.
 * @returns {Date|null} - The parsed Date object, or null if invalid.
 */
function parseDateTime(epgTime) {
    if (!epgTime || epgTime.length < 19) {
        console.error('Ungültige EPG-Zeitangabe:', epgTime);
        return null;
    }

    const year = parseInt(epgTime.substr(0, 4), 10);
    const month = parseInt(epgTime.substr(4, 2), 10) - 1;
    const day = parseInt(epgTime.substr(6, 2), 10);
    const hour = parseInt(epgTime.substr(8, 2), 10);
    const minute = parseInt(epgTime.substr(10, 2), 10);
    const second = parseInt(epgTime.substr(12, 2), 10);
    const tzHour = parseInt(epgTime.substr(15, 3), 10);
    const tzMin = parseInt(epgTime.substr(18, 2), 10) * (epgTime[14] === '+' ? 1 : -1);

    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute) || isNaN(second) || isNaN(tzHour) || isNaN(tzMin)) {
        console.error('Ungültige EPG-Zeitangabe:', epgTime);
        return null;
    }

    if (year < 0 || month < 0 || month > 11 || day < 1 || day > 31) {
        console.error('Ungültige EPG-Zeitangabe:', epgTime);
        return null;
    }

    return new Date(Date.UTC(year, month, day, hour - tzHour, minute - tzMin, second));
}

/**
 * Get the current program based on the time and channel ID.
 * @param {string} channelId - The ID of the channel.
 * @returns {Object} - The current program details.
 */
function getCurrentProgram(channelId) {
    const now = new Date();
    if (epgData[channelId]) {
        const currentProgram = epgData[channelId].find(prog => now >= prog.start && now < prog.stop);
        if (currentProgram) {
            const pastTime = now - currentProgram.start;
            const futureTime = currentProgram.stop - now;
            const totalTime = currentProgram.stop - currentProgram.start;
            const pastPercentage = (pastTime / totalTime) * 100;
            const futurePercentage = (futureTime / totalTime) * 100;
            const description = currentProgram.desc || 'Keine Beschreibung verfügbar';
            const start = currentProgram.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const end = currentProgram.stop.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const title = currentProgram.title.replace(/\s*\[.*?\]\s*/g, '').replace(/[\[\]]/g, '');

            return {
                title: `${title} (${start} - ${end})`,
                description: description,
                pastPercentage: pastPercentage,
                futurePercentage: futurePercentage
            };
        } else {
            return { title: 'Keine aktuelle Sendung verfügbar', description: 'Keine Beschreibung verfügbar', pastPercentage: 0, futurePercentage: 0 };
        }
    }
    return { title: 'Keine EPG-Daten verfügbar', description: 'Keine Beschreibung verfügbar', pastPercentage: 0, futurePercentage: 0 };
}

/**
 * Update the player description with the current program details.
 * @param {string} title - The title of the current program.
 * @param {string} description - The description of the current program.
 */
function updatePlayerDescription(title, description) {
    console.log('Updating player description:', title, description);
    document.getElementById('program-title').textContent = title;
    document.getElementById('program-desc').textContent = description;
}

/**
 * Update the next programs for a given channel.
 * @param {string} channelId - The ID of the channel.
 */
function updateNextPrograms(channelId) {
    console.log('Updating next programs for channel:', channelId);
    const nextProgramsContainer = document.getElementById('next-programs');
    nextProgramsContainer.innerHTML = '';

    if (epgData[channelId]) {
        const now = new Date();
        const upcomingPrograms = epgData[channelId]
            .filter(prog => prog.start > now)
            .slice(0, 4);

        upcomingPrograms.forEach(program => {
            const nextProgramDiv = document.createElement('div');
            nextProgramDiv.classList.add('next-program');

            const nextProgramTitle = document.createElement('h4');
            nextProgramTitle.classList.add('next-program-title');
            const start = program.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const end = program.stop.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const title = program.title.replace(/\s*\[.*?\]\s*/g, '').replace(/[\[\]]/g, '');
            nextProgramTitle.textContent = `${title} (${start} - ${end})`;

            const nextProgramDesc = document.createElement('p');
            nextProgramDesc.classList.add('next-program-desc');
            nextProgramDesc.textContent = program.desc || 'Keine Beschreibung verfügbar';
            nextProgramDesc.style.display = 'none';

            nextProgramDiv.appendChild(nextProgramTitle);
            nextProgramDiv.appendChild(nextProgramDesc);

            nextProgramTitle.addEventListener('click', function () {
                if (nextProgramDesc.style.display === 'none') {
                    nextProgramDesc.style.display = 'block';
                    updateProgramInfo(title, nextProgramDesc.textContent);
                } else {
                    nextProgramDesc.style.display = 'none';
                }
            });

            nextProgramsContainer.appendChild(nextProgramDiv);
        });
    }
}

// Sidebar Management Functions
// -----------------------------------------

/**
 * Update the sidebar from an M3U playlist.
 * @param {string} data - The M3U playlist data.
 */
async function updateSidebarFromM3U(data) {
    const sidebarList = document.getElementById('sidebar-list');
    sidebarList.innerHTML = '';

    const extractStreamURLs = (data) => {
        const urls = {};
        const lines = data.split('\n');
        let currentChannelId = null;

        lines.forEach(line => {
            if (line.startsWith('#EXTINF')) {
                const idMatch = line.match(/tvg-id="([^"]+)"/);
                currentChannelId = idMatch ? idMatch[1] : null;
                if (currentChannelId && !urls[currentChannelId]) {
                    urls[currentChannelId] = [];
                }
            } else if (currentChannelId && line.startsWith('http')) {
                urls[currentChannelId].push(line);
                currentChannelId = null;
            }
        });

        return urls;
    };

    const streamURLs = extractStreamURLs(data);
    const lines = data.split('\n');

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) {
            const idMatch = lines[i].match(/tvg-id="([^"]+)"/);
            const channelId = idMatch ? idMatch[1] : null;
            const nameMatch = lines[i].match(/,(.*)$/);
            const name = nameMatch ? nameMatch[1].trim() : 'Unbekannt';

            const imgMatch = lines[i].match(/tvg-logo="([^"]+)"/);
            const imgURL = imgMatch ? imgMatch[1] : 'default_logo.png';

            const streamURL = lines[i + 1].startsWith('http') ? lines[i + 1].trim() : null;

            if (streamURL) {
                try {
                    const programInfo = await getCurrentProgram(channelId);

                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <div class="channel-info" data-stream="${streamURL}" data-channel-id="${channelId}">
                            <div class="logo-container">
                                <img src="${imgURL}" alt="${name} Logo">
                            </div>
                            <span class="sender-name">${name}</span>
                            <span class="epg-channel">
                                <span>${programInfo.title}</span>
                                <div class="epg-timeline">
                                    <div class="epg-past" style="width: ${programInfo.pastPercentage}%"></div>
                                    <div class="epg-future" style="width: ${programInfo.futurePercentage}%"></div>
                                </div>
                            </span>
                        </div>
                    `;
                    sidebarList.appendChild(listItem);
                } catch (error) {
                    console.error(`Fehler beim Abrufen der EPG-Daten für Kanal-ID ${channelId}:`, error);
                }
            }
        }
    }

    checkStreamStatus();
}

/**
 * Check the status of the streams and mark the sidebar entries accordingly.
 */
function checkStreamStatus() {
    const sidebarChannels = document.querySelectorAll('.channel-info');
    sidebarChannels.forEach(channel => {
        const streamURL = channel.dataset.stream;
        if (streamURL) {
            fetch(streamURL)
                .then(response => {
                    if (response.ok) {
                        channel.classList.add('online');
                        channel.querySelector('.sender-name').style.color = 'lightgreen';
                        channel.querySelector('.sender-name').style.fontWeight = 'bold';
                    } else {
                        channel.classList.remove('online');
                        channel.querySelector('.sender-name').style.color = '';
                        channel.querySelector('.sender-name').style.fontWeight = '';
                    }
                })
                .catch(error => {
                    console.error('Fehler beim Überprüfen des Stream-Status:', error);
                    channel.classList.remove('online');
                    channel.querySelector('.sender-name').style.color = '';
                    channel.querySelector('.sender-name').style.fontWeight = '';
                });
        }
    });
}

// Player Management Functions
// -----------------------------------------

/**
 * Set the current channel name and stream URL.
 * @param {string} channelName - The name of the channel.
 * @param {string} streamUrl - The URL of the stream.
 */
function setCurrentChannel(channelName, streamUrl) {
    const currentChannelName = document.getElementById('current-channel-name');
    const streamUrlInput = document.getElementById('stream-url');
    currentChannelName.textContent = channelName;
    streamUrlInput.value = streamUrl;
}

/**
 * Update the clock display.
 */
function updateClock() {
    const now = new Date();
    const tag = now.toLocaleDateString('de-DE', { weekday: 'long' });
    const datum = now.toLocaleDateString('de-DE');
    const uhrzeit = now.toLocaleTimeString('de-DE', { hour12: false });
    document.getElementById('tag').textContent = tag;
    document.getElementById('datum').textContent = datum;
    document.getElementById('uhrzeit').textContent = uhrzeit;
}

/**
 * Play a stream in the video player.
 * @param {string} streamURL - The URL of the stream.
 * @param {string} [subtitleURL] - The URL of the subtitle track.
 */
function playStream(streamURL, subtitleURL) {
    const videoPlayer = document.getElementById('video-player');
    const subtitleTrack = document.getElementById('subtitle-track');

    // Subtitle setup
    if (subtitleURL) {
        subtitleTrack.src = subtitleURL;
        subtitleTrack.track.mode = 'showing';
    } else {
        subtitleTrack.src = '';
        subtitleTrack.track.mode = 'hidden';
    }

    // HLS.js integration
    if (Hls.isSupported() && streamURL.endsWith('.m3u8')) {
        const hls = new Hls();
        hls.loadSource(streamURL);
        hls.attachMedia(videoPlayer);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            videoPlayer.play();
        });
    } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl') && streamURL.endsWith('.m3u8')) {
        // Direct HLS for Safari
        videoPlayer.src = streamURL;
        videoPlayer.addEventListener('loadedmetadata', function () {
            videoPlayer.play();
        });
    } else if (streamURL.endsWith('.mpd')) {
        // MPEG-DASH streaming with dash.js
        const dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(videoPlayer, streamURL, true);
    } else if (videoPlayer.canPlayType('video/mp4') || videoPlayer.canPlayType('video/webm')) {
        // Direct MP4 or WebM streaming
        videoPlayer.src = streamURL;
        videoPlayer.play();
    } else {
        console.error('Stream-Format wird vom aktuellen Browser nicht unterstützt.');
    }
}

// Subtitle Management Functions
// -----------------------------------------

/**
 * Handle the subtitle file and display Greek subtitles.
 * @param {File} file - The subtitle file.
 */
function handleSubtitleFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
        const srtContent = event.target.result;
        const vttContent = convertSrtToVtt(srtContent);
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        const track = document.getElementById('subtitle-track');
        track.src = url;
        track.label = 'Griechisch';
        track.srclang = 'el';
        track.default = true;
    };
    reader.readAsText(file);
}

/**
 * Convert SRT content to VTT format.
 * @param {string} srtContent - The content of the SRT file.
 * @returns {string} - The converted VTT content.
 */
function convertSrtToVtt(srtContent) {
    // Convert SRT subtitle lines to VTT format
    const vttContent = 'WEBVTT\n\n' + srtContent
        .replace(/\r\n|\r|\n/g, '\n')
        .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4');

    return vttContent;
}


// Event Listeners for Buttons and Inputs
// -----------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    // Event listener for the Playlist button
    document.getElementById('playlist-button').addEventListener('click', function () {
        const playlistURL = document.getElementById('stream-url').value;
        if (playlistURL) {
            fetchResource(playlistURL);
        }
    });

    // Event listener for the Clear button
    document.getElementById('clear-button').addEventListener('click', function () {
        document.getElementById('stream-url').value = ''; // Clear the input field
    });

    // Event listener for the Copy button
    document.getElementById('copy-button').addEventListener('click', function () {
        var streamUrlInput = document.getElementById('stream-url');
        streamUrlInput.select(); // Select the text in the input field
        document.execCommand('copy'); // Copy the selected text to the clipboard
    });

    // Event listeners for Playlist URLs
    const playlistUrlsTitle = document.querySelector('.content-title[onclick="toggleContent(\'playlist-urls\')"]');
    if (playlistUrlsTitle) {
        playlistUrlsTitle.addEventListener('click', loadPlaylistUrls);
    } else {
        console.error('Element für den Klick-Event-Listener wurde nicht gefunden.');
    }

    // Event listener for the Filter Online button
    const filterOnlineButton = document.getElementById('filter-online-button');
    filterOnlineButton.addEventListener('click', function () {
        const items = document.querySelectorAll('#sidebar-list li');
        items.forEach(item => {
            const channelInfo = item.querySelector('.channel-info');
            if (channelInfo && channelInfo.classList.contains('online')) {
                item.style.display = ''; // Show online channels
            } else {
                item.style.display = 'none'; // Hide offline channels
            }
        });
    });

    // Event listener for the Show All button
    const showAllButton = document.getElementById('show-all-button');
    showAllButton.addEventListener('click', function () {
        const items = document.querySelectorAll('#sidebar-list li');
        items.forEach(item => {
            item.style.display = ''; // Show all channels
        });
    });

    // Event listener for the Search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function () {
        const filter = searchInput.value.toLowerCase();
        const sidebarList = document.getElementById('sidebar-list');
        const items = sidebarList.getElementsByTagName('li');

        let firstVisibleItem = null;

        Array.from(items).forEach(item => {
            const text = item.textContent || item.innerText;
            if (text.toLowerCase().includes(filter)) {
                item.style.display = ''; // Show the item
                if (!firstVisibleItem) {
                    firstVisibleItem = item; // Set the first visible item
                }
            } else {
                item.style.display = 'none'; // Hide the item
            }
        });

        // Event listener for the Enter key
        searchInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                if (firstVisibleItem) {
                    const streamURL = firstVisibleItem.querySelector('.channel-info').dataset.stream;
                    playStream(streamURL);
                }
            }
        });
    });

    // Load initial EPG data and set up clock update
    loadEPGData();
    updateClock();
    setInterval(updateClock, 1000);

    // Event listeners for playlist buttons
    document.getElementById('myPlaylist').addEventListener('click', loadMyPlaylist);
    document.getElementById('externalPlaylist').addEventListener('click', loadExternalPlaylist);
    document.getElementById('sportPlaylist').addEventListener('click', loadSportPlaylist);

    // Event listener for sidebar channel clicks
    const sidebarList = document.getElementById('sidebar-list');
    sidebarList.addEventListener('click', function (event) {
        const channelInfo = event.target.closest('.channel-info');
        if (channelInfo) {
            const channelId = channelInfo.dataset.channelId;
            const programInfo = getCurrentProgram(channelId);

            // Update the player with the current program
            setCurrentChannel(channelInfo.querySelector('.sender-name').textContent, channelInfo.dataset.stream);
            playStream(channelInfo.dataset.stream);

            // Update the program description
            updatePlayerDescription(programInfo.title, programInfo.description);

            // Update the next programs
            updateNextPrograms(channelId);

            // Show the logo of the selected channel
            const logoContainer = document.getElementById('current-channel-logo');
            const logoImg = channelInfo.querySelector('.logo-container img').src;
            logoContainer.src = logoImg;
        }
    });

    // Periodically check the stream status
    setInterval(checkStreamStatus, 60000);

    // Event listeners for the play button and input
    const playButton = document.getElementById('play-button');
    const streamUrlInput = document.getElementById('stream-url');
    const subtitleFileInput = document.getElementById('subtitle-file');

    const playStreamFromInput = () => {
        const streamUrl = streamUrlInput.value;
        const subtitleFile = subtitleFileInput.files[0];
        if (streamUrl) {
            if (subtitleFile) {
                handleSubtitleFile(subtitleFile);
            }
            playStream(streamUrl, subtitleFile ? document.getElementById('subtitle-track').src : null);
        }
    };

    playButton.addEventListener('click', playStreamFromInput);

    streamUrlInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            playStreamFromInput();
        }
    });

    subtitleFileInput.addEventListener('change', (event) => {
        const subtitleFile = event.target.files[0];
        if (subtitleFile) {
            handleSubtitleFile(subtitleFile);
        }
    });
});

// Utility Functions
// -----------------------------------------

/**
 * Toggle the content visibility.
 * @param {string} contentId - The ID of the content to toggle.
 */
function toggleContent(contentId) {
    const allContents = document.querySelectorAll('.content-body');
    allContents.forEach(content => {
        if (content.id === contentId) {
            content.classList.toggle('expanded');
        } else {
            content.classList.remove('expanded');
        }
    });
}

/**
 * Load the playlist URLs from playlist-urls.txt and update the sidebar.
 */
function loadPlaylistUrls() {
    fetch('playlist-urls.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('Netzwerkantwort war nicht ok.');
            }
            return response.text();
        })
        .then(data => {
            const playlistList = document.getElementById('playlist-url-list');
            playlistList.innerHTML = ''; // Clear the list to add new entries

            const lines = data.split('\n');
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine) {
                    const [label, url] = trimmedLine.split(',').map(part => part.trim());

                    if (label && url) {
                        const li = document.createElement('li');
                        const link = document.createElement('a');
                        link.textContent = label;
                        link.href = '#'; // Prevent the link from reloading the page
                        link.addEventListener('click', function (event) {
                            event.preventDefault(); // Prevent the link from reloading the page
                            document.getElementById('stream-url').value = url; // Set the URL in the stream-url input field

                            // After setting the URL in the input field
                            console.log('Versuche URL abzurufen:', url); // Debugging log
                            fetch(url)
                                .then(response => {
                                    if (!response.ok) {
                                        throw new Error('Netzwerkantwort war nicht ok.');
                                    }
                                    return response.text();
                                })
                                .then(data => {
                                    console.log('Daten erfolgreich geladen. Verarbeite M3U-Daten.'); // Debugging log
                                    updateSidebarFromM3U(data);
                                })
                                .catch(error => {
                                    console.error('Fehler beim Laden der Playlist:', error);
                                    alert('Fehler beim Laden der Playlist. Siehe Konsole für Details.'); // Optional: Inform the user
                                });
                        });

                        li.appendChild(link);
                        playlistList.appendChild(li);
                    } else {
                        console.warn('Zeile hat kein Label oder keine URL:', trimmedLine); // Debugging log for empty lines
                    }
                }
            });
        })
        .catch(error => {
            console.error('Fehler beim Laden der Playlist URLs:', error);
            alert('Fehler beim Laden der Playlist-URLs. Siehe Konsole für Details.'); // Optional: Inform the user
        });
}
