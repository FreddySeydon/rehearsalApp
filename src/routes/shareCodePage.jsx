import React from 'react'
import { useUser } from '../context/UserContext'
import ShareCodeInput from '../components/ShareCodeInput';
import { useMediaQuery } from 'react-responsive';

const ShareCodePage = () => {

    const {user, authLoading} = useUser();
    const isTabletOrMobile = useMediaQuery({ query: "(max-width: 1224px)" });

  return (
    <div style={{width: isTabletOrMobile ? '90vw' : 400}}>
        <h2>Enter your share code below to add a shared Album</h2>
        {
            authLoading ? <div>Loading</div> : 
            <div>
                <ShareCodeInput user={user} />
            </div>
        }
    </div>
  )
}

export default ShareCodePage
