import React from 'react'
import { useUser } from '../context/UserContext'
import { signOut } from 'firebase/auth';
import { auth } from '../../utils/firebase';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Logo from '../assets/img/logo.jpg'
import './Navbar.css'

const Navbar = () => {
    const {user, authLoading} = useUser();
    const navigate = useNavigate();

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
            Your Albums
        </Link>
        {/* <Link to="/lyricseditor">
            Lyrics Editor
        </Link> */}
        <Link to="/lyricseditor">
            Lyrics Editor
        </Link>
        {/* <Link to="/profile">
            Profile
        </Link> */}
        <Link to="/player">
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
