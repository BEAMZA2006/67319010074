import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const { error } = await signIn({ email, password })
            if (error) throw error
            navigate('/')
        } catch (err) {
            setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white w-full max-w-[500px] p-10 rounded-[20px] shadow-sm border border-gray-100">
                <h1 className="text-3xl font-bold text-[#1a73e8] text-center mb-10">
                    Login
                </h1>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            อีเมล
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-transparent bg-[#ebf2ff] focus:bg-white focus:ring-2 focus:ring-[#1a73e8] transition-all outline-none"
                            placeholder="67319010074@technicrayong.ac.th"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            รหัสผ่าน
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border-transparent bg-[#ebf2ff] focus:bg-white focus:ring-2 focus:ring-[#1a73e8] transition-all outline-none"
                            placeholder="*************"
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" size="sm" className="text-sm text-[#1a73e8] hover:underline">
                            ลืมรหัสผ่าน?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#1a73e8] text-white font-bold rounded-lg hover:bg-[#1557b0] transition-colors shadow-md disabled:opacity-50"
                    >
                        {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                    </button>

                    <div className="text-center mt-8 text-sm text-gray-600">
                        ยังไม่มีบัญชี?{' '}
                        <Link to="/register" className="text-[#1a73e8] font-bold hover:underline">
                            สมัครสมาชิกใหม่
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
