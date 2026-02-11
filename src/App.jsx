import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import UploadContent from './pages/UploadContent'
import MyContent from './pages/MyContent'
import ContentDetail from './pages/ContentDetail'
import EditContent from './pages/EditContent'
import Layout from './components/Layout'

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) return <div className="text-center p-10">Loading...</div>

    if (!user) {
        return <Navigate to="/login" />
    }

    return children
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/"
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Home />
                                </Layout>
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <Profile />
                                </Layout>
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/upload"
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <UploadContent />
                                </Layout>
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/my-content"
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <MyContent />
                                </Layout>
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/edit/:id"
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <EditContent />
                                </Layout>
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/content/:id"
                        element={
                            <PrivateRoute>
                                <Layout>
                                    <ContentDetail />
                                </Layout>
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App
