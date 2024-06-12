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

const UpdateLrcFile = ({ albumId, songId, trackId, refetchSongs }) => {
  const [newFile, setNewFile] = useState(null);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [uploadFinished, setUploadFinished] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const updateLrc = async () => {
    const newSingleFile = newFile[0]
    console.log(newSingleFile)
    if (!newSingleFile) {
      return console.log("You have to choose a file");
    }

    const ext = newSingleFile.name.split(".").pop();
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
      const lrc = songData.lrcs.find((lrc) => lrc.trackId === parseInt(trackId));

      if (!lrc) {
        console.log("Lrc not found!");
        return;
      }

      const oldSrc = lrc.lrc || null;

      // Step 2: Upload the new file to Firebase Storage
      // console.log("New file: ",newSingleFile.name, typeof(newSingleFile.name))
      const thisTrack = songData.tracks.find((track) => parseInt(trackId) === track.id)
      console.log(thisTrack)
      const trackName = thisTrack.name
      const newFileName = songId + "_" + trackName + "_track-" + trackId
      const metadata = {
        name: newFileName,
        contentType: 'text/plain'
      }
      const storageRef = ref(
        storage,
        `sounds/${albumId}/${songId}/${newFileName}.lrc`
      );
      const uploadTask = uploadBytesResumable(storageRef, newSingleFile, metadata);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress monitoring
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          // console.log(progress);
          // console.log("Upload is " + progress + "% done");
          console.log(snapshot.bytesTransferred, "/", snapshot.totalBytes, "State: ", snapshot.state)
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
          const updatedTracks = songData.lrcs.map((lrc) => {
            if (lrc.trackId === parseInt(trackId)) {
              return { ...lrc, lrc: newSrc }; // Update the specific field
            }
            return lrc;
          });
          console.log("UpdatedTracks: ", updatedTracks)
          await updateDoc(songRef, { lrcs: updatedTracks });

          console.log("LRC updated successfully!");
          setUploadStarted(false);
          setUploadFinished(true);
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

  const handleReplaceAfterUpload = () => {
    refetchSongs();
    // setShowUploadForm(true);
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
        <div style={{color: "white", width: "100%"}}><p style={{fontSize: 20}}>Lyrics updated successfully!</p><button onClick={handleReplaceAfterUpload} style={{width: "100%"}}>Reload</button></div>
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
