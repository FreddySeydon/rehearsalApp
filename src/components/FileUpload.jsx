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
  const ffmpegRef = useRef(new FFmpeg());
  const inputFileRef = useRef(null);

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
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchAlbums();
  }, []);

  console.log("Currently uploading: ",currentlyUploadingFilename)
  console.log("Uploaded Tracks: ",uploadedTracks)

  useEffect(() => {
    if (!userAlbumName) {
      setAlbumUploadName(selectedAlbum);
    }
  }, [userAlbumName, albumUploadName]);

  const resetUpload = async () => {
    setLoading(true);
    setInitialAlbum(false);
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
      const albumSnapshot = await getDocs(albumRef);
      const songsList = [];
      albumSnapshot.forEach((doc) => {
        songsList.push({ id: doc.id, ...doc.data() });
      });
      if (songsList) {
        console.log(songsList);
        const songNumbers = songsList.map((song) => song.number);
        const maxSongNumber = Math.max(...songNumbers);
        console.log("Max song number: ", maxSongNumber);
        if (maxSongNumber) {
          setSelectedAlbumNextSongNumber(maxSongNumber + 1);
          setSongNumber(maxSongNumber + 1);
        }
        const sortedSongsList = sortSongsList(songsList);
        const existingSongNumbers = songsList.map((song) => {
          return String(song.number)
        })
        setExistingSongNumbers(existingSongNumbers);
        // console.log("SongsList:" ,songsList, sortedSongsList)
        setSelectedAlbumData(sortedSongsList);
      }
    } catch (error) {
      console.log("Error fetching selected Album", error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const collectionRef = collection(db, "albums");
      const albumsSnapshot = await getDocs(collectionRef);
      console.log("Albumssnapshot: ",albumsSnapshot)
      if (!albumsSnapshot.empty) {
        console.log(albumsSnapshot.docs[0].data());
        const albumsList = [];
        albumsSnapshot.forEach((doc) => {
          albumsList.push({ id: doc.id, ...doc.data() });
        });
        setExistingAlbums(albumsList);
        if (albumsList.length > 0) {
          const lastUploadAlbum = localStorage.getItem("selected-upload-album");
          console.log("last album: ", JSON.parse(lastUploadAlbum));
          if (lastUploadAlbum) {
            setSelectedAlbum(JSON.parse(lastUploadAlbum));
            setAlbumUploadName(JSON.parse(lastUploadAlbum));
            const currentAlbum = albumsList.find(
              (album) => album.id === JSON.parse(lastUploadAlbum)
            );
            setAlbumName(currentAlbum.name);
            setLoading(false);
            return;
          }
          setSelectedAlbum(albumsList[0].id);
          setAlbumUploadName(albumsList[0].id);
          setAlbumName(albumsList[0].name);
        }
      }
      setInitialAlbum(true);
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


  // const handleFileChange = (event) => {
  //   const files = Array.from(event.target.files);
  //   setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
  //   initializeTrackNames(files);
  //   initializeTrackNumbers(files);
  // };

  const handleDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles((prevFiles) => [...prevFiles, ...files]);
    initializeTrackNames(files);
    initializeTrackNumbers(files);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

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

  const handleTrackNumberChange = (index, newNumber) => {
    const updatedTrackNumbers = [...trackNumbers];
    updatedTrackNumbers[index] = newNumber;
    setTrackNumbers(updatedTrackNumbers);
  };

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
      console.log("Song number already exisitng. Please choose another one.");
      return
    }
    setUploadStarted(true);
    const storage = getStorage();
    // const uploadedFilesArray = []
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
        const uploadTask = uploadBytesResumable(storageRef, compressedFile);
        localStorage.setItem(
          "selected-upload-album",
          JSON.stringify(albumUploadName)
        );

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            if(!totalBytes){
              // uploadedFilesArray.push(compressedFile.name);
              setCurrentlyUploadingFilename(compressedFile.name);
              setTotalBytes(snapshot.totalBytes);
            }
            setTransferredBytes(snapshot.bytesTransferred);
            setUploadedPercentage(snapshot.bytesTransferred / snapshot.totalBytes * 100);
            console.log(
              snapshot.bytesTransferred,
              "/",
              snapshot.totalBytes,
              "State: ",
              snapshot.state
            );

            uploadTask.on("complete", (snapshot) => {
              setTotalBytes(0);
              setTransferredBytes(0);
              setUploadedPercentage(0);
              // setUploadedTracks(uploadedFilesArray);
            }
            )
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
        const ext = file.name.split(".").pop();
        if (ext === "mp3") {
          const id = trackNumbers[index];
          songsData[songName].tracks.push({
            id: id,
            name: trackName,
            src: downloadURL,
          });
        } else if (ext !== "mp3") {
          throw new Error("Only mp3 files are supported at the moment, sorry!");
        }
      });

      const albumRef = collection(db, "albums");
      if (userAlbumName) {
        await setDoc(doc(albumRef, albumUploadName), {
          name: userAlbumName ? userAlbumName : albumName,
        });
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
        });
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

  return (
    <>
      <h2>Song Upload</h2>
      {!uploadCompleted ? (
        loading ? (
          <div>
            <img src={loadingSpinner} alt="Loading" width={"30rem"} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "row", gap: 20, padding: 50 }} className="glasstransparent">
            <div
              style={{ display: "flex", flexDirection: "column", width: "33%" }}
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
                          <p style={{color: "#3f3f3f"}}>{album.name}</p>
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <label htmlFor="AlbumName" style={{ fontSize: "large"}}>
                  Album Name: {!userAlbumName ? albumName : userAlbumName}
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
                />
                <label htmlFor="SongName" style={{marginTop: 10, fontSize: "large"}}>Song Name: <b>{songName}</b></label>
                <input
                  type="text"
                  required
                  onChange={(e) => {
                    setSongName(e.target.value);
                    setSongUploadName(formatInput(e.target.value));
                  }}
                  className="glass inputbox"
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
                  />
                </div>
                <button
                  onClick={handleUpload}
                  style={{ padding: 10, marginTop: 10, marginBottom: 10, backgroundColor: "#fdc873" }}
                >
                  {uploadStarted ? "Uploading..." : "Upload Files"}
                  {!selectedFiles ? disabled : null}
                </button>
                <button onClick={resetUpload} style={{backgroundColor: "transparent", borderWidth: 3, border: "solid", borderColor: "darkred"}}>Reset Upload</button>
              </div>
            </div>
            {!userAlbumName && !initialAlbum ? (
              <div style={{ width: "33%" }} className="glasstransparent">
                <p style={{paddingBottom: 0, marginBottom: 0}}>Songs in</p>
                <h2 style={{paddingTop: 0, marginTop: 0}}>{albumName}</h2>
                {selectedAlbumData?.map((song) => {
                  return (
                    <div>
                      <p style={{fontSize: "1.25rem"}}>
                        {song.number}. {song.name}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
            <Droppable id="file-drop" style={{ width: "33%" }}>
              <FileUploadDropZone setSelectedFiles={setSelectedFiles} selectedFiles={selectedFiles} initializeTrackNames={initializeTrackNames} initializeTrackNumbers={initializeTrackNumbers}/>
              {/* <label htmlFor="Files">
                Drag and drop or choose files to upload
              </label> */}
              {selectedFiles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", padding: 20 }} className="glasstransparent">
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
                                transition: "ease"
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
                                textAlign="center"
                                style={{textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "#3f3f3f"}}
                                className="glass inputbox"
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
          <button onClick={resetUpload} style={{width: "100%"}}>Upload next song</button>
          <Link to={`/albums/${albumUploadName}/${songUploadName}`}>
            <button style={{width: "100%"}}>Go to Song</button>
          </Link>
        </div>
      )}
    </>
  );
};

export default FileUpload;
