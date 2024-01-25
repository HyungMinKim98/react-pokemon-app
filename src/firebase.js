// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCtECa3RxW8MNm_l2W7pGYYSJA70WcCKiw",
  authDomain: "react-pokemon-app-39b52.firebaseapp.com",
  projectId: "react-pokemon-app-39b52",
  storageBucket: "react-pokemon-app-39b52.appspot.com",
  messagingSenderId: "867809721327",
  appId: "1:867809721327:web:56fa57b10b00ae8c9c541a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;