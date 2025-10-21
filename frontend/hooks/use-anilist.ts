import { useState, useEffect } from 'react'

interface AniListUser {
  id: number
  name: string
  avatar: {
    medium: string
  }
}

interface MediaListEntry {
  id: number
  progress: number
  status: 'CURRENT' | 'COMPLETED' | 'PAUSED' | 'DROPPED' | 'PLANNING' | 'REPEATING'
  media: {
    id: number
    title: {
      romaji: string
      english: string
    }
    coverImage: {
      extraLarge: string
    }
    episodes: number
    status: string
    seasonYear: number
  }
}

interface AniListAuth {
  user: AniListUser | null
  token: string | null
  isLoading: boolean
  login: () => void
  logout: () => void
  updateProgress: (mediaId: number, episode: number, totalEpisodes: number) => Promise<void>
  getContinueWatching: () => Promise<MediaListEntry[]>
}

const ANILIST_CLIENT_ID = process.env.NEXT_PUBLIC_ANILIST_CLIENT_ID || '18282'
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''

export function useAniList(): AniListAuth {
  const [user, setUser] = useState<AniListUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('anilist_token')
    const storedUser = localStorage.getItem('anilist_user')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async () => {
    try {
      // Get OAuth URL from backend
      const response = await fetch('http://localhost:4000/anilist/oauth-url')
      const data = await response.json()
      window.location.href = data.oauth_url
    } catch (error) {
      console.error('Failed to get OAuth URL:', error)
    }
  }

  const logout = () => {
    localStorage.removeItem('anilist_token')
    localStorage.removeItem('anilist_user')
    setToken(null)
    setUser(null)
  }

  const fetchUser = async (accessToken: string) => {
    const query = `
      query {
        Viewer {
          id
          name
          avatar {
            medium
          }
        }
      }
    `

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query })
      })

      const data = await response.json()
      
      if (data.data?.Viewer) {
        const userData = data.data.Viewer
        setUser(userData)
        localStorage.setItem('anilist_user', JSON.stringify(userData))
        localStorage.setItem('anilist_token', accessToken)
        setToken(accessToken)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const updateProgress = async (mediaId: number, episode: number, totalEpisodes: number): Promise<void> => {
    if (!token) throw new Error('Not authenticated')

    const status = episode >= totalEpisodes ? 'COMPLETED' : 'CURRENT'
    
    const mutation = `
      mutation ($mediaId: Int, $progress: Int, $status: MediaListStatus) {
        SaveMediaListEntry (mediaId: $mediaId, progress: $progress, status: $status) {
          id
          progress
          status
        }
      }
    `

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            mediaId,
            progress: episode,
            status
          }
        })
      })

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(data.errors[0].message)
      }

      console.log(`Updated progress for media ${mediaId}: Episode ${episode}/${totalEpisodes} - Status: ${status}`)
    } catch (error) {
      console.error('Error updating progress:', error)
      throw error
    }
  }

  const getContinueWatching = async (): Promise<MediaListEntry[]> => {
    if (!token) return []

    const query = `
      query ($userId: Int) {
        MediaListCollection(userId: $userId, type: ANIME, status: CURRENT) {
          lists {
            entries {
              id
              progress
              status
              media {
                id
                title {
                  romaji
                  english
                }
                coverImage {
                  extraLarge
                }
                episodes
                status
                seasonYear
              }
            }
          }
        }
      }
    `

    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: {
            userId: user?.id
          }
        })
      })

      const data = await response.json()
      
      if (data.data?.MediaListCollection?.lists?.length > 0) {
        return data.data.MediaListCollection.lists[0].entries || []
      }
      
      return []
    } catch (error) {
      console.error('Error fetching continue watching:', error)
      return []
    }
  }

  // Handle OAuth callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleCallback = () => {
        const hash = window.location.hash
        if (hash.includes('access_token')) {
          const token = hash.match(/access_token=([^&]*)/)?.[1]
          if (token) {
            fetchUser(token)
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        }
      }

      handleCallback()
    }
  }, [])

  return {
    user,
    token,
    isLoading,
    login,
    logout,
    updateProgress,
    getContinueWatching
  }
}
