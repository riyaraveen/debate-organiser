import { createContext, useContext, useState, useCallback } from 'react'

const ClubContext = createContext(null)

export function ClubProvider({ children }) {
  const [activeClub, setActiveClubState] = useState(() => {
    try {
      const stored = localStorage.getItem('active_club')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const setActiveClub = useCallback((club) => {
    if (club) {
      localStorage.setItem('active_club', JSON.stringify(club))
      localStorage.setItem('active_club_id', String(club.id))
    } else {
      localStorage.removeItem('active_club')
      localStorage.removeItem('active_club_id')
    }
    setActiveClubState(club)
  }, [])

  const clearClub = useCallback(() => setActiveClub(null), [setActiveClub])

  return (
    <ClubContext.Provider value={{ activeClub, setActiveClub, clearClub }}>
      {children}
    </ClubContext.Provider>
  )
}

export const useClub = () => useContext(ClubContext)
