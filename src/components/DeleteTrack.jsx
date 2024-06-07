import React from "react";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";

const DeleteTrack = ({albumId, songId, trackId, refetchSongs}) => {
    const deleteTrack = async() => {
        const storage = getStorage();

  // Step 1: Read the document
  const songRef = doc(db, "albums", albumId, "songs", songId);
  const songSnap = await getDoc(songRef);

  if (songSnap.exists()) {
    const songData = songSnap.data();
    const track = songData.tracks.find(track => track.id === trackId);
    const lrc = songData.lrcs ? songData.lrcs.find(lrc => lrc.trackId === trackId) : null;
    

    if (!track) {
      console.log("Track not found!");
      return;
    }

    const trackSrc = track.src;
    const trackLrc = lrc ? lrc.lrc : null;

    // Step 2: Delete the audio file from Firebase Storage
    if (trackSrc) {
      const trackFileRef = ref(storage, trackSrc);
      await deleteObject(trackFileRef).catch((error) => {
        console.error("Error deleting audio file:", error);
      });
    }

    // Step 3: Delete the LRC file from Firebase Storage (if exists)
    if (trackLrc) {
      const lrcFileRef = ref(storage, trackLrc);
      await deleteObject(lrcFileRef).catch((error) => {
        console.error("Error deleting LRC file:", error);
      });
    }

    // Step 4: Remove the track reference from Firestore
    const updatedTracks = songData.tracks.filter(track => track.id !== trackId);
    if(trackLrc){
        const updatedLrcs =  songData.lrcs.filter(lrc => lrc.trackId !== trackId);
        await updateDoc(songRef, { tracks: updatedTracks, lrcs: updatedLrcs });
    } else {
        await updateDoc(songRef, { tracks: updatedTracks });
    }

    console.log("Track deleted successfully!");
    refetchSongs()
  } else {
    console.log("No such document!");
}
    }
  
return (
<>
 <button onClick={deleteTrack}>Delete Track</button>
</>

)
};


export default DeleteTrack;
