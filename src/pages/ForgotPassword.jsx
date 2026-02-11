import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e) => {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <div className="flex min-h-full flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                    กู้คืนรหัสผ่าน
                </h2>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
                    {!submitted ? (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <p className="text-sm text-gray-600">
                                ระบุอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    อีเมล
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                ส่งคำขอกู้คืนรหัสผ่าน
                            </button>
                        </form>
                    ) : (
                        <div className="text-center py-4">
                            <h3 className="text-lg font-medium text-gray-900">ตรวจสอบอีเมลของคุณ</h3>
                            <p className="mt-2 text-sm text-gray-600">
                                เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยัง {email} เรียบร้อยแล้ว
                            </p>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            กลับไปยังหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
