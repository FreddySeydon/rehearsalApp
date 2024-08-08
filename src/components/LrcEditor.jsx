import React, { useState, useEffect } from 'react';
import '../App.css';
import Channel from './Channel';
import LyricsSync from './LyricsSync';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { useMediaQuery } from 'react-responsive';
import { getStorage, ref, getBlob } from 'firebase/storage';
import loadingSpinner from '../assets/img/loading.gif';
import { sortSongsList } from '../../utils/utils';
import { formatTimeMilliseconds } from '../../utils/lrcParser';
import { useUser } from '../context/UserContext';
import { fetchAlbumsList } from '../../utils/databaseOperations';
import { fetchSongsList } from '../../utils/databaseOperations';
import { Link } from 'react-router-dom';
import { sortArrayByNumberKey } from '../../utils/utils';
import LoadingSpinner from './LoadingSpinner';

const LrcEditor = ({albumId, songId, trackId, searchParams, setSearchParams}) => {
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("")
  const [loading, setLoading] = useState(true);
  const [globalSeek, setGlobalSeek] = useState(0);
  const [statePlayers, setStatePlayers] = useState(null);
  const [stateSolos, setStateSolos] = useState(null);
  const [trackDuration, setTrackDuration] = useState(0);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [currentSources, setCurrentSources] = useState([]);
  const [blobsReady, setBlobsReady] = useState(false);
  const [hideMixer, setHideMixer] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [existingLyrics, setExistingLyrics] = useState("");
  const [lrcsReady, setLrcsReady] = useState(false);
  const [lrcs, setLrcs] = useState([]);
  const [currentTrackLrc, setCurrentTrackLrc] = useState([]);
  const [noTrackLrc, setNoTrackLrc] = useState(false);
  const [editing, setEditing] = useState(true);
  const [seekUpdateInterval, setSeekUpdateInterval] = useState(null)
  const [noAlbums, setNoAlbums] = useState(false);
  const [isStopped, setIsStopped] = useState(false);
  const [playerStopped, setPlayerStopped] = useState(true);
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
  const [hideSelects, setHideSelects] = useState(false);

  const {user, authLoading} = useUser();


  const fetchAlbums = async () => {
    setAlbums([]);
    try {
      const albumsList = await fetchAlbumsList(user);
        setAlbums(albumsList);
        if(albumsList.length === 0){
          setNoAlbums(true)
        }
        if (albumsList.length > 0) {
          if(albumId){
            const albumExists = albumsList.find((album) => album.id === albumId)
            if(albumExists){
              setSelectedAlbum(albumId);
              return
            }
            console.log("You can't view this album.")
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
          }
          setSelectedAlbum(albumsList[0].id); // Set the first album as the default selected album
          setSearchParams({...Object.fromEntries(searchParams), albumId: albumsList[0].id})
        }
    } catch (error) {
      console.error('Error fetching albums:', error);
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
      if (songsList.length > 0) {
        if(songId){
          const songExists = songsList.find((song) => song.id === songId)
          if(songExists){
            setSelectedSong(songId);
            return
          }
          console.log("You can't view this song.")
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
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTracks = async () => {
    setBlobsReady(false);
    const storage = getStorage();
    if (songs.length !== 0 && !loading) {
      const currentTracks = songs.find((song) => song.id === selectedSong)?.tracks;
      const currentSourcesArray = await Promise.all(
        currentTracks.map(async (track) => {
          const httpsReference = ref(storage, track.src);
          const blob = await getBlob(httpsReference);
          const blobURL = URL.createObjectURL(blob);
          return { ...track, src: blobURL };
        })
      );
      if(currentSourcesArray !== 0){
        const sortedCurrentSourcesArray = sortArrayByNumberKey(currentSourcesArray);
        setCurrentSources(sortedCurrentSourcesArray)
        if(trackId){
          const trackExists = currentSourcesArray.find((track) => track.id === trackId)
          if(trackExists){
            setSelectedTrack(trackId);
            return
          }
          console.log("You can't view this album.")
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
        }
        setSelectedTrack(currentSourcesArray[0].id); // Set the first album as the default selected album
        setSearchParams({...Object.fromEntries(searchParams), trackId: currentSourcesArray[0].id})
      }    
    }
  };


  const fetchTrackLrcs = async(trackId) => {
    const currentTrackId = trackId ? trackId : selectedTrack;
    setLrcsReady(false);
    setCurrentTrackLrc([]);
    setExistingLyrics("");
    const storage = getStorage();
    if(lrcs.length !== 0 && !loading){
      const currentLrcs = lrcs.find((song) => song.id === selectedSong)?.lrcs;
        const trackLrc = currentLrcs ?  currentLrcs.find((lrc) => lrc.trackId === currentTrackId) : null;
      
      if(trackLrc){
        const httpsReference = ref(storage, trackLrc.lrc);
        const blob = await getBlob(httpsReference)
        const currentLrcSource = {...trackLrc, lrc: blob}
        // const currentLrcSourcesArray = await Promise.all(trackLrcArray.map(async(lrc) => {
        //   const httpsReference = ref(storage, lrc.lrc);
        //   const blob = await getBlob(httpsReference);
          // const blobURL = URL.createObjectURL(blob);
          // return {...lrc, lrc: blob}
        // }))
        setCurrentTrackLrc(currentLrcSource)
        const lrcText = await currentLrcSource.lrc.text()
        setExistingLyrics(lrcText)
        setNoTrackLrc(false);
        setEditing(false)
      } else {
        setNoTrackLrc(true);
        setCurrentTrackLrc([])
        setExistingLyrics("")
        setEditing(true)
      }
    }
  }

  useEffect(() => {
    if(user){
      fetchAlbums();
    }
    
  }, [user]);

  useEffect(() => {
    if(lrcs.length !== 0 && selectedTrack){
      fetchTrackLrcs(selectedTrack);
    }
  }, [lrcs, selectedTrack])

  useEffect(() => {
    if (selectedAlbum) {
      fetchSongs(selectedAlbum);
    }
  }, [selectedAlbum]);

  useEffect(() => {
    fetchCurrentTracks();
  }, [selectedSong]);

  useEffect(() => {
    if (currentSources.length !== 0) {
      setBlobsReady(true);
    } else {
      setBlobsReady(false);
    }
  }, [currentSources]);

  useEffect(() => {
    if(blobsReady){
      setTimeout(() => {
        setSearchParams({...Object.fromEntries(searchParams), songId: selectedSong, trackId: selectedTrack})
      }, 500)
    }
  }, [blobsReady])

  const handleAlbumChange = (albumId) => {
    setSelectedAlbum(albumId);
    setSearchParams({...Object.fromEntries(searchParams), albumId: albumId})
  };

  const handleSongChange = (songId) => {
    setSelectedSong(songId);
    // setSelectedTrack(1);
    setExistingLyrics("");
    setSearchParams({...Object.fromEntries(searchParams), songId: songId})
  };

  const handleTrackChange = (trackId) => {
    setSelectedTrack(trackId)
    fetchTrackLrcs(trackId)
    setSearchParams({...Object.fromEntries(searchParams), trackId: trackId})
  }

  if(authLoading){
    return <LoadingSpinner />
  }

  if(noAlbums){
    return <div><h2>Welcome to Chord Chaos!</h2><h3>Start by adding your first album</h3><Link to={'/sharecode'}><button className='glass'>Add First Album</button></Link></div>
  }

  return (
    <>
      {loading || !songs ? (
        <div>
          <img src={loadingSpinner} alt="Loading" width={50} />
        </div>
      ) : (
        <div className="appWrapper" style={{ padding: isTabletOrMobile ? '1rem' : '1rem' }}>
          <h1 style={{ fontSize: isTabletOrMobile ? '1.5rem' : '2rem' }}>Sync Lyrics</h1>
          <div className="selectBoxWrapper" style={{ flexDirection: isTabletOrMobile ? 'column' : 'row', display: hideSelects ? 'none' : 'flex', gap: 5 }}>
            <div className="selectBox glass" style={{paddingRight: 10, paddingBottom: 10, paddingLeft: 10}}>
              <p>Select Album: </p>
              <select value={selectedAlbum} onClick={() => setIsStopped(!isStopped)} onChange={(e) => handleAlbumChange(e.target.value)} style={{ minWidth: '10rem', minHeight: '2.5rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'black', width: isTabletOrMobile ? '100%' : '100%'  }}>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="selectBox glass" style={{paddingRight: 10, paddingBottom: 10, paddingLeft: 10}}>
              <p>Song:</p>
              <select value={selectedSong} onClick={() => setIsStopped(!isStopped)} onChange={(e) => handleSongChange(e.target.value)} style={{ minWidth: '10rem', minHeight: '2.5rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'black', width: isTabletOrMobile ? '100%' : null  }}>
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.number} - {song.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="selectBox glass" style={{paddingRight: 10, paddingBottom: 10, paddingLeft: 10}}>
              <p>Track:</p>
              <select value={selectedTrack} onChange={(e) => handleTrackChange(e.target.value)} style={{ minWidth: '10rem', minHeight: '2.5rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'black', width: isTabletOrMobile ? '100%' : null  }}>
                {currentSources.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.number} - {track.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{display: 'flex', flexDirection: 'row', gap: 10, marginBottom: 10, justifyContent: 'center', alignItems: 'center'}}>
          <button className='glass' onClick={() => setHideSelects(!hideSelects)}>{hideSelects ? "Show Selects" : "Hide Selects"}</button>
          <button onClick={() => setHideMixer(!hideMixer)} className='glass'>{hideMixer ? "Show Mixer" : "Hide Mixer"}</button>
          </div>
          {!blobsReady ? (
            <div>
              <img src={loadingSpinner} alt="Loading" width={50} />
            </div>
          ) : (
            <div className="syncWrapper" style={{width: "100%", display: "flex", justifyContent: "center", flexDirection: isTabletOrMobile ? 'column' : 'row', alignItems: "center", gap: isTabletOrMobile ? 0 : 5 }}>
              <div className="controlsWrapper glasstransparent" style={{display: hideMixer ? "none" : "block", width: isTabletOrMobile ? "100%" : '40%', padding: 10}}>
                <div className="tracks" style={{width: "100%"}} >
                  <div className="singleTrack" style={{width: "100%"}}>
                    <Channel
                      sources={currentSources}
                      globalSeek={globalSeek}
                      setGlobalSeek={setGlobalSeek}
                      selectedSong={selectedSong}
                      setSelectedSong={setSelectedSong}
                      statePlayers={statePlayers}
                      setStatePlayers={setStatePlayers}
                      stateSolos={stateSolos}
                      setStateSolos={setStateSolos}
                      setTrackDuration={setTrackDuration}
                      trackDuration={trackDuration}
                      playing={playing}
                      setPlaying={setPlaying}
                      isTabletOrMobile={isTabletOrMobile}
                      isDesktopOrLaptop={true}
                      formatTime={formatTimeMilliseconds}
                      setLoading={setLoading}
                      loading={loading}
                      sounds={songs}
                      clearMute={false}
                      setClearMute={() => {}}
                      isStopped={isStopped}
                      setIsStopped={setIsStopped}
                      setSeekUpdateInterval={setSeekUpdateInterval}
                      seekUpdateInterval={seekUpdateInterval}
                      playersLoaded={playersLoaded}
                      setPlayersLoaded={setPlayersLoaded}
                      setPlayerStopped={setPlayerStopped}
                      playerStopped={playerStopped}
                    />
                  </div>
                </div>
              </div>
              <div className='glasstransparent' style={{padding: 10, width: isTabletOrMobile ? '100%' : hideMixer ? '100%' : '50%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', marginTop: isTabletOrMobile ? 5 : 0}}>
                <h3 style={{ marginBottom:  0, marginTop: 5 }}>Lyrics</h3>
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                <LyricsSync
                  statePlayers={statePlayers}
                  globalSeek={globalSeek}
                  setGlobalSeek={setGlobalSeek}
                  selectedSong={selectedSong}
                  isTabletOrMobile={isTabletOrMobile}
                  hideMixer={hideMixer}
                  setHideMixer={setHideMixer}
                  playing={playing}
                  setPlaying={setPlaying}
                  trackDuration={trackDuration}
                  existingLyrics={existingLyrics}
                  selectedTrack={selectedTrack}
                  selectedAlbum={selectedAlbum}
                  editing={editing}
                  setEditing={setEditing}
                  lrcs={lrcs}
                  seekUpdateInterval={seekUpdateInterval}
                  setSeekUpdateInterval={setSeekUpdateInterval}
                  songs={songs}
                  user={user}
                  currentTrackLrc={currentTrackLrc}
                  fetchAlbums={fetchAlbums}
                  noTrackLrc={noTrackLrc}
                  playersLoaded={playersLoaded}
                  setHideSelects={setHideSelects}
                />
                </div>
                <div></div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default LrcEditor;
