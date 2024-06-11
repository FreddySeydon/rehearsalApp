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

const LrcEditor = ({albumId, songId}) => {
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(1)
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
  const [noTrackLrc, setNoTrackLrc] = useState(true);

  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });

  const fetchAlbums = async () => {
    try {
      const albumsSnapshot = await getDocs(collection(db, 'albums'));
      const albumsList = [];
      albumsSnapshot.forEach((doc) => {
        albumsList.push({ id: doc.id, ...doc.data() });
        });
        setAlbums(albumsList);
        if (albumsList.length > 0) {
        setSelectedAlbum(albumId);
        // setSelectedAlbum(albumsList[0].id);
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
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
      const sortedSongsList = sortSongsList(songsList);
      setSongs(sortedSongsList);
      const lrcsList = [];
      songsList.forEach((song) => lrcsList.push({id: song.id, lrcs: song.lrcs}))
      setLrcs(lrcsList);
      fetchCurrentTracks();
      if (songsList.length > 0) {
        setSelectedSong(songId);
        setSelectedTrack(1);
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
      setCurrentSources(currentSourcesArray);
      
    }
  };


  const fetchTrackLrcs = async(trackId) => {
    const currentTrackId = trackId ? parseInt(trackId) : parseInt(selectedTrack);
    setLrcsReady(false);
    setCurrentTrackLrc([]);
    setExistingLyrics("");
    const storage = getStorage();
    if(lrcs.length !== 0 && !loading){
      const currentLrcs = lrcs.find((song) => song.id === selectedSong)?.lrcs;
      const trackLrc = currentLrcs.find((lrc) => lrc.trackId === currentTrackId);
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
      } else {
        setNoTrackLrc(true);
        setCurrentTrackLrc([])
        setExistingLyrics("")
      }
    }
  }

  useEffect(() => {
    fetchAlbums();
    
  }, []);

  useEffect(() => {
    if(lrcs.length !== 0){
      fetchTrackLrcs();
    }
  }, [lrcs])

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

  const handleAlbumChange = (albumId) => {
    setSelectedAlbum(albumId);
  };

  const handleSongChange = (songId) => {
    setSelectedSong(songId);
    setSelectedTrack(1);
    setExistingLyrics("");
  };

  const handleTrackChange = (trackId) => {
    setSelectedTrack(trackId)
    fetchTrackLrcs(trackId)
  }

  return (
    <>
      {loading && !songs ? (
        <div>
          <img src={loadingSpinner} alt="Loading" width={'5rem'} />
        </div>
      ) : (
        <div className="appWrapper" style={{ padding: isTabletOrMobile ? '1rem' : '5rem' }}>
          <h1 style={{ fontSize: isTabletOrMobile ? '1.5rem' : '2rem' }}>Sync Lyrics</h1>
          <div className="selectBoxWrapper" style={{ flexDirection: isTabletOrMobile ? 'column' : 'row' }}>
            <div className="selectBox">
              <p>Select Album: </p>
              <select value={selectedAlbum} onChange={(e) => handleAlbumChange(e.target.value)} style={{ minWidth: '10rem', minHeight: '2.5rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'black' }}>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="selectBox">
              <p>Song:</p>
              <select value={selectedSong} onChange={(e) => handleSongChange(e.target.value)} style={{ minWidth: '10rem', minHeight: '2.5rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'black' }}>
                {songs.map((song) => (
                  <option key={song.id} value={song.id}>
                    {song.number} - {song.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="selectBox">
              <p>Track:</p>
              <select value={selectedTrack} onChange={(e) => handleTrackChange(e.target.value)} style={{ minWidth: '10rem', minHeight: '2.5rem', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: 'black' }}>
                {currentSources.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.id} - {track.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!blobsReady ? (
            <div>
              <img src={loadingSpinner} alt="Loading" width={50} />
            </div>
          ) : (
            <div className="syncWrapper" style={{width: "100%", display: "flex", justifyContent: "center", flexDirection: isTabletOrMobile ? 'column' : 'row' }}>
              <div className="controlsWrapper" style={{display: hideMixer ? "none" : "block"}}>
                <div className="tracks" >
                  <div className="singleTrack">
                    <button onClick={() => setHideMixer(!hideMixer)}>{hideMixer ? "Show Mixer" : "Hide Mixer"}</button>
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
                      isStopped={false}
                      setIsStopped={() => {}}
                      setSeekUpdateInterval={() => {}}
                      seekUpdateInterval={null}
                      playersLoaded={playersLoaded}
                      setPlayersLoaded={setPlayersLoaded}
                    />
                  </div>
                </div>
              </div>
              <div style={{ width: isTabletOrMobile ? '100%' : hideMixer ? '100%' : '25rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', marginLeft: isTabletOrMobile ? 0 : hideMixer ? '0rem' : '5rem' }}>
                <h3 style={{ paddingLeft: isTabletOrMobile ? 0 : 60 }}>Lyrics Sync</h3>
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
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default LrcEditor;
