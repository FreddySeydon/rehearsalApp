import React, { useState, useRef, useEffect } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { FFmpeg } from "@ffmpeg/ffmpeg";

const FileUpload = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [trackNames, setTrackNames] = useState({});
  const [songName, setSongName] = useState("New Song")
  const [songUploadName, setSongUploadName] = useState("newsong")
  const [albumName, setAlbumName] = useState("New Album")
  const [albumUploadName, setAlbumUploadName] = useState("newalbum")
  const [userAlbumName, setUserAlbumName] = useState("")
  const [selectedAlbum, setSelectedAlbum] = useState("")
  const [existingAlbums, setExistingAlbums] = useState([])
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const ffmpegRef = useRef(new FFmpeg())

  useEffect(() => {
    fetchAlbums()
  }, [])

  useEffect(() => {
    console.log("Song: ", songName, ":", songUploadName)
    console.log("Album: ", albumName, ":", albumUploadName)
  }, [songUploadName, albumUploadName, albumName, songName])

  useEffect(() => {
    if(!userAlbumName){
        setAlbumUploadName(selectedAlbum);
    }
  }, [userAlbumName])

  const formatInput = (input) => {
    let formatted = input.toLowerCase();
    formatted = formatted.replace(/[\s-]+/g, '_');
    return formatted;
}

  const loadFFmpeg = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'
    const ffmpeg = ffmpegRef.current;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      });
      setLoaded(true)
    
  };

  const fetchAlbums = async () => {
    try {
      const albumsSnapshot = await getDocs(collection(db, "albums"));
      const albumsList = [];
      albumsSnapshot.forEach((doc) => {
        albumsList.push({ id: doc.id, ...doc.data() });
      });
      setExistingAlbums(albumsList);
      if (albumsList.length > 0) {
        const lastUploadAlbum = localStorage.getItem("selected-upload-album")
        if(lastUploadAlbum) {
          setSelectedAlbum(JSON.parse(localStorage.getItem('selected-album')))
          return
        }
        setSelectedAlbum(albumsList[0].id); // Set the first album as the default selected album
        setAlbumUploadName(albumsList[0].id);
        setAlbumName(albumsList[0].name);
      }
      setLoading(false)
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      // setLoading(false);
    }
  };


  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    initializeTrackNames(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
    initializeTrackNames(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const initializeTrackNames = (files) => {
    const names = {};
    files.forEach((file) => {
      const ext = file.name.split('.').pop();
      const baseName = file.name.replace(`.${ext}`, '');
      const parts = baseName.split('_');
      const trackName = parts.pop();
      names[baseName] = trackName;
    });
    setTrackNames(names);
  };

  const handleTrackNameChange = (baseName, newName) => {
    setTrackNames((prev) => ({ ...prev, [baseName]: newName }));
  };

  const compressFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if(true){
        return file;
    }
    // if(ext !== 'mp3' && ext !== 'wav' && ext !== 'ogg' && ext !== 'flac'){
    //     return file; //Skip compression for non-audio files
    // }
    await loadFFmpeg();
    const ffmpeg = ffmpegRef.current
    const fileName = file.name;
    ffmpeg.writeFile(fileName, await fetchFile(file));
    await ffmpeg.exec(['-i', fileName, '-b:a', '64k', 'output.mp3']);

    const data = await ffmpeg.readFile('output.mp3');
    const compressedFile = new Blob([data.buffer], { type: 'audio/mp3' });

    ffmpeg.FS('unlink', fileName);
    ffmpeg.FS('unlink', 'output.mp3');

    return new File([compressedFile], fileName.replace(/\.[^/.]+$/, '') + '_compressed.mp3');
  };

  const handleUpload = async () => {
    const storage = getStorage();
    const promises = selectedFiles.map(async (file) => {
      const compressedFile = await compressFile(file);
      return new Promise(async (resolve, reject) => {
        const ext = compressedFile.name.split('.').pop();
        const baseName = compressedFile.name.replace(`.${ext}`, '');
        const parts = baseName.split('_');
        const trackName = trackNames[baseName];
        // const songName = parts.join('_');

        const storageRef = ref(storage, `sounds/${albumUploadName}/${songUploadName}/${compressedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Progress monitoring
          },
          (error) => {
            console.error("Upload failed:", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadURL, file: compressedFile, trackName, songName });
          }
        );
      });
    });

    try {
      const uploadedFiles = await Promise.all(promises);
      const songsData = {};

      uploadedFiles.forEach(({ downloadURL, file, trackName, songName }) => {
        if (!songsData[songName]) {
          songsData[songName] = { tracks: [] };
        }
        const ext = file.name.split('.').pop();
        if (ext === 'mp3') {
          songsData[songName].tracks.push({ src: downloadURL, name: trackName });
        } else if (ext === 'lrc') {
          songsData[songName].lrcs = songsData[songName].lrcs || {};
          songsData[songName].lrcs[trackName] = downloadURL;
        }
      });

      // Save metadata to Firestore
      const albumRef = collection(db, 'albums');
      for (const [songName, data] of Object.entries(songsData)) {
        await addDoc(collection(albumRef, albumName, 'songs'), { ...data, name: songName });
      }

    //   onUploadComplete();
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleAlbumChange = (album) => {
    selectedAlbum(album);
    setAlbumName(album);
  }

  return (
    <div style={{
        display: "flex",
        flexDirection: "column",
    }}>
        <div style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: 20
        }}>
            <h2>Song Upload</h2>
      <label htmlFor="AlbumName">Album Name: {!userAlbumName ? albumName : userAlbumName  }</label>
      {loading ? <div>Loading...</div> :       
      !userAlbumName ? <div className="selectBox" style={{paddingBottom: 10, paddingTop: 0, marginTop: 0}}>
                <p style={{fontSize: "1rem"}}>Choose an album to add songs to...</p>
                <select value={selectedAlbum} onChange={(e) => handleAlbumChange(e.target.value)} style={{ minWidth: "10rem", minHeight: "2.5rem", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "black" }}>
                  {existingAlbums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
                </div> : null
      }
        <input type="text" onChange={(e) => {
            setUserAlbumName(e.target.value);
            setAlbumUploadName(formatInput(e.target.value));
            }} placeholder="...or type here to create a new Album" />
        <label htmlFor="SongName">Song Name: </label>
        <input type="text" onChange={(e) => {
            setSongName(e.target.value);
            setSongUploadName(formatInput(e.target.value))
            }} />
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{
            border: "2px dashed #ccc",
            padding: "20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
      <label htmlFor="Files">Drag and drop or choose files to upload</label>
      <input type="file" multiple onChange={handleFileChange} />
      {selectedFiles.length > 0 && (
        <div style={{display: "flex", flexDirection: 'column'}}>
          <h3>Selected Files</h3>
          <ul style={{listStyle: "none", display: "flex", flexDirection: "column"}}>
            {selectedFiles.map((file, index) => (
                <li key={index} style={{display: "flex", flexDirection: "column"}}>
                 <p style={{}}>Track {index + 1} </p>
                <input
                  type="text"
                  value={trackNames[file.name.replace(/\.[^/.]+$/, '')] || ''}
                  onChange={(e) =>
                    handleTrackNameChange(file.name.replace(/\.[^/.]+$/, ''), e.target.value)
                }
                />
                <p>File: {file.name}</p>
              </li>
            ))}
          </ul>
          <button onClick={handleUpload}>Upload Files</button>
        </div>
      )}
    </div>
    </div>
  );
};

export default FileUpload;
