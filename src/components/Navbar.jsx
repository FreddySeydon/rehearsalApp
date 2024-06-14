import React from 'react'
import { useUser } from '../context/UserContext'
import { signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import Logo from '../assets/img/logo.jpg'
import './Navbar.css'

const Navbar = () => {
    const {user, authLoading} = useUser();

    const handleLogout = async () => {
        await signOut(auth);
      }

  return (
    <>
      <nav className="navbar glass" style={{alignItems: "center", marginBottom: 10, width: "100%"}}>
        <div style={{display: "flex", gap: 10, justifyContent: 'center', alignItems: 'center'}}>
        <img src={Logo} alt="" width={60} height={60} style={{borderRadius: 10}} />
        <h2 style={{margin: 0}}>Rehearsal Rocket</h2>
        </div>
        <div className='navbuttons' style={{gap: 10}}>
        {user ? (
            <div style={{display: 'flex', gap: 10, justifyContent: "center", alignItems: "center"}}>
        <Link to="/albums">
            Your Albums
        </Link>
        {/* <Link to="/lyricseditor">
            Lyrics Editor
        </Link> */}
        <Link to="/lyricseditor">
            Upload Songs
        </Link>
        {/* <Link to="/profile">
            Profile
        </Link> */}
        <Link to="/player">
          <button className='glassCard'>Start Player</button>
        </Link>
        <button onClick={handleLogout} className='glassCard'>Logout</button>
        </div>
        ) : (
          <Link to="/login?mode=login">
            <button className='glassCard'>Login</button>
          </Link>
        )}
        </div>
      </nav>
    </>
  )
}

export default Navbar
