import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { auth } from '../../utils/firebase';
import { signOut } from 'firebase/auth';
import Logo from '../assets/img/logo.jpg'
import './landingPage.css';
import { useSearchParams } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';

const LandingPage = () => {
  const { user, authLoading } = useUser()
  const [searchParams, setSearchParams] = useSearchParams();
  const [info, setInfo] = useState();

  const isDesktopOrLaptop = useMediaQuery({ query: "(min-width: 1224px)" });
  const isBigScreen = useMediaQuery({ query: "(min-width: 1824px)" });
  const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });


  const handleLogout = async () => {
    await signOut(auth);
  }


  useEffect(() => {
    if(searchParams.get('status') === 'logged-out'){
      setInfo('You have been logged out. See ya!')
    }
  }, [searchParams])


  return (
    <div className="landing-page">
        {/* <h1>Rehearsal Rocket</h1> */}
      {/* <nav className="navbar glass">
        <div style={{display: "flex", gap: 10, justifyContent: 'center', alignItems: 'center'}}>
        <img src={Logo} alt="" width={60} height={60} style={{borderRadius: 10}} />
        <h2 style={{margin: 0}}>Rehearsal Rocket</h2>
        </div>
        <div className='navbuttons' style={{gap: 10}}>
        {user ? (
            <div style={{display: 'flex', gap: 10}}>
        <Link to="/player">
          <button className='glassCard'>Start</button>
        </Link>
        <button onClick={handleLogout} className='glassCard'>Logout</button>
        </div>
        ) : (
          <Link to="/login?mode=login">
            <button className='glassCard'>Login</button>
          </Link>
        )}
        </div>
      </nav> */}
      {info ? <div className='glassCard' style={{marginBottom: 10}}><h2>{info}</h2></div> : null }
      <header className="landing-header">
        <div className='hero glasstransparent' style={{padding: 15, display: "flex", flexDirection: isTabletOrMobile ? 'column': 'row'}}>
        <img src={Logo} alt="Rehearsal Rocket Logo" width={"50%"} style={{borderRadius: 30}}/>
        <div style={{width: isTabletOrMobile ? "100%" : "50%", display: "flex", flexDirection: "column", justifyContent: 'flex-start', alignItems: 'center'}}>
            <p style={{fontSize: "xx-large", padding: 0, margin: 0   }}>Welcome to</p>
        <h1 style={{paddingTop: 0, marginTop: 0, marginBottom: 0}}>Rehearsal Rocket</h1>
        <h2 style={{marginBottom: 0}}>
          Your ultimate music rehearsal companion. 
        </h2>
        <p style={{paddingTop: 0, marginTop: 0}}>Sync lyrics with your tracks and make rehearsals seamless.</p>
        <div style={{width: "80%"}}>
            
            <Link to={user ? "/player" : "/login?mode=signup"} style={{width: "100%"}}>
            <button className='glassCard' style={{color: 'white', width: "100%", fontSize: "x-large", fontWeight: "bold"}}>Start Now</button>
            </Link>
        </div>
        </div>
        </div>
      </header>
    </div>
  );
};

export default LandingPage;
