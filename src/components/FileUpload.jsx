import React, { useState, useRef, useEffect } from "react";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "../../utils/firebase";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import loadingSpinner from "../assets/img/loading.gif";
import FileUploadDropZone from "./FileUploadDropZone";
import "./FileUpload.css"
import DragHandleIcon from "../assets/img/drag-handle.svg"
import {v4 as uuidv4} from 'uuid';
import { useUser } from "../context/UserContext";
import { fetchAlbumsList } from "../../utils/databaseOperations";
import { useMediaQuery } from "react-responsive";

const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    <div
      ref={setNodeRef}
      // style={{ padding: "20px", border: "2px dashed #ccc" }}
    >
      {children}
    </div>
  );
};

const FileUpload = () => {
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
  const [selectedAlbumNextSongNumber, setSelectedAlbumNextSongNumber] =
    useState(1);
  const [trackNumbers, setTrackNumbers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadCompleted, setUploadCompleted] = useState(false);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [initialAlbum, setInitialAlbum] = useState(false);
  const [transferredBytes, setTransferredBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [currentlyUploadingFilename, setCurrentlyUploadingFilename] = useState("");
  const [uploadedPercentage, setUploadedPercentage] = useState(null);
  const [uploadedTracks, setUploadedTracks] = useState([]);
  const [existingSongNumbers, setExistingSongNumbers] = useState([])
  const [info, setInfo] = useState('')
  const ffmpegRef = useRef(new FFmpeg());
  const inputFileRef = useRef(null);

  //Auth
  const {user, authLoading} = useUser();

  //Responsive
  const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });

  // Preventing dragging in inputs and buttons

  class MyPointerSensor extends PointerSensor {
    static activators = [
      {
        eventName: "onPointerDown",
        handler: ({ nativeEvent: event }) => {
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
      "button",
      "input",
      "textarea",
      "select",
      "option",
    ];

    if (interactiveElements.includes(element.tagName.toLowerCase())) {
      return true;
    }

    return false;
  }

  const sensors = useSensors(
    useSensor(MyPointerSensor),
    // useSensor(KeyboardSensor, {
    //   coordinateGetter: sortableKeyboardCoordinates,
    // })
  );

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (!userAlbumName) {
      setAlbumUploadName(selectedAlbum);
    }
  }, [userAlbumName, albumUploadName]);

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setTrackNames({});
    setTrackNumbers([]);
  }

  const resetUpload = async (nextSong) => {
    setLoading(true);
    setInitialAlbum(false);
    setInfo('')
    await fetchAlbums();
    setTrackNames({});
    setSelectedFiles([]);
    setTrackNumbers([]);
    setSongName("New Song");
    setSongUploadName("newsong");
    // setAlbumName("New Album");
    // setAlbumUploadName("newalbum");
    setUserAlbumName("");
    if(nextSong){
      setSongNumber((prev) => {
        const previousSongNumber = parseInt(prev, 10);
        return Math.max(0, previousSongNumber + 1)
      });
    }
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
    formatted = formatted.replace(/[\s-]+/g, "_");
    return formatted;
  };

  const loadFFmpeg = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });
    setLoaded(true);
  };

  const sortSongsList = (songsList) => {
    songsList.sort((a, b) => {
      const numberA = String(a.number).match(/\d+/g) ? parseInt(String(a.number).match(/\d+/g)[0]) : 0;
      const numberB = String(b.number).match(/\d+/g) ? parseInt(String(b.number).match(/\d+/g)[0]) : 0;
    
      if (numberA < numberB) return -1;
      if (numberA > numberB) return 1;
    
      const letterA = String(a.number).match(/[a-zA-Z]+/g) ? String(a.number).match(/[a-zA-Z]+/g)[0] : '';
      const letterB = String(b.number).match(/[a-zA-Z]+/g) ? String(b.number).match(/[a-zA-Z]+/g)[0] : '';
    
      return letterA.localeCompare(letterB);
    });
    return songsList;
  }

  const fetchSelectedAlbum = async (albumId) => {
    try {
      const albumRef = collection(db, "albums", albumId, "songs");
      const songsQuery = query(
        albumRef,
        where('sharedWith', 'array-contains', user.uid)
      )
      const ownedSongsQuery = query(
        albumRef,
        where('ownerId', '==', user.uid)
      )
      const [songsSnapshot, ownedSongsSnapshot] = await Promise.all([
        getDocs(songsQuery),
        getDocs(ownedSongsQuery)
      ])
      const songsList = [];
      songsSnapshot.forEach((doc) => {
        songsList.push({ id: doc.id, ...doc.data() });
      });
      ownedSongsSnapshot.forEach((doc) => {
        songsList.push({ id: doc.id, ...doc.data() });
      });
      if (songsList) {
        const songNumbers = songsList.map((song) => song.number);
        const maxSongNumber = Math.max(...songNumbers);
        if (maxSongNumber) {
          setSelectedAlbumNextSongNumber(maxSongNumber + 1);
          setSongNumber(Math.max(maxSongNumber + 1));
        }
        const sortedSongsList = sortSongsList(songsList);
        const existingSongNumbers = songsList.map((song) => {
          return String(song.number)
        })
        setExistingSongNumbers(existingSongNumbers);
        // console.log("SongsList:", sortedSongsList)
        setSelectedAlbumData(sortedSongsList);
      }
    } catch (error) {
      console.log("Error fetching selected Album", error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const collectionRef = collection(db, "albums");
      const albumsQuery = query(
        collectionRef,
        where('sharedWith', 'array-contains', user.uid)
      );
      const ownedAlbumsQuery = query(
        collectionRef,
        where('ownerId', '==', user.uid)
      );
      const [albumsSnapshot, ownedAlbumsSnapshot] = await Promise.all([
        getDocs(albumsQuery),
        getDocs(ownedAlbumsQuery)
      ])
      if (albumsSnapshot && ownedAlbumsSnapshot) {
        const albumsList = [];
        if(!albumsSnapshot.empty){
          albumsSnapshot.forEach((doc) => {
            albumsList.push({ id: doc.id, ...doc.data() });
          });
        }
        if(!ownedAlbumsSnapshot.empty){          
          ownedAlbumsSnapshot.forEach((doc) => {
            albumsList.push({ id: doc.id, ...doc.data() });
          })
        }
        setExistingAlbums(albumsList);
        if(albumsList.length === 0 ){
          setInitialAlbum(true);
        }
        // setInitialAlbum(false)
        if (albumsList.length > 0) {
          setInitialAlbum(false);
          const lastUploadAlbum = localStorage.getItem("selected-upload-album");
          if (lastUploadAlbum) {
            const currentAlbum = albumsList.find(
              (album) => album.id === JSON.parse(lastUploadAlbum)
            );
            if(currentAlbum){
              setSelectedAlbum(JSON.parse(lastUploadAlbum));
              setAlbumUploadName(JSON.parse(lastUploadAlbum));
              setAlbumName(currentAlbum.name);
            }
            setLoading(false);
            return;
          }
          setSelectedAlbum(albumsList[0].id);
          setAlbumUploadName(albumsList[0].id);
          setAlbumName(albumsList[0].name);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  };

  useEffect(() => {
    if (selectedAlbum) {
      fetchSelectedAlbum(selectedAlbum);
    }
  }, [selectedAlbum]);

  const initializeTrackNames = (files) => {
    const names = {};
    files.forEach((file) => {
      const ext = file.name.split(".").pop();
      const baseName = file.name.replace(`.${ext}`, "");
      const parts = baseName.split("_");
      const trackName = parts.pop();
      const trackNameParts = trackName.split("-")
      const trackNamePartsUppercase = trackNameParts.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      const trackNameClean = trackNamePartsUppercase.join(" + ")
      names[file.name] = trackNameClean;
    });
    setTrackNames((prevNames) => ({ ...prevNames, ...names }));
  };

  const initializeTrackNumbers = (files) => {
    const numbers = files.map((_, index) => selectedFiles.length + index + 1);
    setTrackNumbers((prevNumbers) => [...prevNumbers, ...numbers]);
  };

  const handleTrackNameChange = (fileName, newName) => {
    setTrackNames((prev) => ({ ...prev, [fileName]: newName }));
  };

  // const handleTrackNumberChange = (index, newNumber) => {
  //   const updatedTrackNumbers = [...trackNumbers];
  //   updatedTrackNumbers[index] = newNumber;
  //   setTrackNumbers(updatedTrackNumbers);
  // };

  const compressFile = async (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    if (true) {
      return file;
    }
    await loadFFmpeg();
    const ffmpeg = ffmpegRef.current;
    const fileName = file.name;
    ffmpeg.writeFile(fileName, await fetchFile(file));
    await ffmpeg.exec(["-i", fileName, "-b:a", "64k", "output.mp3"]);

    const data = await ffmpeg.readFile("output.mp3");
    const compressedFile = new Blob([data.buffer], { type: "audio/mp3" });

    ffmpeg.FS("unlink", fileName);
    ffmpeg.FS("unlink", "output.mp3");

    return new File(
      [compressedFile],
      fileName.replace(/\.[^/.]+$/, "") + "_compressed.mp3"
    );
  };

  const handleUpload = async () => {
    if(existingSongNumbers.includes(String(songNumber))) {
      setInfo("Song number already exists. Please choose another one.")
      console.log("Song number already exisitng. Please choose another one.");
      return
    }
    if(selectedFiles.length === 0){
      setInfo('Drag and drop or select files on the right first to upload.')
      return
    }
    if(!songName || songName === 'New Song'){
      setInfo('You have to enter a name for the song.')
      return
    }
    if(existingAlbums.length === 0 && !userAlbumName){
      setInfo('You have to enter an album name.')
      return
    }
    setUploadStarted(true);
    const storage = getStorage();
    const uploadedFilesArray = []
    const promises = selectedFiles.map(async (file) => {
      const compressedFile = await compressFile(file);
      return new Promise(async (resolve, reject) => {
        const ext = compressedFile.name.split(".").pop();
        const baseName = compressedFile.name.replace(`.${ext}`, "");
        const trackName = trackNames[compressedFile.name];
        const storageRef = ref(
          storage,
          `sounds/${albumUploadName}/${songUploadName}/${compressedFile.name}`
        );
        const metadata = {
          customMetadata: {
            ownerId: user.uid,
          ownerName: user.displayName},
          name: compressedFile.name
        }
        const uploadTask = uploadBytesResumable(storageRef, compressedFile, metadata);
        localStorage.setItem(
          "selected-upload-album",
          JSON.stringify(albumUploadName)
        );

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if(!totalBytes){
              uploadedFilesArray.push(compressedFile.name);
              setCurrentlyUploadingFilename(compressedFile.name);
              setTotalBytes(snapshot.totalBytes);
              setUploadedFiles(uploadedFilesArray)
            }
            setTransferredBytes(snapshot.bytesTransferred);
            setUploadedPercentage(snapshot.bytesTransferred / snapshot.totalBytes * 100);
          },
          (error) => {
            console.error("Upload failed:", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ downloadURL, file: compressedFile, trackName, songName });
            setTotalBytes(0);
            setTransferredBytes(0);
            setUploadedPercentage(0);
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
        const ext = file.name.split(".").pop();
        if (ext === "mp3") {
          const id = uuidv4();
          const number = trackNumbers[index];
          songsData[songName].tracks.push({
            id: id,
            number: number,
            name: trackName,
            src: downloadURL,
            ownerId: user.uid,
            ownerName: user.displayName,
          });
        } else if (ext !== "mp3") {
          throw new Error("Only mp3 files are supported at the moment, sorry!");
        }
      });

      const albumRef = collection(db, "albums");
      if (userAlbumName) {
        await setDoc(doc(albumRef, albumUploadName), {
          name: userAlbumName ? userAlbumName : albumName,
          ownerId: user.uid,
          ownerName: user.displayName,
          sharedWith: [],
        }, {merge: true});
      }
      for (const [songName, data] of Object.entries(songsData)) {
        const songsCollectionRef = collection(
          albumRef,
          albumUploadName,
          "songs"
        );
        await setDoc(doc(songsCollectionRef, songUploadName), {
          ...data,
          name: songName,
          number: songNumber,
          ownerId: user.uid,
          ownerName: user.displayName,
          sharedWith: [],
        }, {merge: true});
      }
      console.log("end of uploading reached");
      setUploadCompleted(true);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleAlbumChange = (e) => {
    setSelectedAlbum(e.target.value);
    const currentAlbum = existingAlbums.find(
      (album) => album.id === e.target.value
    );
    setAlbumName(currentAlbum.name);
    localStorage.setItem(
      "selected-upload-album",
      JSON.stringify(e.target.value)
    );
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
      const oldIndex = selectedFiles.findIndex(
        (file) => file.name === active.id
      );
      const newIndex = selectedFiles.findIndex((file) => file.name === over.id);

      const reorderedFiles = arrayMove(selectedFiles, oldIndex, newIndex);
      setSelectedFiles(reorderedFiles);

      // const reorderedTrackNumbers = arrayMove(trackNumbers, oldIndex, newIndex);
      // setTrackNumbers(reorderedTrackNumbers);
    }
  };
  if(authLoading){
    return ( <div> <h2>Song Upload</h2> <img src={loadingSpinner} alt="Loading" width={"30rem"} /></div>
     )
  }

  return (
    <>
      <h2>Song Upload</h2>
      {!uploadCompleted ? (
        loading ? (
          <div>
            <img src={loadingSpinner} alt="Loading" width={"30rem"} />
            
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: isTabletOrMobile ? 'column' : "row", gap: 20, padding: 50, minHeight: 500, minWidth: isTabletOrMobile ? '100%' : 1200 }} className="glasstransparent">
            <div
              style={{ display: "flex", flexDirection: "column", width: isTabletOrMobile ? "100%" : "33%" }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginBottom: 20,
                }}
              >
                {loading ? (
                  <div>Loading...</div>
                ) : initialAlbum ? (
                  <div>
                    <h4>
                      Create your first album by typing an album name and upload
                      the tracks for your first song
                    </h4>
                  </div>
                ) : !userAlbumName ? (
                  <div
                    className="selectBox, glass"
                    style={{ paddingBottom: 20, paddingTop: 0, marginTop: 0 , marginBottom: 20, width: "100%"}}
                  >
                    <p style={{ color: "#3f3f3f", fontSize: "large", fontWeight: "bold" }}>
                      Choose an album to add songs to...
                    </p>
                    <select
                      value={selectedAlbum}
                      onChange={(e) => handleAlbumChange(e)}
                      style={{
                        minWidth: "10rem",
                        minHeight: "2.5rem",
                        // textAlign: "center",
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        color: "black",
                        backgroundColor: "white",
                        width: "90%"
                      }}
                      className="glass"
                    >
                      {existingAlbums.map((album) => (
                        <option key={album.id} value={album.id} className="glass inputbox" >
                          {album.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <label htmlFor="AlbumName" style={{ marginTop: 10, fontSize: "large", display: "flex", flexWrap:'wrap', justifyContent: 'center', alignItems: 'center', maxWidth: 400, overflow: 'hidden', whiteSpace: 'pre-wrap'}}>
                  Album Name: <b>{!userAlbumName ? albumName : userAlbumName}</b>
                </label>
                <input
                  type="text"
                  onChange={(e) => {
                    setUserAlbumName(e.target.value);
                    setSongNumber(1);
                    setAlbumUploadName(formatInput(e.target.value));
                  }}
                  placeholder="...or type here to create a new Album"
                  className="glass inputbox"
                  maxLength={90}
                />
                <label htmlFor="SongName" style={{marginTop: 10, fontSize: "large", display: "flex", flexWrap:'wrap', justifyContent: 'center', alignItems: 'center', maxWidth: 400, overflow: 'hidden', whiteSpace: 'pre-wrap'}}><p style={{margin: 0}}>Song Name: </p><b style={{display: 'flex', flexWrap: 'wrap', maxWidth: 400, justifyContent: 'center'}}> {songName}</b></label>
                <input
                  type="text"
                  required
                  onChange={(e) => {
                    setSongName(e.target.value);
                    setSongUploadName(formatInput(e.target.value));
                  }}
                  className="glass inputbox"
                  maxLength={90}
                />
                <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", alignItems: "center", marginTop: 10, width: "100%" }}>
                  <label htmlFor="SongNumber" style={{width: "50%", marginRight: 20, fontSize: "large"}}>Song Number: </label>
                  <input
                    type="text"
                    value={songNumber}
                    required
                    onChange={(e) => {
                      setSongNumber(e.target.value);
                    }}
                    className="glass inputbox"
                    style={{width: "50%"}}
                    maxLength={4}
                  />
                </div>
                <p style={{color: '#fdc873', marginBottom: 0, maxWidth: 350}}>
                {info ? info : null}
                </p>
                <button
                className="glass"
                  onClick={handleUpload}
                  style={{ padding: 10, marginTop: 10, marginBottom: 10, }}
                >
                  {uploadStarted ? "Uploading..." : "Upload Files"}
                  {!selectedFiles ? disabled : null}
                </button>
                <button onClick={() => resetUpload(false)} style={{backgroundColor: "transparent", borderWidth: 3, border: "solid", borderColor: "darkred"}}>Reset Upload</button>
              </div>
            </div>
            {!userAlbumName && !initialAlbum ? (
              <div style={{ width: isTabletOrMobile ? '100%' : "33%", paddingBottom: 10 }} className="glasstransparent">
                <p style={{paddingBottom: 0, marginBottom: 0}}>Songs in</p>
                <h2 style={{paddingTop: 0, marginTop: 0, marginBottom: 2}}>{albumName}</h2>
                {selectedAlbumData?.map((song) => {
                  return (
                    <div key={song.id}>
                      <p style={{fontSize: "1.25rem", margin: 1}}>
                        {song.number}. {song.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <Droppable id="file-drop" style={{ width: "33%" }}>
              <FileUploadDropZone isTabletOrMobile={isTabletOrMobile} setSelectedFiles={setSelectedFiles} selectedFiles={selectedFiles} initializeTrackNames={initializeTrackNames} initializeTrackNumbers={initializeTrackNumbers}/>
              {/* <label htmlFor="Files">
                Drag and drop or choose files to upload
              </label> */}
              {selectedFiles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", padding: 20 }} className="glasstransparent">
                  <h3>Selected Files</h3>
                  <button onClick={clearSelectedFiles} style={{backgroundColor: "transparent", borderWidth: 3, border: "solid", borderColor: "darkred", marginBottom: 10}}>Reset Files</button>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd}
                  >
                    <SortableContext
                      items={selectedFiles.map((file, index) => file.name)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul
                        style={{
                          listStyle: "none",
                          display: "flex",
                          flexDirection: "column",
                          marginBlockStart: 0,
                          marginLeft: 0,
                          marginInlineStart: 0,
                          marginInlineEnd: 0,
                          paddingInlineStart: 0,
                        }}
                      >
                        {selectedFiles.map((file, index) => (
                          <SortableItem key={file.name} id={file.name}>
                            {uploadedTracks.includes(file.name) ? <h2>Done!</h2> :                             
                            <div className="grabbable glassCard"
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                marginBottom: 10,
                                // background: `linear-gradient(${index % 2 ? "120deg" : "120deg"}, #4158D0 0%, #C850C0 46%, #FFCC70 100%)`,
                                padding: 10,
                                borderRadius: 5,
                                boxShadow: "rgba(0, 0, 0, 0.16) 0px 1px 4px",
                                transition: "ease",
                                maxWidth: 500
                              }}
                            >
                              <div style={{display: "flex", flexDirection: "column"}}>
                              <p>Track Number: {index + 1}</p>
                              <input
                                
                                type="text"
                                value={trackNames[file.name]}
                                onChange={(e) =>
                                  handleTrackNameChange(
                                    file.name,
                                    e.target.value
                                  )
                                }
                                // textAlign="center"
                                style={{textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "#3f3f3f", minWidth: 340, maxWidth: 340}}
                                className="glass inputbox"
                                maxLength={35}
                              />
                              <p>File: {file.name}</p>
                              {uploadStarted ? currentlyUploadingFilename === file.name ? <div>{uploadedPercentage}%</div> : <div><img src={loadingSpinner} alt="Loading" width={"15rem"} /></div> : null}
                              {/* <button onClick={() => handleDelete(index)}>
                                Delete
                              </button> */}
                              </div>
                              <img src={DragHandleIcon} alt="DragHandle" width={80} />
                            </div>
                          }
                          </SortableItem>
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </Droppable>
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <h2>Upload Complete!</h2>
          <button onClick={() => resetUpload(true)} style={{width: "100%"}}>Upload next song</button>
          <Link to={`/albums/${albumUploadName}/${songUploadName}`}>
            <button style={{width: "100%"}}>Go to Song</button>
          </Link>
          <Link to={`/lyricseditor?albumId=${albumUploadName}&songId=${songUploadName}`} style={{width: "100%"}}>
                        <button style={{width: "100%"}}>Add Lyrics</button>
                        </Link>
        </div>
      )}
    </>
  );
};

export default FileUpload;
