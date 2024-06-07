import React from "react";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { doc, collection, getDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const deleteSong = async (albumId, songId) => {
  console.log("Delete Song invoked: ", albumId, songId)

    const storage = getStorage();

  // Step 1: Read the document
  const songRef = doc(db, "albums", albumId, "songs", songId);
  const songSnap = await getDoc(songRef);

  if (songSnap.exists()) {
    const songData = songSnap.data();
    const lrcArray = songData.lrcs ? songData.lrcs : null;

    // Step 2: Delete each track's audio file and LRC file from Firebase Storage
    for (const track of songData.tracks) {
      const trackSrc = track.src;
      const trackLrc = lrcArray ? lrcArray.find(lrc => lrc.trackId === track.id).lrc : null;

      if (trackSrc) {
        const trackFileRef = ref(storage, trackSrc);
        await deleteObject(trackFileRef).catch((error) => {
          console.error("Error deleting audio file:", error);
        });
      }

      if (trackLrc) {
        const lrcFileRef = ref(storage, trackLrc);
        await deleteObject(lrcFileRef).catch((error) => {
          console.error("Error deleting LRC file:", error);
        });
      }
    }

    // Step 3: Delete the song document from Firestore
    await deleteDoc(songRef);

    console.log("Song and all its tracks deleted successfully!");

  } else {
    console.log("No such document!");
  }
    
  
};

export const deleteAlbum = async(albumId) => {
  console.log("Delete Album invoked: ", albumId)
    try {
        const albumRef = doc(db, "albums", albumId);
        console.log("Delete Album Ref: ", albumRef)
        const albumSnap = await getDoc(albumRef);
        console.log("Delete Album albumSnap: ", albumSnap)
        
        if (albumSnap.exists()) {
            const songsSnap = await getDocs(collection(albumRef, "songs"))
            const songsList = [];
          songsSnap.forEach((song) => {
            songsList.push({ id: song.id, ...song.data() });
          });
          const albumData = albumSnap.data();
          // console.log("OP Album Data: ",albumData)
          // const songsData = songsSnap.data();
          console.log("OP Songs data: ", songsList)
          songsList.forEach(async (song) => await deleteSong(albumId , song.id))
          await deleteDoc(albumRef);
        }
        
    } catch (error) {
        console.error("There was an error deleting the album: ", error);
    }
}
