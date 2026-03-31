import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

//import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCEzVA7SwV4JHgxW38iMGrvNlhNKiUfZlI",
  authDomain: "spacecraft-1ebc5.firebaseapp.com",
  projectId: "spacecraft-1ebc5",
  storageBucket: "spacecraft-1ebc5.firebasestorage.app",
  messagingSenderId: "683684698700",
  appId: "1:683684698700:web:dd53925cb20709c94332e9",
  measurementId: "G-Z70BPX38WW"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);