import React, {useState} from "react";
import { getStorage, ref, deleteObject, getDownloadURL } from "firebase/storage";
import { doc, collection, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";

const DeleteSong = ({albumId, songId, refetchAlbum}) => {

  const [deletionStarted, setDeletionStarted] = useState(false);

    const deleteSong = async() => {
        const storage = getStorage();
        setDeletionStarted(true);
  // Step 1: Read the document
  const songRef = doc(db, "albums", albumId, "songs", songId);
  const songSnap = await getDoc(songRef);

  if (songSnap.exists()) {
    const songData = songSnap.data();
    const lrcArray = songData.lrcs ? songData.lrcs : null;

    // Step 2: Delete each track's audio file and LRC file from Firebase Storage
    for (const track of songData.tracks) {
      const trackSrc = track.src;
      const trackLrc = lrcArray ? lrcArray.find(lrc => lrc.trackId === track.id)?.lrc : null;

      if (trackSrc) {
        const trackFileRef = ref(storage, trackSrc);
        try {
          await deleteObject(trackFileRef)
        } catch (error) {
          if(error.code === 'storage/object-not-found'){
            console.warn("File not found.")
          }
        }
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
    
    // Update displayed list of songs
    refetchAlbum()

  } else {
    console.log("No such document!");
  }
    }
  

  return (
    <div>
      <button onClick={deleteSong} style={{background: "transparent", color: "darkred", border: "solid", borderWidth: 2}}>{deletionStarted ? "Deleting..." : "Delete Song"}</button>
    </div>
  )
};

export default DeleteSong
