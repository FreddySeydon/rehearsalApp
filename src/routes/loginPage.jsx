import React, {useEffect, useState} from 'react'
import Login from '../components/Login'
import { useSearchParams } from 'react-router-dom'

const LoginPage = () => {

  const [searchParams, setSearchParams] = useSearchParams();
  const [mode, setMode] = useState('login');

  useEffect(() => {
    if(searchParams){
      setMode(searchParams.get('mode'));
    }
  }, [])
  return (
    <div style={{width: '90vw', overflow: 'hidden'}}>
      <Login mode={mode} setMode={setMode} />
    </div>
  )
}

export default LoginPage
