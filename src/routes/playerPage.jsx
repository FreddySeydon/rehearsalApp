import React, {useState, useEffect} from 'react'
import App from '../App'
import loadingSpinner from '../assets/img/loading.gif'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive'
import { verifyPublicAccess } from '../../utils/databaseOperations'

const PlayerPage = () => {

    const [loading, setLoading] = useState(false);
    const [albumId, setAlbumId] = useState()
    const [songId, setSongId] = useState()
    const [trackId, setTrackId] = useState()
    const [isPublic, setIsPublic] = useState(false)
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });
    console.log("Playerpage is public: ",isPublic)
    console.log("albumId: ",albumId)

    useEffect(() => {
        if(searchParams){
            setAlbumId(searchParams.get('albumId'))
           setSongId(searchParams.get('songId'))
           console.log("Get song id: ",searchParams.get('songId'))
            setTrackId(searchParams.get('trackId'))
            setIsPublic(searchParams.get('isPublic'))
        }
    }, [searchParams])

console.log("PlayerPageVars: ", "AlbumID: ", albumId, "SongId:", songId, "TrackId: ", trackId, "isPublic: ", isPublic)

    useEffect(() => { 
        const publicVerified = verifyPublicAccess(isPublic);
        if(!publicVerified){
            return navigate("/login");
        }
        // return navigate("/public/player")
      }, [albumId, songId, isPublic]);


  return (
    <div style={{width: '90vw', overflow: 'hidden', paddingTop: isTabletOrMobile ? 55 : 100}}>
        {
            loading ? 
                <img src={loadingSpinner} width={50} alt="Loading" /> : 
                    <App albumId={albumId} songId={songId} trackId={trackId} searchParams={searchParams} isPublic={isPublic} setSearchParams={setSearchParams} />
        }
    </div>
  )
}

export default PlayerPage