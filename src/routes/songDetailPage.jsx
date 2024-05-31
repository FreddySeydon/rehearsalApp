import React, { useEffect, useState } from 'react'
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../utils/firebase';
import { Link, useParams } from 'react-router-dom';
import LrcUpload from '../components/LrcUpload';
import UpdateAudioFile from '../components/UpdateAudioFile';

const SongDetailPage = () => {
    console.log(useParams())
    const {songId, albumId} = useParams();
    // console.log("Params album: ",albumId)
    const [selectedSong, setSelectedSong] = useState("");
    const [tracks, setTracks] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lrcs, setLrcs] = useState(null);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            // const songRef = doc(db, "albums", albumId, songId)
          const songSnapshot = await getDoc(doc(db, `albums/${albumId}/songs/${songId}`));
          const songData = songSnapshot.data()
          console.log(songData)
          const tracksList = songData.tracks
          const lrcList = songData.lrcs
          if(lrcList){
              const lrcMap = lrcList.reduce((acc, lrcData) => {
                acc[lrcData.trackId] = lrcData.lrc;
                return acc;
            }, {});
            setLrcs(lrcMap);
          }
          console.log(tracksList)
          setTracks(tracksList);
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

  return (
    <div>
        <h2>Tracks: {albumId} / {songId}</h2>
        {loading ? 
            (<div>Loading...</div>) : error ? 
                (<div>There was an error: {`${error}`}</div>) : 
                   (tracks.map((track, index) => {
                    return(
                       <div key={index}>
                           <h2>Track {track.id} - {track.name}</h2>
                            <div>
                                {/* <h3>Track {track.id}</h3> */}
                                <h3>Name: {track.name}</h3>
                                <div>File: <UpdateAudioFile albumId={albumId} songId={songId} trackId={track.id} /></div>
                                <h3>{getLRCForTrack(track.id) ? "Lyrics" : null} {getLRCForTrack(track.id) || <LrcUpload albumId={albumId} songId={songId} trackId={track.id} trackName={track.name}/>}</h3>
                            </div>
                           
                       </div>
                    )
                })) }
    </div>
  )
}

export default SongDetailPage
