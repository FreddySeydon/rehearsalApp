// authLoader.js
import { redirect } from "react-router-dom";
import { auth } from "../../utils/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export const authLoader = () => {
  const auth = getAuth();
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(null); // User is authenticated, proceed to the route
      } else {
        resolve(redirect("/login")); // User is not authenticated, redirect to login
      }
    });
  });
};
