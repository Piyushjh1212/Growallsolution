/* ==========================================================================
   VideoEngine.js - Fixed Purchase Validation & Fullscreen Integration
   ========================================================================== */

window.videoEngineData = window.videoEngineData || {
    localLecturesData: [],
    ytPlayerEngine: null,
    seekProgressInterval: null,
    isPlayerReady: false,
    isCoursePurchased: false // Check state for active purchase token
};

var dbClient = null;

function getDbClient() {
    // Prefer an already-created client exposed by config
    if (window._supabase && typeof window._supabase.from === 'function') return window._supabase;
    if (window.supabaseClient && typeof window.supabaseClient.from === 'function') return window.supabaseClient;
    // Older global `supabase` from CDN is the SDK namespace (has createClient), not an instance.
    // Avoid returning that because it doesn't have `.from()`.
    return null;
}

function getCourseIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('course_id') || "2"; 
}

function extractYoutubeId(url) {
    if (!url) return "kUMe1FH4CGY";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "kUMe1FH4CGY";
}

// User Purchase Validation Logic
async function checkUserPurchaseStatus(courseId) {
    try {
        const client = getDbClient();
        if (!client) {
            console.error('DB client not ready for purchase validation.');
            window.videoEngineData.isCoursePurchased = false;
            return;
        }

        // Purchases table se record status check kar rahe hain
        const { data, error } = await client
            .from('purchases')
            .select('*')
            .eq('course_id', courseId); 

        if (error) throw error;

        // Entry milte hi course unlock ho jayega
        if (data && data.length > 0) {
            window.videoEngineData.isCoursePurchased = true;
        } else {
            window.videoEngineData.isCoursePurchased = false;
        }
    } catch (e) {
        console.error("Purchase validation layer failure:", e.message);
        window.videoEngineData.isCoursePurchased = false;
    }
}

// 1. Fetch data based on URL course_id
async function loadCourseCurriculum() {
    try {
        const currentCourseId = getCourseIdFromURL();
        // Pehle purchase state check karenge
        await checkUserPurchaseStatus(currentCourseId);

        const client = getDbClient();
        if (!client) {
            console.error('DB client not ready for curriculum load.');
            const el = document.getElementById('vpp-playlist-container');
            if (el) el.innerHTML = `<p style="padding:20px; color:red;">Backend client not configured.</p>`;
            return;
        }

        const { data, error } = await client
            .from('lectures')
            .select('*')
            .eq('sub_category_id', currentCourseId)
            .order('lecture_number', { ascending: true });

        if (error) throw error;
        
        window.videoEngineData.localLecturesData = data;

        if (!data || data.length === 0) {
            document.getElementById('vpp-playlist-container').innerHTML = `<p style="padding:20px; color:red; font-size:0.9rem;">No lectures found for this course ID.</p>`;
            document.getElementById('vpp-video-title').innerText = "No Lecture Available";
            return;
        }

        renderPlaylist(data);

        if (window.videoEngineData.isPlayerReady && window.videoEngineData.ytPlayerEngine) {
            window.videoEngineData.ytPlayerEngine.loadVideoById(extractYoutubeId(data[0].video_url));
            updateMetaTextDetails(data[0]);
        } else {
            initializeNativePlayer(extractYoutubeId(data[0].video_url));
            updateMetaTextDetails(data[0]);
        }

    } catch (err) {
        console.error("Database connection failure:", err.message);
        document.getElementById('vpp-playlist-container').innerHTML = `<p style="padding:20px; color:red;">Connection Error.</p>`;
    }
}

window.onYouTubeIframeAPIReady = function() {
    window.videoEngineData.isPlayerReady = true;
    if (window.videoEngineData.localLecturesData.length === 0) {
        loadCourseCurriculum();
    }
};

// 2. Instantiate YouTube Object
function initializeNativePlayer(videoId) {
    const targetElement = document.getElementById('vpp-youtube-native-target');
    if (!targetElement) return;

    window.videoEngineData.ytPlayerEngine = new YT.Player('vpp-youtube-native-target', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'origin': window.location.origin,            // 👈 Origin issue fix karne ke liye
            'host': 'https://www.youtube-nocookie.com', // 👈 Privacy mode: Isse pause ke symbols band ho jayenge
            'controls': 0,                              // YouTube ke default controls off
            'rel': 0,                                   // Related videos off
            'modestbranding': 1,                        // YouTube logo kam karne ke liye
            'showinfo': 0,
            'autoplay': 1,
            'disablekb': 1                              // 👈 Keyboard spacebar shortcuts ko block karne ke liye
        },
        events: {
            'onReady': onPlayerEngineReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerEngineReady(event) {
    setupControlListeners();
    startProgressTimer();
    window.videoEngineData.ytPlayerEngine.setVolume(document.getElementById('vpp-volume-range').value);
    
    if (window.videoEngineData.localLecturesData.length > 0) {
        window.videoEngineData.ytPlayerEngine.playVideo();
    }
}

function onPlayerStateChange(event) {
    const playBtnIcon = document.getElementById('vpp-play-toggle').querySelector('i');
    if (event.data === YT.PlayerState.PLAYING) {
        playBtnIcon.className = "fa-solid fa-pause";
    } else {
        playBtnIcon.className = "fa-solid fa-play";
    }
}

// 3. Setup Custom Event Listeners with Fullscreen Control
function setupControlListeners() {
    const playToggle = document.getElementById('vpp-play-toggle');
    const skipForward = document.getElementById('vpp-skip-forward');
    const skipBackward = document.getElementById('vpp-skip-backward');
    const volumeRange = document.getElementById('vpp-volume-range');
    const volumeIcon = document.getElementById('vpp-volume-icon');
    const seekbar = document.getElementById('vpp-seekbar-node');
    const speedNode = document.getElementById('vpp-speed-node');
    
    // Fullscreen Targets
    const fullscreenToggle = document.getElementById('vpp-fullscreen-toggle');
    // Note: Agar aap poore custom controls panel ko bhi fullscreen me dekhna chahte hain 
    // toh playerContainer me apne main outer wrapper element ki ID daal dena.
    const playerContainer = document.getElementById('vpp-youtube-native-target');

    playToggle.onclick = () => {
        const state = window.videoEngineData.ytPlayerEngine.getPlayerState();
        if (state === YT.PlayerState.PLAYING) {
            window.videoEngineData.ytPlayerEngine.pauseVideo();
        } else {
            window.videoEngineData.ytPlayerEngine.playVideo();
        }
    };

    skipForward.onclick = () => {
        let currentTime = window.videoEngineData.ytPlayerEngine.getCurrentTime();
        window.videoEngineData.ytPlayerEngine.seekTo(currentTime + 10, true);
    };

    skipBackward.onclick = () => {
        let currentTime = window.videoEngineData.ytPlayerEngine.getCurrentTime();
        window.videoEngineData.ytPlayerEngine.seekTo(Math.max(0, currentTime - 10), true);
    };

    volumeRange.oninput = (e) => {
        let vol = e.target.value;
        window.videoEngineData.ytPlayerEngine.setVolume(vol);
        const icon = volumeIcon.querySelector('i');
        if (vol == 0) icon.className = "fa-solid fa-volume-xmark";
        else if (vol < 50) icon.className = "fa-solid fa-volume-low";
        else icon.className = "fa-solid fa-volume-high";
    };

    seekbar.oninput = (e) => {
        let duration = window.videoEngineData.ytPlayerEngine.getDuration();
        let targetTime = (duration * e.target.value) / 100;
        window.videoEngineData.ytPlayerEngine.seekTo(targetTime, true);
    };

    speedNode.onchange = (e) => {
        window.videoEngineData.ytPlayerEngine.setPlaybackRate(parseFloat(e.target.value));
    };

    // Fullscreen Event Handler (Bada karne ka dynamic logic)
    if (fullscreenToggle && playerContainer) {
        fullscreenToggle.onclick = () => {
            // Agar browser fullscreen me nahi hai, toh wrapper element ko full size karo
            const targetWrapper = playerContainer.parentElement; 
            
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                if (targetWrapper.requestFullscreen) {
                    targetWrapper.requestFullscreen();
                } else if (targetWrapper.webkitRequestFullscreen) { /* Safari support */
                    targetWrapper.webkitRequestFullscreen();
                } else if (targetWrapper.msRequestFullscreen) { /* IE11 support */
                    targetWrapper.msRequestFullscreen();
                }
            } else {
                // Agar pehle se bada hai, toh wapis normal container scale par lao
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        };

        // Fullscreen icon change dynamically when state alters
        document.onfullscreenchange = () => {
            const fsIcon = fullscreenToggle.querySelector('i');
            if (fsIcon) {
                if (document.fullscreenElement) {
                    fsIcon.className = "fa-solid fa-compress"; // Chota karne ka icon
                } else {
                    fsIcon.className = "fa-solid fa-expand"; // Bada karne ka icon
                }
            }
        };
    }
}

// 4. Progress bar tracker engine
function startProgressTimer() {
    const seekbar = document.getElementById('vpp-seekbar-node');
    const timeMetrics = document.getElementById('vpp-time-metrics');

    if(window.videoEngineData.seekProgressInterval) clearInterval(window.videoEngineData.seekProgressInterval);

    window.videoEngineData.seekProgressInterval = setInterval(() => {
        const engine = window.videoEngineData.ytPlayerEngine;
        if (engine && engine.getCurrentTime && engine.getPlayerState() === YT.PlayerState.PLAYING) {
            let current = engine.getCurrentTime();
            let total = engine.getDuration() || 0;

            if (total > 0) {
                let pct = (current / total) * 100;
                seekbar.value = pct;
                timeMetrics.innerText = `${formatTimeMarkup(current)} / ${formatTimeMarkup(total)}`;
            }
        }
    }, 500);
}

function formatTimeMarkup(timeInSeconds) {
    let mins = Math.floor(timeInSeconds / 60);
    let secs = Math.floor(timeInSeconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 5. Update Metadata Text Details
function updateMetaTextDetails(lecture) {
    document.getElementById('vpp-video-title').innerText = lecture.title;
    document.getElementById('vpp-video-description').innerText = lecture.description || "Master the concepts of this modern technology stack step-by-step with live operational samples.";
    
    const accessible = lecture.is_preview || window.videoEngineData.isCoursePurchased;
    document.getElementById('vpp-video-tag').innerHTML = accessible 
        ? `<i class="fa-solid fa-unlock"></i> Unlocked Content • ${lecture.section_name}`
        : `<i class="fa-solid fa-lock"></i> Locked Content • ${lecture.section_name}`;
}

// 6. Dynamic Sidebar Content Generation Pipeline
function renderPlaylist(lectures) {
    const container = document.getElementById('vpp-playlist-container');
    container.innerHTML = "";

    lectures.forEach((lecture) => {
        const isLocked = !lecture.is_preview && !window.videoEngineData.isCoursePurchased; 
        const card = document.createElement('div');
        
        card.className = `vpp-playlist-item-card ${isLocked ? 'vpp-item-locked' : ''}`;
        card.setAttribute('data-id', lecture.id);

        const vId = extractYoutubeId(lecture.video_url);
        const activeThumb = lecture.thumbnail_url || `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

        card.innerHTML = `
            <div class="vpp-thumb-frame">
                <img src="${activeThumb}" alt="Thumbnail Layout">
                <span class="vpp-duration-badge">${lecture.duration || 'Video'}</span>
            </div>
            <div class="vpp-details-block">
                <h4>${lecture.title}</h4>
                <p>${lecture.section_name} • ${(!isLocked) ? 'Unlocked' : 'Pro Only'}</p>
            </div>
        `;

        if (isLocked) {
            card.onclick = () => alert("🔒 This lecture is locked! Please enroll in the course to unlock access.");
        } else {
            card.onclick = () => {
                const engine = window.videoEngineData.ytPlayerEngine;
                if(engine && engine.loadVideoById) {
                    engine.loadVideoById(extractYoutubeId(lecture.video_url));
                    updateMetaTextDetails(lecture);
                    
                    document.querySelectorAll('.vpp-playlist-item-card').forEach(c => c.classList.remove('vpp-item-active'));
                    card.classList.add('vpp-item-active');
                }
            };
        }
        container.appendChild(card);
    });

    if(container.firstElementChild) {
        container.firstElementChild.classList.add('vpp-item-active');
    }
}