import React, {useState, useEffect} from 'react'
import App from '../App'
import loadingSpinner from '../assets/img/loading.gif'
import { useParams, useSearchParams } from 'react-router-dom'
import { useMediaQuery } from 'react-responsive'

const PlayerPage = () => {

    const [loading, setLoading] = useState(false);
    const [albumId, setAlbumId] = useState('')
    const [songId, setSongId] = useState('')
    const [trackId, setTrackId] = useState('')

    const [searchParams, setSearchParams] = useSearchParams();

    const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });

    useEffect(() => {
        if(searchParams){
            setAlbumId(searchParams.get('albumId'))
           setSongId(searchParams.get('songId'))
            setTrackId(searchParams.get('trackId'))
        }
    }, [searchParams])


  return (
    <div style={{width: '90vw', overflow: 'hidden', paddingTop: isTabletOrMobile ? 55 : 100}}>
        {
            loading ? 
                <img src={loadingSpinner} width={50} alt="Loading" /> : 
                    <App albumId={albumId} songId={songId} trackId={trackId} searchParams={searchParams} setSearchParams={setSearchParams} />
        }
    </div>
  )
}

export default PlayerPage