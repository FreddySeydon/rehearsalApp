import React, { useEffect, useState } from 'react'
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link, useParams } from 'react-router-dom';
import LrcUpload from '../components/LrcUpload';
import UpdateAudioFile from '../components/UpdateAudioFile';
import UpdateLrcFile from '../components/UpdateLrcFile';
import DeleteTrack from '../components/DeleteTrack';
import "./songDetailPage.css";
import { useUser } from '../context/UserContext';
import { useMediaQuery } from 'react-responsive';
import { sortArrayByNumberKey } from '../../utils/utils';
import LoadingSpinner from '../components/LoadingSpinner';

const SongDetailPage = () => {
    const {songId, albumId} = useParams();
    const [selectedSong, setSelectedSong] = useState("");
    const [tracks, setTracks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lrcs, setLrcs] = useState(null);
    const [fullSongData, setFullSongData] = useState(null)

    const {user, authLoading} = useUser();

    const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });

    const fetchSongs = async () => {
        setLoading(true);
        try {
            // const songRef = doc(db, "albums", albumId, songId)
          const songSnapshot = await getDoc(doc(db, `albums/${albumId}/songs/${songId}`));
          const songData = songSnapshot.data()
          setFullSongData(songData);
          const tracksList = songData.tracks
          // console.log(song)
          const lrcList = songData.lrcs
          if(lrcList){
              const lrcMap = lrcList.reduce((acc, lrcData) => {
                acc[lrcData.trackId] = lrcData.lrc;
                return acc;
            }, {});
            setLrcs(lrcMap);
          }
          const sortedTracksList = sortArrayByNumberKey(tracksList)
          setTracks(sortedTracksList);
        } catch (error) {
          console.error("Error fetching songs:", error);
          setError(error)
          setLoading(false)
        } finally {
          setLoading(false);
        }
      };

      useEffect(() => {
        fetchSongs()
      }, [])

      const getLRCForTrack = (trackId) => {
        if(lrcs){
            return lrcs ? lrcs[trackId] || null : null;
        }
      }

      const renderLoading = () => (
        <LoadingSpinner/>
    );

    const renderError = () => (
        <div>There was an error: {`${error}`}</div>
    );

    const renderTracks = () => (
        tracks.map((track, index) => (
            <div key={track.id} className='glasstransparent' style={{marginBottom: 10, padding: 20, width: '90%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                <h2>Track {track.number} - {track.name}</h2>
                <div className='trackcardcontent' style={{display: 'flex', flexDirection: isTabletOrMobile ? 'column' : 'row', marginBottom: 25, gap: isTabletOrMobile ? 5 : 40, width: '100%'}}>
                      {user.uid === track.ownerId ?                       
                    <div>
                      <div style={{display:"flex", flexDirection: "column", gap: 10, padding: 15, minHeight: 140, width: isTabletOrMobile ? '112%' : '50%'}} className='glassCard'>
                        <p style={{fontWeight: "bold", fontSize: "1.2rem", marginBottom: 2, marginTop: 0}}>Audio File</p>
                        <UpdateAudioFile albumId={albumId} songId={songId} trackId={track.id} />
                        {tracks.length > 1 ? 
                           user.uid === track.ownerId ? <DeleteTrack albumId={albumId} songId={songId} trackId={track.id} refetchSongs={fetchSongs} /> : null : 
                            null
                        }
                        </div> 
                    </div> : null
                    }
                    <div className='glassCard' style={{ display: 'flex', flexDirection:"column", padding: 15, minHeight: 140, gap: 10, width: isTabletOrMobile ? '90%' : "50%"}}>
                      <p style={{fontWeight: "bold", fontSize: "1.2rem", marginBottom: 2, marginTop: 0}}>Lyrics</p>
                        {/* <p style={{fontWeight: "bold", fontSize: "1.2rem", marginBottom: 2, marginTop: 0}}>{getLRCForTrack(track.id) ? "Lyrics" : null}</p>  */}
                        <Link to={`/lyricseditor?albumId=${albumId}&songId=${songId}&trackId=${track.id}`} style={{width: "100%"}}>
                        <button className='glass' style={{width: "100%"}}>{getLRCForTrack(track.id) ? `Edit Lyrics` : `Add Lyrics`}</button>
                        </Link>
                        {getLRCForTrack(track.id) ? 
                            <UpdateLrcFile albumId={albumId} songId={songId} trackId={track.id} refetchSongs={fetchSongs} trackName={track.name} user={user} authLoading={authLoading} /> : 
                            <LrcUpload albumId={albumId} songId={songId} trackId={track.id} trackName={track.name} refetchSongs={fetchSongs}/>
                        }
                    </div>
                </div>
            </div>
        ))
    );

    return (
        <div className='glasstransparent' style={{display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: 100,padding: 20, width:"80vw"}}>
            <h2 style={{marginBottom: 0}}>{loading || error ? null : fullSongData.tracks.length} Tracks</h2>
            {loading ? null : error ? null : <h2 style={{marginTop: 0}}>{`${fullSongData.number}. ${fullSongData.name}`}</h2>}
            {loading ? renderLoading() : error ? renderError() : renderTracks()}
        </div>
    );
}

export default SongDetailPage;
