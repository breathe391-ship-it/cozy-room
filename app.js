// ===============================
// 🔥 FIREBASE IMPORTS
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  increment,
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { 
  getAuth, 
  signInAnonymously 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";


// ===============================
// 🔥 FIREBASE CONFIG
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyDFCNvUqQ2hcwaH5sng-42CX09D1B7QaqI",
  authDomain: "cozy-room-d3e42.firebaseapp.com",
  projectId: "cozy-room-d3e42",
  storageBucket: "cozy-room-d3e42.firebasestorage.app",
  messagingSenderId: "818366564365",
  appId: "1:818366564365:web:2be3d68cc4e1e7b5eaed44"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ===============================
// 🌍 GLOBAL VARIABLES
// ===============================
let player;
let currentLoaded = "";
let isHost = false;


// ===============================
// 🚀 AUTH + ROOM SETUP
// ===============================
await signInAnonymously(auth);
const user = auth.currentUser;

const roomId = "cozy-room-1";
const roomRef = doc(db, "rooms", roomId);

// Create room if not exists
await setDoc(roomRef, {
  hugs: 0,
  kisses: 0,
  queue: [],
  currentVideo: "",
  isPlaying: false,
  timestamp: 0,
  host: user.uid
}, { merge: true });


// ===============================
// 🎥 JITSI EMBED
// ===============================
const domain = "meet.jit.si";
const options = {
  roomName: roomId,
  width: "100%",
  height: 500,
  parentNode: document.querySelector("#video")
};

new JitsiMeetExternalAPI(domain, options);


// ===============================
// 🤗 💋 COUNTERS
// ===============================
document.getElementById("hugBtn").onclick = async () => {
  await updateDoc(roomRef, { hugs: increment(1) });
};

document.getElementById("kissBtn").onclick = async () => {
  await updateDoc(roomRef, { kisses: increment(1) });
};


// ===============================
// 🎵 YOUTUBE PLAYER INIT
// ===============================
window.onYouTubeIframeAPIReady = function () {
  player = new YT.Player("player", {
    height: "250",
    width: "100%",
    videoId: "",
  });
};


// ===============================
// 🎵 EXTRACT VIDEO ID
// ===============================
function extractVideoID(url) {
  const regExp = /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
}


// ===============================
// ➕ ADD SONG TO QUEUE
// ===============================
document.getElementById("addSong").onclick = async () => {
  const link = document.getElementById("ytLink").value;
  const videoId = extractVideoID(link);

  if (!videoId) return alert("Invalid YouTube link");

  const snapshot = await getDoc(roomRef);
  const data = snapshot.data();

  const updatedQueue = [...(data.queue || []), videoId];

  await updateDoc(roomRef, {
    queue: updatedQueue
  });

  document.getElementById("ytLink").value = "";
};


// ===============================
// ▶️ ⏸️ ⏭️ HOST CONTROLS
// ===============================
document.getElementById("playBtn").onclick = async () => {
  if (!isHost) return;

  await updateDoc(roomRef, {
    isPlaying: true,
    timestamp: player.getCurrentTime()
  });
};

document.getElementById("pauseBtn").onclick = async () => {
  if (!isHost) return;

  await updateDoc(roomRef, {
    isPlaying: false,
    timestamp: player.getCurrentTime()
  });
};

document.getElementById("nextBtn").onclick = async () => {
  if (!isHost) return;

  const snapshot = await getDoc(roomRef);
  const data = snapshot.data();

  const newQueue = data.queue.slice(1);

  await updateDoc(roomRef, {
    queue: newQueue,
    currentVideo: newQueue[0] || "",
    timestamp: 0,
    isPlaying: true
  });
};


// ===============================
// 🔄 REAL-TIME SYNC LISTENER
// ===============================
onSnapshot(roomRef, async (snapshot) => {
  const data = snapshot.data();
  if (!data) return;

  // Detect host
  isHost = (data.host === user.uid);

  // Update counters
  document.getElementById("hugCount").innerText = data.hugs || 0;
  document.getElementById("kissCount").innerText = data.kisses || 0;

  // Hide controls for non-host
  if (!isHost) {
    document.querySelector(".controls").style.display = "none";
  }

  // Load new video if changed
  if (data.currentVideo && data.currentVideo !== currentLoaded) {
    player.loadVideoById(data.currentVideo);
    currentLoaded = data.currentVideo;
  }

  // Sync play/pause
  if (player && typeof player.getCurrentTime === "function") {
    if (data.isPlaying) {
      player.seekTo(data.timestamp || 0, true);
      player.playVideo();
    } else {
      player.seekTo(data.timestamp || 0, true);
      player.pauseVideo();
    }
  }

  // Auto-load first song if none playing
  if (!data.currentVideo && data.queue.length > 0) {
    await updateDoc(roomRef, {
      currentVideo: data.queue[0]
    });
  }
});
