import React, { useEffect, useState } from 'react'
import { collection, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link } from 'react-router-dom';
import { getStorage, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const LrcUpload = ({albumId, songId, trackName, trackId}) => {

    const [selectedFiles, setSelectedFiles] = useState([]);
    const [uploadStarted, setUploadStarted] = useState(false);
    const [uploadCompleted, setUploadCompleted] = useState(false);
    const [error, setError] = useState(null)

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);

      };

    const handleUpload = async () => {
        setUploadStarted(true);
        const storage = getStorage();
        const promises = selectedFiles.map(async (file) => {
          return new Promise(async (resolve, reject) => {
            const ext = file.name.split('.').pop();
            const baseName = file.name.replace(`.${ext}`, '');
            const parts = baseName.split('_');
    
            const storageRef = ref(storage, `sounds/${albumId}/${songId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
    
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
                lrc: downloadURL})
            } else if (ext !== 'lrc') {
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

      return (
          <div>
        {uploadCompleted ? error ? (<div>{`An error occurred: ${error}`}</div>) : (<div style={{color: "#fdc873"}}>Lrc uploaded successfully</div>) : 
            <div style={{display: "flex",flexDirection:"column", gap: 10, justifyContent: "center", alignItems: "center"}}>
              <label htmlFor="Files">Upload your Lyrics file here:</label>
              <input type="file" multiple onChange={handleFileChange} />
              <button onClick={handleUpload}>{uploadStarted ? "Uploading..." : "Upload"}</button>
            </div>
        }
        </div>
  )
}

export default LrcUpload
