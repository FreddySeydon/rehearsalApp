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
import { useUser } from "../context/UserContext";
import loadingSpinner from '../assets/img/loading.gif'
import { updateLrc } from "../../utils/databaseOperations";

const UpdateLrcFile = ({ albumId, songId, trackId, refetchSongs, trackName, user, authLoading }) => {
  const [newFile, setNewFile] = useState(null);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [uploadFinished, setUploadFinished] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [error, setError] = useState('');

  // const {user, authLoading} = useUser();

  console.log(user.uid)

  const lrcUpdate = async () => {
    const newSingleFile = newFile[0]
    console.log(newSingleFile)
    if (!newSingleFile) {
      return console.log("You have to choose a file");
    }

    const ext = newSingleFile.name.split(".").pop();
    if (ext !== "lrc") {
      return console.log("Choose an lrc file");
    }

    try {
      setUploadStarted(true);
      const updateLrcResult = await updateLrc(newSingleFile, albumId, songId, trackId, trackName, user, true);
      console.log("Update LRC result: ", updateLrcResult);
      if (updateLrcResult.result === "success") {
        setUploadStarted(false);
        setUploadFinished(true);
      } else {
        setError(updateLrcResult.message);
        setUploadStarted(false);
        setUploadFinished(false);
      }
    } catch (error) {
      setError(error.message);
      setUploadStarted(false);
      setUploadFinished(false);
    }
  };

  const handleReset = () => {
    setNewFile(null);
  }

  const handleReplaceAfterUpload = () => {
    refetchSongs();
    // setShowUploadForm(true);
  }

  if(authLoading){
    return <img src={loadingSpinner} alt="Loading" width={50} />
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
        <div style={{color: "white", width: "100%"}}><p style={{fontSize: 20}}>Lyrics updated successfully!</p><button onClick={handleReplaceAfterUpload} style={{width: "100%"}} className="glass">Reload</button></div>
      ) : error ? <div style={{color: "darkred", width: "100%"}}><p style={{fontSize: 20}}>There was an error uploading, sorry!</p><button onClick={() => setError('')} style={{width: "100%"}}>Try again</button></div> : (
        <div style={{display: "flex", flexDirection: "column", gap: 15}}>
          {/* <label htmlFor="Files">Lyrics present</label> */}
          <LrcUploadDropzone setSelectedFiles={setNewFile} selectedFiles={newFile} />
          <div style={{gap: 10}}>
          <button className="glass" onClick={lrcUpdate} disabled={uploadStarted} style={{marginRight: 5}}>
            {uploadStarted ? "Uploading..." : "Upload"}
          </button>
          <button className="glasstransparent" onClick={() => setShowUploadForm(false)}>Cancel</button>
          <button onClick={handleReset} style={{background: "transparent", color: "darkred"}}>Reset</button>
          </div>
          <div>

          </div>
        </div>
      ) : <button className="glasstransparent" style={{width: "100%"}} onClick={() => setShowUploadForm(true)}>Replace LRC File</button>}
    </div>
  );
};

export default UpdateLrcFile;
