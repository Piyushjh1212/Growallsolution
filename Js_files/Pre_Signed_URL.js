// presigned_url.js

let heartbeatInterval = null; // Heartbeat track karne ke liye

export async function playSecureVideo(bucketName, videoPath, userId) {
  try {
    // Global client ko access karein (jo supabase-config.js se aayega)
    const supabase = window.supabaseClient;

    if (!supabase) {
      console.error("Supabase client initialize nahi hua hai. Ensure supabase-config.js is loaded first.");
      return;
    }

    // 1. Check karein ki kya kisi aur ne video hold par rakhi hai
    const { data: session } = await supabase
      .from('video_sessions')
      .select('user_id')
      .eq('video_id', videoPath)
      .single();

    if (session && session.user_id !== userId) {
      alert("Access Denied: Yeh video abhi kisi aur device par chal rahi hai.");
      return;
    }

    // 2. Video ko is user ke liye 'Lock' karein
    await supabase.from('video_sessions').upsert({
      video_id: videoPath,
      user_id: userId,
      last_active: new Date().toISOString()
    });

    // 3. Supabase se Signed URL generate karein (1 hour validity)
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(videoPath, 3600); // 3600 seconds = 1 hour

    if (error) throw error;

    // 4. HTML Video element me URL daalein
    const videoElement = document.getElementById('myVideo');
    if (videoElement && data.signedUrl) {
      videoElement.src = data.signedUrl;
      console.log("Video URL successfully loaded!");
    }

    // 5. Heartbeat Start karein (Har 30 sec me database update hoga)
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    heartbeatInterval = setInterval(async () => {
      await supabase.from('video_sessions').update({
        last_active: new Date().toISOString()
      }).eq('video_id', videoPath).eq('user_id', userId);
    }, 30000);

    // 6. Jab user tab close kare, toh lock hata dein
    window.addEventListener('beforeunload', () => {
      // Tab band hone par database se entry delete ho jayegi
      supabase.from('video_sessions').delete().eq('video_id', videoPath).then();
    });

  } catch (error) {
    console.error("Video load error:", error.message);
  }
}