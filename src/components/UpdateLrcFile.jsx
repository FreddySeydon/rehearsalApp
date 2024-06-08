import React, { useState, useEffect } from "react";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import LrcUploadDropzone from "./LrcUploadDropzone";

const UpdateLrcFile = ({ albumId, songId, trackId }) => {
  const [newFile, setNewFile] = useState(null);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [uploadFinished, setUploadFinished] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const updateLrc = async () => {
    if (!newFile) {
      return console.log("You have to choose a file");
    }

    const ext = newFile.name.split(".").pop();
    if (ext !== "lrc") {
      return console.log("Choose an lrc file");
    }

    const storage = getStorage();

    // Step 1: Read the document
    const songRef = doc(db, "albums", albumId, "songs", songId);
    const songSnap = await getDoc(songRef);
    console.log("album Snap: ", songSnap.data());

    if (songSnap.exists()) {
      const songData = songSnap.data();
      const lrc = songData.lrcs.find((lrc) => lrc.trackId === trackId);

      if (!lrc) {
        console.log("Lrc not found!");
        return;
      }

      const oldSrc = lrc.lrc || null;

      // Step 2: Upload the new file to Firebase Storage
      console.log("New file: ",newFile.name, typeof(newFile.name))
      const newFileName = newFile.name;
      const storageRef = ref(
        storage,
        `sounds/${albumId}/${songId}/${newFileName}`
      );
      const uploadTask = uploadBytesResumable(storageRef, newFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress monitoring
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(progress);
          console.log("Upload is " + progress + "% done");
          setUploadStarted(true);
        },
        (error) => {
          console.error("Upload failed:", error);
          setUploadStarted(false);
        },
        async () => {
          const newSrc = await getDownloadURL(uploadTask.snapshot.ref);

          // Step 3: Delete the old file from Firebase Storage
          if (oldSrc) {
            const oldFileRef = ref(storage, oldSrc);
            await deleteObject(oldFileRef).catch((error) => {
              console.error("Error deleting old file:", error);
            });
          }

          // Step 4: Update Firestore document with the new file path
          const updatedTracks = songData.tracks.map((track) => {
            if (track.id === trackId) {
              return { ...track, lrc: newSrc }; // Update the specific field
            }
            return track;
          });

          await updateDoc(albumRef, { tracks: updatedTracks });

          console.log("LRC updated successfully!");
          setUploadStarted(false);
          setNewFile(null);
        }
      );
    } else {
      console.log("No such document!");
    }
  };

  const handleReset = () => {
    setNewFile(null);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {showUploadForm ? uploadFinished ? (
        <div>Lrc update successful!</div>
      ) : (
        <div style={{display: "flex", flexDirection: "column", gap: 15}}>
          {/* <label htmlFor="Files">Lyrics present</label> */}
          <LrcUploadDropzone setSelectedFiles={setNewFile} selectedFiles={newFile} />
          <div style={{gap: 10}}>
          <button onClick={updateLrc} disabled={uploadStarted} style={{marginRight: 5}}>
            {uploadStarted ? "Uploading..." : "Upload"}
          </button>
          <button onClick={() => setShowUploadForm(false)}>Cancel</button>
          <button onClick={handleReset} style={{background: "transparent", color: "darkred"}}>Reset</button>
          </div>
          <div>

          </div>
        </div>
      ) : <button style={{width: "100%"}} onClick={() => setShowUploadForm(true)}>Replace Lyrics</button>}
    </div>
  );
};

export default UpdateLrcFile;
