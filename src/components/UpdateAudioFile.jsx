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

const UpdateAudioFile = ({ albumId, songId, trackId }) => {
  const [newFile, setNewFile] = useState();
  const [uploadStarted, setUploadStarted] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const updateTrack = async () => {
    console.log(newFile.split(".").pop());
    if (!newFile) {
      return console.log("You have to choose a file");
    }
    const ext = newFile.split(".").pop();
    if (ext !== "mp3") {
      return console.log("Choose an mp3");
    }

    const storage = getStorage();

    // Step 1: Read the document
    const albumRef = doc(db, "albums", albumId, "songs", songId);
    const albumSnap = await getDoc(albumRef);
    console.log("album Snap: ", albumSnap.data());

    if (albumSnap.exists()) {
      const albumData = albumSnap.data();
      const track = albumData.tracks.find((track) => track.id === trackId);

      if (!track) {
        console.log("Track not found!");
        return;
      }

      const oldSrc = track.src;

      // Step 2: Upload the new file to Firebase Storage
      //   const ext = newFile.name.split('.').pop();
      //   const newFileName = `${trackName}.${ext}`;
      const newFileName = newFile.substr(newFile.lastIndexOf("/") + 1);
      const storageRef = ref(
        storage,
        `sounds/${albumId}/${songId}/${newFileName}`
      );
      const uploadTask = uploadBytesResumable(storageRef, newFile);
      setUploadStarted(true);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Progress monitoring
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.error("Upload failed:", error);
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
          const updatedTracks = albumData.tracks.map((track) => {
            if (track.id === trackId) {
              return { ...track, src: newSrc }; // Update the specific field
            }
            return track;
          });

          await updateDoc(albumRef, { tracks: updatedTracks });
          setUploadDone(true);
          console.log("Track updated successfully!");
        }
      );
    } else {
      console.log("No such document!");
    }
  };

  const handleFileChange = (e) => {
    setNewFile(e.target.value);
  };

  return (
    <>
    { showUploadForm ? 
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* <label htmlFor="Files">Update the audio file here:</label> */}
      <input type="file" onChange={(e) => handleFileChange(e)} />
      <button className="glass" onClick={updateTrack}>
        {uploadStarted ? !uploadDone ? "Uploading..." : "Done!" : "Upload"}
      </button>
    </div> : 
    <button className="glass" onClick={() => setShowUploadForm(true)}>Replace audio file</button>
    }
    </>
  );
};

export default UpdateAudioFile;
