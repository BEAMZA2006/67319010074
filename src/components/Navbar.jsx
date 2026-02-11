import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { Menu, X, User, LogOut, Book } from 'lucide-react'

export default function Navbar() {
    const { user, signOut } = useAuth()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)

    const handleLogout = async () => {
        await signOut()
        navigate('/register')
    }

    return (
        <nav className="bg-white shadow">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <div className="flex flex-shrink-0 items-center">
                            <Link to="/" className="flex items-center space-x-2">
                                <Book className="h-6 w-6 text-indigo-600" />
                                <span className="text-xl font-bold text-gray-900">EduFlow</span>
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-indigo-500">
                                หน้าหลัก
                            </Link>
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {user ? (
                            <div className="relative ml-3 flex items-center space-x-6">
                                <Link to="/upload" className="bg-[#10b981] text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-green-700 transition-colors">
                                    อัปโหลด
                                </Link>
                                <Link to="/my-content" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
                                    สื่อของฉัน
                                </Link>
                                <div className="flex items-center text-sm font-medium text-gray-700">
                                    <User className="h-5 w-5 mr-2 text-gray-400" />
                                    <span>{user.email}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-indigo-600 transition-colors">
                                    เข้าสู่ระบบ
                                </Link>
                                <Link to="/register" className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm">
                                    สมัครสมาชิก
                                </Link>
                            </div>
                        )}
                    </div>
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isOpen && (
                <div className="sm:hidden">
                    <div className="space-y-1 pb-3 pt-2">
                        <Link to="/" className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pl-3 pr-4 text-base font-medium text-indigo-700">หน้าหลัก</Link>
                    </div>
                    <div className="border-t border-gray-200 pb-3 pt-4">
                        <div className="space-y-1">
                            <div className="flex items-center px-4 mb-4">
                                <div className="flex-shrink-0">
                                    <User className="h-10 w-10 rounded-full bg-gray-100 p-2 text-gray-400" />
                                </div>
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">{user?.email}</div>
                                </div>
                            </div>
                            <Link to="/upload" className="block px-4 py-2 text-base font-medium text-green-600 hover:bg-gray-100">อัปโหลดสื่อ</Link>
                            <Link to="/my-content" className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100">สื่อของฉัน</Link>
                            <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-base font-medium text-red-500 hover:bg-gray-100">ออกจากระบบ</button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
}
