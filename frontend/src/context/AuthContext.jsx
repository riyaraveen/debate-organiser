import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      getMe()
        .then((res) => {
          setUser(res.data.user)
          setClubs(res.data.clubs || [])
        })
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const loginSuccess = (token, userData, clubsData = []) => {
    localStorage.setItem('token', token)
    setUser(userData)
    setClubs(clubsData)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('active_club')
    localStorage.removeItem('active_club_id')
    setUser(null)
    setClubs([])
  }

  return (
    <AuthContext.Provider value={{ user, clubs, loading, loginSuccess, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
