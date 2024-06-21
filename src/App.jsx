import React, { useEffect, useState } from "react";
import "./App.css";
import Channel from "./components/Channel";
import { formatTime } from "../utils/lrcParser";
import Lyrics from "./components/Lyrics";
import { useMediaQuery } from "react-responsive";
import loadingSpinner from "./assets/img/loading.gif";
import { collection, getDocs } from "firebase/firestore";
import { getStorage, getBlob, ref } from "firebase/storage";
import { db } from "../utils/firebase";
import { Link } from "react-router-dom";
import { sortSongsList } from "../utils/utils";
import { useUser } from "./context/UserContext";
import { fetchAlbumsList } from "../utils/databaseOperations";
import { fetchSongsList } from "../utils/databaseOperations";

const App = ({albumId, songId, trackId, searchParams, setSearchParams}) => {
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [selectedTrack, setSelectedTrack] = useState('')
  const [lrcContent, setLrcContent] = useState(null);
  const [lrcs, setLrcs] = useState([]);
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
  const [currentSources, setCurrentSources] = useState([])
  const [blobsReady, setBlobsReady] = useState(false);
  const [lrcsReady, setLrcsReady] = useState(false);
  const [currentLrcs, setCurrentLrcs] = useState([]);
  const [noLrcs, setNoLrcs] = useState(false);
  const [noTrackLrc, setNoTrackLrc] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);
  const [hideMixer, setHideMixer] = useState(false);
  const [hideSelects, setHideSelects] = useState(false);
  //Auth
  const {user, authLoading} = useUser();

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
  const [noAlbums, setNoAlbums] = useState(false)

  const fetchAlbums = async () => {
    try {
      const albumsList = await fetchAlbumsList(user);
      setAlbums(albumsList);
      if(albumsList.length === 0){
        setNoAlbums(true);
      }
      if (albumsList.length > 0) {
        if(albumId){
          const albumExists = albumsList.find((album) => album.id === albumId)
          if(albumExists){
            setSelectedAlbum(albumId);
            return
          }
          console.log("You can't view this album.")
          return
        }
        const lastAlbum = localStorage.getItem("selected-album")
        if(lastAlbum) {
          const albumExists = albumsList.find(
            (album) => album.id === JSON.parse(lastAlbum)
          );
          if(albumExists){
            const parsedAlbumId = JSON.parse(lastAlbum)
            setSelectedAlbum(parsedAlbumId)
            setSearchParams({...Object.fromEntries(searchParams), albumId: parsedAlbumId})
            return
          }
          return
        }
        setSelectedAlbum(albumsList[0].id); // Set the first album as the default selected album
        setSearchParams({...Object.fromEntries(searchParams), albumId: albumsList[0].id})
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSongs = async (albumId) => {
    if (!albumId) return;
    setLoading(true);
    try {
      const songsList = await fetchSongsList(user, albumId);
      const sortedSongsList = sortSongsList(songsList);
      setSongs(sortedSongsList);
      const lrcsList = [];
      songsList.forEach((song) => lrcsList.push({id: song.id, lrcs: song.lrcs}))
      setLrcs(lrcsList);
      fetchCurrentTracks();
      // fetchCurrentLrcs()
      if(lrcsList.length === 0){
        setNoLrcs(true);
      }
      if (songsList.length > 0) {
        if(songId){
          const songExists = songsList.find((song) => song.id === songId)
          if(songExists){
            setSelectedSong(songId);
            return
          }
          console.log("You can't view this song.")
          return
        }
        const lastSong = localStorage.getItem("selected-song")
        if(lastSong) {
          const songExists = songsList.find((song) => {
            song.id === JSON.parse(lastSong)
          })
          if(songExists){
            const parsedSongId = JSON.parse(lastSong);
            setSelectedSong(parsedSongId)
            setSearchParams({...Object.fromEntries(searchParams), songId: parsedSongId})
          return
          }
        }
        setSelectedSong(songsList[0].id); // Set the first song as the default selected song
        setSearchParams({...Object.fromEntries(searchParams), songId: songsList[0].id})
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentLrcs = async() => {
    setLrcsReady(false);
    const storage = getStorage();
    if(lrcs.length !== 0 && !loading){
      const currentLrcs = lrcs.find((song) => song.id === selectedSong)?.lrcs;
      if(!currentLrcs){
        setNoLrcs(true);
        return
      }
      if(currentLrcs?.length !== 0){
        const currentLrcSourcesArray = await Promise.all(currentLrcs.map(async(lrc) => {
          const httpsReference = ref(storage, lrc.lrc);
          const blob = await getBlob(httpsReference);
          // const blobURL = URL.createObjectURL(blob);
          return {...lrc, lrc: blob}
        }))
        setCurrentLrcs(currentLrcSourcesArray)
        setNoLrcs(false);
      } else {
        setNoLrcs(true);
      }
    }
  }

  useEffect(() => {
    if(currentLrcs.length !== 0 && selectedTrack){
      setLrcsReady(true);
      return
    }
    setLrcsReady(false)
  }, [currentLrcs, selectedTrack])

  const fetchCurrentTracks = async() => {
    setBlobsReady(false);
    const storage = getStorage();
    if(songs.length !== 0 && !loading){
      const currentTracks = songs.find((song) => song.id === selectedSong)?.tracks;
      const currentSourcesArray = await Promise.all(currentTracks.map(async (track) => {
        const httpsReference = ref(storage, track.src)
        const blob = await getBlob(httpsReference);
        const blobURL = URL.createObjectURL(blob);
        return {...track, src: blobURL}; // create a new object with the updated src
      }))
      if(currentSourcesArray !== 0){
        setCurrentSources(currentSourcesArray) // set the state with the new array
        if(trackId){
          const trackExists = currentSourcesArray.find((track) => track.id === trackId)
          if(trackExists){
            setSelectedTrack(trackId);
            return
          }
          // console.log("You can't view this album.")
          return
        }
        const lastTrack = localStorage.getItem("selected-track")
        if(lastTrack) {
          const trackExists = currentSourcesArray.find(
            (track) => track.id === JSON.parse(lastTrack)
          );
          if(trackExists){
            const parsedTrackId = JSON.parse(lastTrack)
            setSelectedTrack(parsedTrackId)
            setSearchParams({...Object.fromEntries(searchParams), trackId: parsedTrackId})
            return
          }
          return
        }
        setSelectedTrack(currentSourcesArray[0].id); // Set the first album as the default selected album
        setSearchParams({...Object.fromEntries(searchParams), trackId: currentSourcesArray[0].id})
      }
      
      // console.log(currentSourcesArray)
      // setSelectedTrack(currentSourcesArray)
    }
  }

  useEffect(() => {
    if(lrcs.length !== 0){
      fetchCurrentLrcs()
    }
  }, [lrcs])

  useEffect(() => {
    if(currentSources !== 0){
      setBlobsReady(true)
      return
    }
    setBlobsReady(false)
  }, [currentSources])

  useEffect(() => {
    fetchCurrentTracks();
    fetchCurrentLrcs();
  }, [selectedSong])
  

  useEffect(() => {
    if(user){
      fetchAlbums();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAlbum) {
      fetchSongs(selectedAlbum);
    }
  }, [selectedAlbum]);

  const handleAlbumChange = (albumId) => {
    setSelectedAlbum(albumId);
    localStorage.setItem("selected-album", JSON.stringify(albumId));
    setSearchParams({...Object.fromEntries(searchParams), albumId: albumId})
  };

  const handleSongChange = (songId) => {
    setSelectedSong(songId);
    localStorage.setItem("selected-song", JSON.stringify(songId));
    setSearchParams({...Object.fromEntries(searchParams), songId: songId})
  };

  const handleTrackChange = (trackId) => {
    setSelectedTrack(trackId);
    setNoTrackLrc(false);
    localStorage.setItem("selected-track", JSON.stringify(trackId))
    setSearchParams({...Object.fromEntries(searchParams), trackId: trackId})
  } 

  if(authLoading){
    return ( <div><img src={loadingSpinner} alt="Loading" width={50} /> </div>
     )
  }


  return (
    <>
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: 'column', width: "100%", overflow: 'hidden'}}>
    {/* <Navbar /> */}
      {noAlbums ? <div><h2>Welcome to Chord Chaos!</h2><h3>Start by adding your first album</h3><Link to={'/sharecode'}><button className="glass">Add First Album</button></Link></div> : loading && !songs ? (
        <div>
          <img src={loadingSpinner} alt="Loading" width={50} />
        </div>
      ) : (
        <div className="appWrapper" style={{ paddingLeft: isTabletOrMobile ? "1rem" : "0rem", paddingRight: isTabletOrMobile ? "1rem" : "0rem", paddingBottom: isTabletOrMobile ? "1rem" : "5rem", paddingTop: isTabletOrMobile ? "0rem" : "0rem", overflow: 'hidden' }}>
              <div className="selectBoxWrapper" style={{flexDirection: isTabletOrMobile ? "column" : "row", gap: isTabletOrMobile ? 5 : 0, display: hideSelects ? 'none' : 'flex'}}>
                <div className="selectBox glasstransparent" style={{padding: 10}}>
                <p style={{padding: 0, margin:0}}>Album: </p>
                <select value={selectedAlbum} onChange={(e) => handleAlbumChange(e.target.value)} style={{ minWidth: "10rem", minHeight: "2.5rem", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "black", width: isTabletOrMobile ? '100%' : null }}>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
                </div>
                <div className="selectBox glasstransparent" style={{padding: 10}}>
                <p style={{padding: 0, margin:0}}>Song:</p>
                <select
                  value={selectedSong}
                  onChange={(e) => handleSongChange(e.target.value)}
                  onClick={() => setIsStopped(!isStopped)}
                  style={{ minWidth: "10rem", minHeight: "2.5rem", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", color: "black", width: isTabletOrMobile ? '100%' : null }}
                >
                  {songs.map((song) => (
                    <option key={song.id} value={song.id}>
                      {song.number} - {song.name}
                    </option>
                  ))}
                </select>
                </div>
                <div className="selectBox glasstransparent" style={{padding: 10}}>
              <p style={{padding: 0, margin:0}}>Lyrics:</p>
              <select value={selectedTrack} onChange={(e) => handleTrackChange(e.target.value)} style={{ minWidth: '10rem', minHeight: '2.5rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'black', width: isTabletOrMobile ? '100%' : null  }}>
                {currentSources.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.number} - {track.name}
                  </option>
                ))}
              </select>
            </div>
              </div>
              {isTabletOrMobile ? <div style={{display: "flex", margin: 10, gap: 10, justifyContent: "center", alignItems: "center"}}>
          <button onClick={() => setIsSwapped(!isSwapped)} className="glassCard" style={{color: "white"}} >Swap View</button>
          <button onClick={() => setHideMixer(!hideMixer)} className="glassCard" style={{color: "white"}} >{hideMixer ? "Show Mixer" : "Hide Mixer"}</button>
          <button onClick={() => setHideSelects(!hideSelects)} className="glassCard" style={{color: "white"}} >{hideSelects ? "Show Selects" : "Hide Selects"}</button>
        </div> : null}
              {!blobsReady ? <div>
          <img src={loadingSpinner} alt="Loading" width={50} />
        </div> : 
          <div className="audio-mixer" style={{display: "flex", flexDirection: isTabletOrMobile ? "column" : "row", gap: 5, width: '98%' }}>
            <div className="controlsWrapper glasstransparent" style={{width: isTabletOrMobile ? "100%" : "50%", order: isSwapped ? 2 : 1, display: hideMixer ? "none" : "flex", paddingBottom: 5}}>
              <div className="tracks" style={{width: "100%"}}>
                <div className="singleTrack" style={{width: "100%"}}>
                  <Channel
                    sources={currentSources}
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
            <div className="lyricsWrapperr glasstransparent" style={{display: "flex", width: isTabletOrMobile ? '100%' : '40%', justifyContent: "center", alignItems: "center", order: isSwapped ? 1 : 2}}>
            <div style={{width: isTabletOrMobile ? "100%" : hideMixer ? "100%" : "25rem", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", marginTop: isTabletOrMobile ? 5 : 0, padding: 10}}>
            <h3 style={{margin: 0}}>Lyrics</h3>
            {lrcsReady ? noTrackLrc ? <div style={{width: isTabletOrMobile ? "100%" : "25rem", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", paddingBottom: 10, height: 400 }}><p style={{fontSize: "1.25rem", }}>No Lyrics for this track found</p><Link to={`/lyricseditor?albumId=${selectedAlbum}&songId=${selectedSong}&trackId=${selectedTrack}`}><button>Add Album</button></Link></div> :       
            <div className="lyrics" style={{marginLeft: 0, paddingLeft: 0, width: "100%"}}>
              <Lyrics
                sounds={songs}
                currentLrcs={currentLrcs}
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
                selectedTrack={selectedTrack}
                setNoLrcs={setNoLrcs}
                noLrcs={noLrcs}
                noTrackLrc={noTrackLrc}
                setNoTrackLrc={setNoTrackLrc}
                hideMixer={hideMixer}
                selectedAlbum={selectedAlbum}
              />
            </div> : noLrcs ? <div style={{width: isTabletOrMobile ? "100%" : "25rem", display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", marginLeft: isTabletOrMobile ? 0 : "0rem"}}><p style={{fontSize: "1.25rem", }}>No Lyrics for this song found</p><Link to={`/lyricseditor?albumId=${selectedAlbum}&songId=${selectedSong}&trackId=${selectedTrack}`}><button>Add Lyrics</button></Link></div> : <div>
          <img src={loadingSpinner} alt="Loading" width={50} />
        </div>
          }
          </div>
          </div>
          </div>
        }
        {!isTabletOrMobile ? <div style={{display: "flex", marginTop: 10, gap: isTabletOrMobile ? 5 : 10, justifyContent: "center", alignItems: "center"}}>
          <button onClick={() => setIsSwapped(!isSwapped)} className="glassCard" style={{color: "white"}} >Swap View</button>
          <button onClick={() => setHideMixer(!hideMixer)} className="glassCard" style={{color: "white"}} >{hideMixer ? "Show Mixer" : "Hide Mixer"}</button>
        </div> : null }
        </div>
      )}
      </div>
    </>
  );
};

export default App;
