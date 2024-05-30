import React, { useEffect, useState } from "react";
import "./App.css";
import Channel from "./components/Channel";
import { formatTime } from "../utils/lrcParser";
import Lyrics from "./components/Lyrics";
import { useMediaQuery } from "react-responsive";
import loadingSpinner from "./assets/img/loading.gif";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../utils/firebase";

const App = () => {
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [lrcContent, setLrcContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userSeek, setUserSeek] = useState(false);
  const [trackDuration, setTrackDuration] = useState(0);
  const [statePlayers, setStatePlayers] = useState(null);
  const [stateSolos, setStateSolos] = useState(null);
  const [isStopped, setIsStopped] = useState(true);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [clearMute, setClearMute] = useState(false);
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);

  // Media Queries via react-responsive
  const isDesktopOrLaptop = useMediaQuery({ query: "(min-width: 1224px)" });
  const isBigScreen = useMediaQuery({ query: "(min-width: 1824px)" });
  const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });
  const isRetina = useMediaQuery({ query: "(min-resolution: 2dppx)" });

  // Create a state for the playing status
  const [playing, setPlaying] = useState(false);
  const [globalSeek, setGlobalSeek] = useState(0);
  const [seekUpdateInterval, setSeekUpdateInterval] = useState(null);

  const fetchAlbums = async () => {
    try {
      const albumsSnapshot = await getDocs(collection(db, "albums"));
      const albumsList = [];
      albumsSnapshot.forEach((doc) => {
        albumsList.push({ id: doc.id, ...doc.data() });
      });
      setAlbums(albumsList);
      if (albumsList.length > 0) {
        setSelectedAlbum(albumsList[0].id); // Set the first album as the default selected album
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      // setLoading(false);
    }
  };

  const fetchSongs = async (albumId) => {
    if (!albumId) return;
    setLoading(true);
    try {
      const songsSnapshot = await getDocs(collection(db, `albums/${albumId}/songs`));
      const songsList = [];
      songsSnapshot.forEach((songDoc) => {
        songsList.push({ id: songDoc.id, ...songDoc.data() });
      });
      setSongs(songsList);
      if (songsList.length > 0) {
        setSelectedSong(songsList[0].id); // Set the first song as the default selected song
      }
      console.log("Songslist: ",songsList)
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  useEffect(() => {
    if (selectedAlbum) {
      fetchSongs(selectedAlbum);
    }
  }, [selectedAlbum]);

  const handleAlbumChange = (albumId) => {
    setSelectedAlbum(albumId);
    localStorage.setItem("selected-album", albumId);
  };

  const handleSongChange = (songId) => {
    setSelectedSong(songId);
    localStorage.setItem("selected-song", songId);
  };

  return (
    <>
      {loading && !songs ? (
        <div>
          <img src={loadingSpinner} alt="Loading" width={"5rem"} />
        </div>
      ) : (
        <div className="appWrapper" style={{ padding: isTabletOrMobile ? "1rem" : "5rem", paddingTop: isTabletOrMobile ? "1rem" : "3rem" }}>
          <h1 style={{ fontSize: isTabletOrMobile ? "1.5rem" : "2rem" }}>Rehearsal Rocket</h1>
              <div className="selectBoxWrapper" style={{flexDirection: isTabletOrMobile ? "column" : "row"}}>
                <div className="selectBox">
                <p>Select Album: </p>
                <select value={selectedAlbum} onChange={(e) => handleAlbumChange(e.target.value)} style={{ minWidth: "10rem", minHeight: "2.5rem", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "black" }}>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
                </div>
                <div className="selectBox">
                <p>Song:</p>
                <select
                  value={selectedSong}
                  onChange={(e) => handleSongChange(e.target.value)}
                  style={{ minWidth: "10rem", minHeight: "2.5rem", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "black" }}
                >
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.number} - {song.name}
                    </option>
                  ))}
                </select>
                </div>
              </div>
          <div className="audio-mixer" style={{ flexDirection: isTabletOrMobile ? "column" : "row" }}>
            <div className="controlsWrapper">
              <div className="tracks">
                <div className="singleTrack">
                  <Channel
                    sources={songs.find((song) => song.id === selectedSong)?.tracks}
                    globalSeek={globalSeek}
                    setGlobalSeek={setGlobalSeek}
                    userSeek={userSeek}
                    selectedSong={selectedSong}
                    setSelectedSong={setSelectedSong}
                    isBigScreen={isBigScreen}
                    isDesktopOrLaptop={isDesktopOrLaptop}
                    isTabletOrMobile={isTabletOrMobile}
                    playing={playing}
                    setPlaying={setPlaying}
                    setTrackDuration={setTrackDuration}
                    trackDuration={trackDuration}
                    statePlayers={statePlayers}
                    setStatePlayers={setStatePlayers}
                    stateSolos={stateSolos}
                    setStateSolos={setStateSolos}
                    formatTime={formatTime}
                    setLoading={setLoading}
                    loading={loading}
                    sounds={songs}
                    isStopped={isStopped}
                    setIsStopped={setIsStopped}
                    setSeekUpdateInterval={setSeekUpdateInterval}
                    seekUpdateInterval={seekUpdateInterval}
                    playersLoaded={playersLoaded}
                    setPlayersLoaded={setPlayersLoaded}
                    clearMute={clearMute}
                    setClearMute={setClearMute}
                  />
                </div>
              </div>
            </div>
            <div className="lyrics">
              <Lyrics
                sounds={songs}
                statePlayers={statePlayers}
                setLrcContent={setLrcContent}
                lrcContent={lrcContent}
                setLoading={setLoading}
                loading={loading}
                globalSeek={globalSeek}
                selectedSong={selectedSong}
                setGlobalSeek={setGlobalSeek}
                setUserSeek={setUserSeek}
                userSeek={userSeek}
                isBigScreen={isBigScreen}
                isDesktopOrLaptop={isDesktopOrLaptop}
                isTabletOrMobile={isTabletOrMobile}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
