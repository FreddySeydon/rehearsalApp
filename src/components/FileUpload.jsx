import React, { useState, useRef, useEffect } from "react";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <li ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </li>
  );
};

const Droppable = ({ children, id }) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} style={{ padding: '20px', border: '2px dashed #ccc' }}>
      {children}
    </div>
  );
};

const FileUpload = ({ onUploadComplete }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [trackNames, setTrackNames] = useState({});
  const [songName, setSongName] = useState("New Song");
  const [songUploadName, setSongUploadName] = useState("newsong");
  const [albumName, setAlbumName] = useState("New Album");
  const [albumUploadName, setAlbumUploadName] = useState("newalbum");
  const [userAlbumName, setUserAlbumName] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [selectedAlbumData, setSelectedAlbumData] = useState(null);
  const [existingAlbums, setExistingAlbums] = useState([]);
  const [songNumber, setSongNumber] = useState(1);
  const [selectedAlbumNextSongNumber, setSelectedAlbumNextSongNumber] = useState(1);
  const [trackNumbers, setTrackNumbers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [uploadStarted, setUploadStarted] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const inputFileRef = useRef(null);

  // Preventing dragging in inputs and buttons

class MyPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown',
      handler: ({nativeEvent: event}) => {
        if (
          !event.isPrimary ||
          event.button !== 0 ||
          isInteractiveElement(event.target)
        ) {
          return false;
        }

        return true;
      },
    },
  ];
}

function isInteractiveElement(element) {
  const interactiveElements = [
    'button',
    'input',
    'textarea',
    'select',
    'option',
  ];

  if (interactiveElements.includes(element.tagName.toLowerCase())) {
    return true;
  }

  return false;
}

  const sensors = useSensors(
    useSensor(MyPointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (!userAlbumName) {
      setAlbumUploadName(selectedAlbum);
    }
    console.log("Useralbum name: ", userAlbumName);
  }, [userAlbumName, albumUploadName]);

  const resetUpload = async () => {
    setLoading(true);
    await fetchAlbums();
    setTrackNames({});
    setSelectedFiles([]);
    setTrackNumbers([]);
    setSongName("New Song");
    setSongUploadName("newsong");
    // setAlbumName("New Album");
    // setAlbumUploadName("newalbum");
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

  const fetchSelectedAlbum = async (albumId) => {
    try {
      const albumRef = collection(db, "albums", albumId, "songs");
      const albumSnapshot = await getDocs(albumRef);
      const songsList = [];
      albumSnapshot.forEach((doc) => {
        songsList.push({id: doc.id, ...doc.data()})
    })
      if(songsList){
        console.log(songsList)
        const songNumbers = songsList.map((song) => song.number)
        const maxSongNumber = Math.max(...songNumbers)
        console.log("Max song number: ",maxSongNumber)
        if(maxSongNumber){
          setSelectedAlbumNextSongNumber(maxSongNumber + 1);
          setSongNumber(maxSongNumber + 1);
        }
        setSelectedAlbumData(songsList)
      }
      
    } catch (error) {
      console.log("Error fetching selected Album", error)
    }
  }

  const fetchAlbums = async () => {
    try {
      const collectionRef = collection(db, "albums");
      const albumsSnapshot = await getDocs(collectionRef);
      console.log(albumsSnapshot.docs[0].data())
      const albumsList = [];
      albumsSnapshot.forEach((doc) => {
        albumsList.push({ id: doc.id, ...doc.data() });
      });
      setExistingAlbums(albumsList);
      if (albumsList.length > 0) {
        const lastUploadAlbum = localStorage.getItem("selected-upload-album");
        console.log("last album: ", JSON.parse(lastUploadAlbum))
        if (lastUploadAlbum) {
          setSelectedAlbum(JSON.parse(lastUploadAlbum));
          setAlbumUploadName(JSON.parse(lastUploadAlbum));
          const currentAlbum = albumsList.find((album) => album.id === JSON.parse(lastUploadAlbum))
          setAlbumName(currentAlbum.name);
          setLoading(false);
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

  useEffect(() => {
    if(selectedAlbum){
      fetchSelectedAlbum(selectedAlbum);
    }
  }, [selectedAlbum])

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    initializeTrackNames(files);
    initializeTrackNumbers(files);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
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
      names[file.name] = trackName;
    });
    setTrackNames(prevNames => ({ ...prevNames, ...names }));
  };

  const initializeTrackNumbers = (files) => {
    const numbers = files.map((_, index) => selectedFiles.length + index + 1);
    setTrackNumbers(prevNumbers => [...prevNumbers, ...numbers]);
  };

  const handleTrackNameChange = (fileName, newName) => {
    setTrackNames((prev) => ({ ...prev, [fileName]: newName }));
  };

  const handleTrackNumberChange = (index, newNumber) => {
    const updatedTrackNumbers = [...trackNumbers];
    updatedTrackNumbers[index] = newNumber;
    setTrackNumbers(updatedTrackNumbers);
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
        const trackName = trackNames[compressedFile.name];
        const storageRef = ref(storage, `sounds/${albumUploadName}/${songUploadName}/${compressedFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);
        localStorage.setItem("selected-upload-album", JSON.stringify(albumUploadName))

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
      uploadedFiles.forEach(({ downloadURL, file, trackName }, index) => {
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

  const handleAlbumChange = (e) => {
    setSelectedAlbum(e.target.value);
    const currentAlbum = existingAlbums.find((album) => album.id === e.target.value)
    setAlbumName(currentAlbum.name);
    localStorage.setItem("selected-upload-album", JSON.stringify(e.target.value))
    fetchSelectedAlbum(e.target.value);
  };

  const handleDelete = (index) => {
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);

    const updatedTrackNumbers = [...trackNumbers];
    updatedTrackNumbers.splice(index, 1);
    setTrackNumbers(updatedTrackNumbers);
  };

  const onDragEnd = ({ active, over }) => {
    if (active?.id !== over?.id) {
      const oldIndex = selectedFiles.findIndex(file => file.name === active.id);
      const newIndex = selectedFiles.findIndex(file => file.name === over.id);

      const reorderedFiles = arrayMove(selectedFiles, oldIndex, newIndex);
      setSelectedFiles(reorderedFiles);

      const reorderedTrackNumbers = arrayMove(trackNumbers, oldIndex, newIndex);
      setTrackNumbers(reorderedTrackNumbers);
    }
  };

  return (
    <>
      <h2>Song Upload</h2>
      {!uploadCompleted ? (
        <div style={{display: "flex", flexDirection: "row", gap: 20}}>
        <div style={{ display: "flex", flexDirection: "column", width:"33%" }}>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 20 }}>
            {loading ? (
              <div>Loading...</div>
            ) : (
              !userAlbumName ? (
                <div className="selectBox" style={{ paddingBottom: 10, paddingTop: 0, marginTop: 0 }}>
                  <p style={{ fontSize: "1rem" }}>Choose an album to add songs to...</p>
                  <select value={selectedAlbum} onChange={(e) => handleAlbumChange(e)} style={{ minWidth: "10rem", minHeight: "2.5rem", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "black" }}>
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
              setSongNumber(1);
              setAlbumUploadName(formatInput(e.target.value));
            }} placeholder="...or type here to create a new Album" />
            <label htmlFor="SongName">Song Name: </label>
            <input type="text" required onChange={(e) => {
              setSongName(e.target.value);
              setSongUploadName(formatInput(e.target.value));
            }} />
            <div style={{display: "flex", flexDirection: "row"
            }}>
            <label htmlFor="SongNumber">Song Number: </label>
            <input type="number" value={songNumber} required onChange={(e) => {
              setSongNumber(e.target.value);
            }} />
            </div>
            <button onClick={handleUpload} style={{padding: 10, marginTop: 10}}>{uploadStarted ? "Uploading..." : "Upload Files"}</button>
          </div>
          </div>
          {!userAlbumName ? <div style={{width: "33%"}}>
              <h4>Songs in selected album:</h4>
              {selectedAlbumData?.map((song) => {
                return (
                  <div>
                    <p>{song.number}. {song.name}</p>
                  </div>
                )
              })}
            </div> : null}
          <Droppable id="file-drop" style={{width: "33%"}}>
            <label htmlFor="Files">Drag and drop or choose files to upload</label>
            <input type="file" multiple onChange={handleFileChange} ref={inputFileRef} />
            {selectedFiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: 'row' }}>
                <h3>Selected Files</h3>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={onDragEnd}
                >
                  <SortableContext
                    items={selectedFiles.map((file, index) => file.name)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column" }}>
                      {selectedFiles.map((file, index) => (
                        <SortableItem key={file.name} id={file.name}>
                          <div style={{ display: "flex", flexDirection: "column", marginBottom: 10, background: "black", padding: 10, borderRadius: 5 }}>
                            <p>Track Number: {index + 1}</p>
                            <input
                              type="text"
                              value={trackNames[file.name]}
                              onChange={(e) =>
                                handleTrackNameChange(file.name, e.target.value)
                              }
                            />
                            <p>File: {file.name}</p>
                            <button onClick={() => handleDelete(index)}>Delete</button>
                          </div>
                        </SortableItem>
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </Droppable>
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
