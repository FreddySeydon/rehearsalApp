import React from 'react'
import { useUser } from '../context/UserContext'
import ShareCodeInput from '../components/ShareCodeInput';

const ShareCodePage = () => {

    const {user, authLoading} = useUser();

  return (
    <div style={{width: 400}}>
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
