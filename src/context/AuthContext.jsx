import { createContext, useContext, useState, useCallback } from 'react'
import { mockStudentUser, mockTeacherUser, mockAdminUser } from '@/data/mockData'

const AuthContext = createContext(null)

const mockUsers = {
  student: mockStudentUser,
  teacher: mockTeacherUser,
  admin: mockAdminUser,
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const login = useCallback((role) => {
    setUser(mockUsers[role] || null)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
