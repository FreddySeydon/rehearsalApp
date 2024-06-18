import React from 'react'
import { useUser } from '../context/UserContext'
import ShareCodeInput from '../components/ShareCodeInput';

const ShareCodePage = () => {

    const {user, authLoading} = useUser();

  return (
    <div>
        <h2>Enter your share code below</h2>
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
