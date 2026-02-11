import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Edit, Trash2, Eye } from 'lucide-react'

export default function MyContent() {
    const { user } = useAuth()
    const [contents, setContents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchMyContent()
    }, [user])

    const fetchMyContent = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('contents')
                .select('*')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setContents(data || [])
        } catch (error) {
            console.error('Error fetching content:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบสื่อนี้?')) return

        try {
            const { error } = await supabase
                .from('contents')
                .delete()
                .eq('id', id)

            if (error) throw error
            setContents(contents.filter(content => content.id !== id))
        } catch (error) {
            alert('เกิดข้อผิดพลาดในการลบ: ' + error.message)
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">สื่อของฉัน</h2>
                <Link to="/upload" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    + เพิ่มสื่อใหม่
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10">กำลังโหลด...</div>
            ) : contents.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <p className="text-gray-500 mb-4">คุณยังไม่มีสื่อที่อัปโหลด</p>
                    <Link to="/upload" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        เริ่มสร้างสื่อการเรียนรู้ของคุณเลย!
                    </Link>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {contents.map((content) => (
                            <li key={content.id}>
                                <div className="px-4 py-4 flex items-center sm:px-6">
                                    <div className="flex-shrink-0 h-16 w-24 bg-gray-100 rounded-lg overflow-hidden mr-4 border border-gray-100 shadow-sm">
                                        {content.thumbnail_url ? (
                                            <img src={content.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <Eye className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="truncate">
                                            <div className="flex text-sm items-center">
                                                <p className="font-bold text-indigo-600 truncate text-lg">{content.title}</p>
                                                <span className={`ml-3 px-2 py-0.5 rounded-full text-xs font-semibold ${content.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {content.status === 'published' ? 'เผยแพร่แล้ว' : 'ฉบับร่าง'}
                                                </span>
                                            </div>
                                            <div className="mt-1 flex">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <span className="capitalize bg-gray-50 px-2 py-0.5 rounded mr-2 text-[10px] border border-gray-100">{content.type}</span>
                                                    <p className="truncate text-xs">{content.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex items-center space-x-3">
                                        <Link
                                            to={`/content/${content.id}`}
                                            className="text-gray-400 hover:text-indigo-600 transition-colors"
                                            title="ดูรายละเอียด"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </Link>
                                        <Link
                                            to={`/edit/${content.id}`}
                                            className="text-gray-400 hover:text-yellow-600 transition-colors"
                                            title="แก้ไข"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(content.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="ลบ"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
