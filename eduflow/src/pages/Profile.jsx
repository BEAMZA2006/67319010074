import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [fullName, setFullName] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [role, setRole] = useState('learner')
    const [message, setMessage] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    useEffect(() => {
        getProfile()
    }, [user])

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setMessage('รหัสผ่านไม่ตรงกัน')
            return
        }
        try {
            setLoading(true)
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error
            setMessage('เปลี่ยนรหัสผ่านสำเร็จ!')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error) {
            setMessage('เกิดข้อผิดพลาด: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const getProfile = async () => {
        try {
            setLoading(true)
            const { data, error, status } = await supabase
                .from('profiles')
                .select(`full_name, avatar_url, role`)
                .eq('id', user.id)
                .single()

            if (error && status !== 406) {
                throw error
            }

            if (data) {
                setFullName(data.full_name)
                setAvatarUrl(data.avatar_url)
                setRole(data.role || 'learner')
            }
        } catch (error) {
            console.error('Error loading user data!', error.message)
        } finally {
            setLoading(false)
        }
    }

    const updateProfile = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const updates = {
                id: user.id,
                full_name: fullName,
                avatar_url: avatarUrl,
                role: role,
                updated_at: new Date(),
            }

            let { error } = await supabase.from('profiles').upsert(updates)

            if (error) {
                throw error
            }
            setMessage('บันทึกข้อมูลเรียบร้อยแล้ว')
            setTimeout(() => setMessage(''), 3000)
        } catch (error) {
            setMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูล')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">จัดการโปรไฟล์</h2>

                {message && (
                    <div className={`p-4 mb-4 rounded ${message.includes('ผิดพลาด') || message.includes('ไม่ตรงกัน') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={updateProfile} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                        <input type="text" value={user?.email} disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm sm:text-sm p-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">ชื่อ-นามสกุล</label>
                        <input type="text" value={fullName || ''} onChange={(e) => setFullName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Avatar URL</label>
                        <input type="text" value={avatarUrl || ''} onChange={(e) => setAvatarUrl(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">บทบาท (Role)</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                            <option value="learner">ผู้เรียน (Learner)</option>
                            <option value="creator">ผู้สร้างเนื้อหา (Content Creator)</option>
                        </select>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={loading} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50">
                            {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-8 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">เปลี่ยนรหัสผ่าน</h2>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                        <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                        <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={loading} className="inline-flex justify-center rounded-md border border-transparent bg-gray-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50">
                            {loading ? 'กำลังดำเนินการ...' : 'เปลี่ยนรหัสผ่าน'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
