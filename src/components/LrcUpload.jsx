import React, { useEffect, useState } from 'react'
import { collection, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link } from 'react-router-dom';
import { getStorage, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import LrcUploadDropzone from './LrcUploadDropzone';
import { useUser } from '../context/UserContext';
import loadingSpinner from '../assets/img/loading.gif';

const LrcUpload = ({albumId, songId, trackName, trackId, refetchSongs}) => {

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadStarted, setUploadStarted] = useState(false);
    const [uploadCompleted, setUploadCompleted] = useState(false);
    const [info, setInfo] = useState(null)
    const [error, setError] = useState(null)

    const {user, authLoading} = useUser();

    const resetSelect = () => {
      setSelectedFiles([])
      setInfo(null)
    }

    const handleUpload = async () => {
      if(selectedFiles.length === 0) {
        setInfo("You have to select a file")
        return
      }
        setUploadStarted(true);
        const songRef = doc(db, "albums", albumId, "songs", songId);
        const songSnap = await getDoc(songRef);
        const songData = songSnap.data();
        const sharedWith = songData.sharedWith ? songData.sharedWith : [];
        const storage = getStorage();
        const promises = selectedFiles.map(async (file) => {
          return new Promise(async (resolve, reject) => {
            const ext = file.name.split('.').pop();
            const baseName = file.name.replace(`.${ext}`, '');
            const version = 1
            const fileName = baseName + "_" + trackName + "_" + trackId + "_v" + version + "." + ext
            const parts = baseName.split('_');
            const metadata = {
              metadata: {
                ownerId: user.uid,
              ownerName: user.displayName,
              // name: fileName,
              contentType: 'text/plain'
            }}
    
            const storageRef = ref(storage, `sounds/${albumId}/${songId}/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file, {
              customMetadata: {
                ownerId: user.uid,
                ownerName: user.displayName,
                sharedWith: sharedWith.join(',')
              },
              contentType: 'text/plain'
            });
    
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                console.log(snapshot.bytesTransferred, "/", snapshot.totalBytes, "State: ", snapshot.state)
              },
              (error) => {
                console.error("Upload failed:", error);
                reject(error);
              },
              async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ downloadURL, file: file, trackName });
              }
            );
          });
        });
    
        try {
          const uploadedFiles = await Promise.all(promises);
          let lrcToUpload = []
    
          uploadedFiles.forEach(({ downloadURL, file, trackName }) => {
            const ext = file.name.split('.').pop();
            if (ext === 'lrc') {
              lrcToUpload.push({
                trackId: trackId,
                trackName: trackName,
                lrc: downloadURL,
                version: 1,
                ownerId: user.uid,
                ownerName: user.displayName
              })
            } else if (ext !== 'lrc') {
              setInfo("Only lrc files are supported")
              throw new Error("Only lrc files are supported")
            }
          });
    
          // Save metadata to Firestore
          const songRef = doc(db, `albums/${albumId}/songs/${songId}`);
          await updateDoc(songRef, {
            lrcs: arrayUnion(...lrcToUpload)
          })
        setUploadCompleted(true);
        console.log("LRC upload complete")
    
        //   onUploadComplete();
        } catch (error) {
            setError(error);
            // setUploadCompleted(true);
            setUploadStarted(false)
          console.error("Error uploading files:", error);
        }
      };

      if(authLoading){
        return <img src={loadingSpinner} alt="Loading" width={50} />
      }

      return (
          <div>
        {uploadCompleted ? error ? (<div>{`An error occurred: ${error}`}</div>) : (<div style={{color: "white"}}><p style={{fontSize: 20}}>Lyrics uploaded successfully</p><button onClick={refetchSongs}>Reload</button></div>) : 
            <div style={{display: "flex",flexDirection:"column", gap: 10, justifyContent: "center", alignItems: "center"}}>
              <LrcUploadDropzone setSelectedFiles={setSelectedFiles} selectedFiles={selectedFiles} />
              {/* <label htmlFor="Files">Upload your Lyrics file here:</label>
              <input type="file" multiple onChange={handleFileChange} /> */}
              {info ? info : null}
              <div>
              <button onClick={handleUpload}>{uploadStarted ? !uploadCompleted ? "Uploading..." : "Done!" : "Upload"}</button>
              <button onClick={resetSelect} style={{background: "transparent", color: "darkred"}}>Reset</button>
              </div>
            </div>
        }
        </div>
  )
}

export default LrcUpload
