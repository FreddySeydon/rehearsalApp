import React, {useState, useEffect} from 'react'
import { useUser } from '../context/UserContext'
import { signOut } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { Link } from 'react-router-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../assets/img/logo.jpg'
import './Navbar.css'

const Navbar = () => {
    const {user, authLoading} = useUser();
    const navigate = useNavigate();
    const [albumId, setAlbumId] = useState('');
    const [songId, setSongId] = useState('');
    const [trackId, setTrackId] = useState('');
    const [paramsSet, setParamsSet] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams()

    useEffect(() => {
      if(searchParams.get('albumId')){
        setAlbumId(searchParams.get('albumId'))
      }
      if(searchParams.get('songId')){
        setSongId(searchParams.get('songId'))
      }
      if(searchParams.get('trackId')){
        setTrackId(searchParams.get('trackId'))
      }
      
    }, [searchParams])

    useEffect(() => {
      if(albumId && songId && trackId){
        setParamsSet(true);
      }
    }, [albumId, songId, trackId])

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/?status=logged-out')
        console.log("logged out")
      }

  return (
    <>
      <nav className="navbar glassCard" style={{alignItems: "center", marginBottom: 10, width: "100%"}}>
        <div style={{display: "flex", gap: 10, justifyContent: 'center', alignItems: 'center'}}>
        <img src={Logo} alt="" width={60} height={60} style={{borderRadius: 10}} />
        <h2 style={{margin: 0}}>Rehearsal Rocket</h2>
        </div>
        <div className='navbuttons' style={{gap: 15}}>
        {user ? (
            <div style={{display: 'flex', gap: 20, justifyContent: "center", alignItems: "center", fontSize: "large"}}>
        <Link to="/albums">
            Albums
        </Link>
        <Link to={paramsSet ? `/lyricseditor?albumId=${albumId}&songId=${songId}&trackId=${trackId}` : '/lyricseditor'}>
            Lyrics Editor
        </Link>
        {/* <Link to="/profile">
            Profile
        </Link> */}
        <Link to={paramsSet ? `/player?albumId=${albumId}&songId=${songId}&trackId=${trackId}` : '/player'}>
          Player
        </Link>
        <button onClick={handleLogout} className='glass' style={{fontSize: "medium"}}>Logout</button>
        </div>
        ) : (
          <Link to="/login?mode=login">
            <button className='glass'>Login</button>
          </Link>
        )}
        </div>
      </nav>
    </>
  )
}

export default Navbar
