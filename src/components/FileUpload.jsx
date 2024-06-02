import React, { useState, useRef, useEffect } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { Link } from "react-router-dom";

const FileUpload = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [trackNames, setTrackNames] = useState({});
  const [songName, setSongName] = useState("New Song");
  const [songUploadName, setSongUploadName] = useState("newsong");
  const [albumName, setAlbumName] = useState("New Album");
  const [albumUploadName, setAlbumUploadName] = useState("newalbum");
  const [userAlbumName, setUserAlbumName] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [existingAlbums, setExistingAlbums] = useState([]);
  const [songNumber, setSongNumber] = useState(1);
  const [trackNumbers, setTrackNumbers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [uploadStarted, setUploadStarted] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const inputFileRef = useRef(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    console.log("Song: ", songName, ":", songUploadName);
    console.log("Album: ", userAlbumName ? userAlbumName : albumName, ":", albumUploadName);
  }, [songUploadName, albumUploadName, albumName, songName]);

  useEffect(() => {
    if (!userAlbumName) {
      setAlbumUploadName(selectedAlbum);
    }
    console.log("Useralbum name: ", userAlbumName);
  }, [userAlbumName]);

  const resetUpload = async () => {
    setLoading(true);
    await fetchAlbums();
    setTrackNames({});
    setSelectedFiles([]);
    setTrackNumbers([]);
    setSongName("New Song");
    setSongUploadName("newsong");
    setAlbumName("New Album");
    setAlbumUploadName("newalbum");
    setUserAlbumName("");
    setSongNumber((prev) => parseInt(prev, 10) + 1);
    setUploadStarted(false);
    if (inputFileRef.current) {
      inputFileRef.current.value = "";
      inputFileRef.current.type = "text";
      inputFileRef.current.type = "file";
    }
    setUploadCompleted(false);
    setLoading(false);
  };

  const formatInput = (input) => {
    let formatted = input.toLowerCase();
    formatted = formatted.replace(/[\s-]+/g, '_');
    return formatted;
  };

  const loadFFmpeg = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    });
    setLoaded(true);
  };

  const fetchAlbums = async () => {
    try {
      const collectionRef = collection(db, "albums");
      const albumsSnapshot = await getDocs(collectionRef);
      const albumsList = [];
      albumsSnapshot.forEach((doc) => {
        albumsList.push({ id: doc.id, ...doc.data() });
      });
      setExistingAlbums(albumsList);
      if (albumsList.length > 0) {
        const lastUploadAlbum = localStorage.getItem("selected-upload-album");
        if (lastUploadAlbum) {
          setSelectedAlbum(JSON.parse(localStorage.getItem('selected-album')));
          return;
        }
        setSelectedAlbum(albumsList[0].id);
        setAlbumUploadName(albumsList[0].id);
        setAlbumName(albumsList[0].name);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
    initializeTrackNames(files);
    initializeTrackNumbers(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
    initializeTrackNames(files);
    initializeTrackNumbers(files);
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

  const initializeTrackNumbers = (files) => {
    const numbers = files.map((_, index) => index + 1);
    setTrackNumbers(numbers);
  };

  const handleTrackNameChange = (baseName, newName) => {
    setTrackNames((prev) => ({ ...prev, [baseName]: newName }));
  };

  const handleTrackNumberChange = (index, newNumber) => {
    const updatedTrackNumbers = [...trackNumbers];
    updatedTrackNumbers[index] = newNumber;
    setTrackNumbers(updatedTrackNumbers);
  };

  const associateLRCWithTrack = (lrcBaseName, mp3BaseName) => {
    setTrackNames((prev) => ({ ...prev, [mp3BaseName]: lrcBaseName }));
  };

  const compressFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (true) {
      return file;
    }
    await loadFFmpeg();
    const ffmpeg = ffmpegRef.current;
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
    setUploadStarted(true);
    const storage = getStorage();
    const promises = selectedFiles.map(async (file) => {
      const compressedFile = await compressFile(file);
      return new Promise(async (resolve, reject) => {
        const ext = compressedFile.name.split('.').pop();
        const baseName = compressedFile.name.replace(`.${ext}`, '');
        const trackName = trackNames[baseName];
        const storageRef = ref(storage, `sounds/${albumUploadName}/${songUploadName}/${compressedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            console.log(snapshot.bytesTransferred, "/", snapshot.totalBytes, "State: ", snapshot.state);
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

      uploadedFiles.map(({ downloadURL, file, trackName }, index) => {
        if (!songsData[songName]) {
          songsData[songName] = { tracks: [] };
        }
        const ext = file.name.split('.').pop();
        if (ext === 'mp3') {
          const id = trackNumbers[index];
          songsData[songName].tracks.push({ id: id, name: trackName, src: downloadURL });
        } else if (ext !== 'mp3') {
          throw new Error("Only mp3 files are supported at the moment, sorry!");
        }
      });

      const albumRef = collection(db, 'albums');
      if (userAlbumName) {
        await setDoc(doc(albumRef, albumUploadName), { name: userAlbumName ? userAlbumName : albumName });
      }
      for (const [songName, data] of Object.entries(songsData)) {
        const songsCollectionRef = collection(albumRef, albumUploadName, 'songs');
        await setDoc(doc(songsCollectionRef, songUploadName), { ...data, name: songName, number: songNumber });
      }
      console.log("end of uploading reached");
      setUploadCompleted(true);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleAlbumChange = (album) => {
    setSelectedAlbum(album);
    setAlbumName(album);
  };

  return (
    <>
      <h2>Song Upload</h2>
      {!uploadCompleted ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
            {loading ? (
              <div>Loading...</div>
            ) : (
              !userAlbumName ? (
                <div className="selectBox" style={{ paddingBottom: 10, paddingTop: 0, marginTop: 0 }}>
                  <p style={{ fontSize: "1rem" }}>Choose an album to add songs to...</p>
                  <select value={selectedAlbum} onChange={(e) => handleAlbumChange(e.target.value)} style={{ minWidth: "10rem", minHeight: "2.5rem", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "black" }}>
                    {existingAlbums.map((album) => (
                      <option key={album.id} value={album.id}>
                        {album.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null
            )}
            <label htmlFor="AlbumName">Album Name: {!userAlbumName ? albumName : userAlbumName}</label>
            <input type="text" onChange={(e) => {
              setUserAlbumName(e.target.value);
              setAlbumUploadName(formatInput(e.target.value));
            }} placeholder="...or type here to create a new Album" />
            <label htmlFor="SongName">Song Name: </label>
            <input type="text" required onChange={(e) => {
              setSongName(e.target.value);
              setSongUploadName(formatInput(e.target.value));
            }} />
            <label htmlFor="SongNumber">Song Number: </label>
            <input type="number" value={songNumber} required onChange={(e) => {
              setSongNumber(e.target.value);
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
            <input type="file" multiple onChange={handleFileChange} ref={inputFileRef} />
            {selectedFiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: 'column' }}>
                <h3>Selected Files</h3>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column" }}>
                  {selectedFiles.map((file, index) => (
                    <li key={index} style={{ display: "flex", flexDirection: "column" }}>
                      <p>Track Number: 
                        <input 
                          type="text" 
                          value={trackNumbers[index]} 
                          onChange={(e) => handleTrackNumberChange(index, e.target.value)} 
                        />
                      </p>
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
                <button onClick={handleUpload}>{uploadStarted ? "Uploading..." : "Upload Files"}</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          Upload Complete!
          <button onClick={resetUpload}>Upload next song</button>
          <Link to={`/albums/${albumUploadName}/${songUploadName}`}>
            <button>Go to Song</button>
          </Link>
        </div>
      )}
    </>
  );
};

export default FileUpload;
