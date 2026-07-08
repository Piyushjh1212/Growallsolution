// Js_files/GlobalScroll.js - Global Top Scroll Handler

(function() {
    // 1. Jaise hi DOM tree structure ready ho, turant top par scroll karein
    document.addEventListener("DOMContentLoaded", () => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });

    // 2. Jaise hi poori file (images, style sheet templates, components) fully load ho jayein
    window.addEventListener("load", () => {
        // thoda sa micro delay (50ms) taaki agar koi dynamic database element page ko niche khinch rha ho toh use bypass kiya ja sake
        setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }, 50);
    });

    // 3. Agar aap page par History state api, SPA router ya hash state (#something) link use kar rahe hain
    window.addEventListener("popstate", () => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    
    window.addEventListener("hashchange", () => {
        // Agar dynamic target query block empty hai tabhi top bhejein
        if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
    });
})();