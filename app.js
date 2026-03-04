import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
  host: user.uid
}, { merge: true });

// Real-time listener
onSnapshot(roomRef, (snapshot) => {
  const data = snapshot.data();
  document.getElementById("hugCount").innerText = data.hugs;
  document.getElementById("kissCount").innerText = data.kisses;
});



const domain = "meet.jit.si";
const options = {
  roomName: roomId,
  width: "100%",
  height: 500,
  parentNode: document.querySelector("#video")
};

new JitsiMeetExternalAPI(domain, options);

document.getElementById("hugBtn").onclick = async () => {
  await updateDoc(roomRef, { hugs: increment(1) });
};

document.getElementById("kissBtn").onclick = async () => {
  await updateDoc(roomRef, { kisses: increment(1) });
};
