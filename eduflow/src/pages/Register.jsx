import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [role, setRole] = useState('learner')
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const { signUp } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const { error } = await signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role
                    }
                }
            })
            if (error) throw error
            navigate('/')
        } catch (err) {
            setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white w-full max-w-[550px] p-10 rounded-[20px] shadow-sm border border-gray-100">
                <h1 className="text-2xl font-bold text-[#1a73e8] text-center mb-10">
                    EduFlow Register
                </h1>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            ชื่อ-นามสกุล
                        </label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-[#1a73e8] transition-all outline-none text-gray-600"
                            placeholder="สมชาย ใจดี"
                        />
                    </div>

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

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            บทบาท
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:ring-2 focus:ring-[#1a73e8] transition-all outline-none text-gray-600 appearance-none bg-no-repeat bg-[right_1rem_center]"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundSize: '1.5em' }}
                        >
                            <option value="learner">นักเรียน/นักศึกษา</option>
                            <option value="creator">คุณครู/อาจารย์</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-[#1a73e8] text-white font-bold rounded-lg hover:bg-[#1557b0] transition-colors shadow-md disabled:opacity-50"
                    >
                        {loading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
                    </button>

                    <div className="text-center text-sm">
                        <p className="text-gray-600">
                            มีบัญชีแล้ว?{' '}
                            <Link to="/login" className="text-[#1a73e8] font-bold hover:underline">
                                เข้าสู่ระบบ
                            </Link>
                        </p>
                        <Link to="/" className="inline-block mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            ← กลับไปหน้าหลัก
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
