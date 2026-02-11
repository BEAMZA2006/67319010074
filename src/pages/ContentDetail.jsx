import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { User, MessageSquare, ArrowLeft, BookOpen, FileText, Sparkles } from 'lucide-react'

export default function ContentDetail() {
    const { id } = useParams()
    const { user } = useAuth()
    const [content, setContent] = useState(null)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) {
            fetchContent()
            fetchComments()
        }
    }, [id])

    const fetchContent = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('contents')
                .select(`
                    *,
                    profiles (full_name),
                    categories (name)
                `)
                .eq('id', id)
                .single()

            if (error) throw error
            setContent(data)
            if (user) recordViewHistory(data.id)
        } catch (error) {
            console.error('Error fetching content:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const recordViewHistory = async (contentId) => {
        try {
            await supabase.from('view_history').insert({
                user_id: user.id,
                content_id: contentId
            })
        } catch (error) {
            // Silently fail history recording
        }
    }

    const fetchComments = async () => {
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles (full_name)
                `)
                .eq('content_id', id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setComments(data || [])
        } catch (error) {
            console.error('Error fetching comments:', error.message)
        }
    }

    const handleCommentSubmit = async (e) => {
        e.preventDefault()
        if (!user) {
            alert('กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น')
            return
        }
        if (!newComment.trim()) return

        try {
            const { error } = await supabase
                .from('comments')
                .insert({
                    content_id: id,
                    user_id: user.id,
                    comment_text: newComment
                })

            if (error) throw error

            setNewComment('')
            fetchComments() // Refresh comments
        } catch (error) {
            alert('ไม่สามารถส่งความคิดเห็นได้: ' + error.message)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-500 font-medium">กำลังโหลดเนื้อหา...</p>
        </div>
    )

    if (!content) return (
        <div className="max-w-4xl mx-auto py-20 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบเนื้อหาที่คุณต้องการ</h2>
            <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-bold">กลับสู่หน้าหลัก</Link>
        </div>
    )

    return (
        <div className="max-w-[1400px] mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center text-gray-500 mb-6 hover:text-indigo-600 transition-colors font-medium">
                <ArrowLeft className="h-4 w-4 mr-1" />
                กลับสู่หน้าหลัก
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {/* Left side: Video Player */}
                <div className="lg:col-span-3">
                    <div className="bg-black rounded-xl shadow-lg overflow-hidden aspect-video relative group">
                        {content.type === 'video' ? (
                            content.url ? (
                                content.url.includes('youtube.com') || content.url.includes('youtu.be') ? (
                                    <iframe
                                        src={content.url.includes('watch?v=')
                                            ? `https://www.youtube.com/embed/${content.url.split('watch?v=')[1].split('&')[0]}`
                                            : `https://www.youtube.com/embed/${content.url.split('youtu.be/')[1].split('?')[0]}`
                                        }
                                        className="w-full h-full"
                                        allowFullScreen
                                        title={content.title}
                                    ></iframe>
                                ) : (
                                    <video
                                        controls
                                        className="w-full h-full"
                                        src={content.url}
                                        key={content.url}
                                        playsInline
                                    >
                                        เบราว์เซอร์ของคุณไม่รองรับการเล่นวิดีโอ
                                    </video>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center text-white p-10 h-full">
                                    <Video className="h-16 w-16 mb-4 text-gray-600" />
                                    <p className="text-xl font-bold">ไม่พบที่อยู่ของวิดีโอ</p>
                                </div>
                            )
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center bg-white p-12 text-center">
                                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-50 flex flex-col items-center justify-center p-20 max-w-xl w-full">
                                    <div className="h-32 w-32 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-10 border border-gray-100">
                                        {content.type === 'pdf' ? <BookOpen className="h-16 w-16 text-orange-500" /> : <FileText className="h-16 w-16 text-blue-500" />}
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900 mb-10">สื่อประเภท: <span className="text-indigo-600">{content.type.toUpperCase()}</span></p>
                                    <a
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#4147f1] text-white px-12 py-4 rounded-xl font-bold shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all text-lg"
                                    >
                                        เปิดดูสื่อ
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-2">{content.title}</h1>
                </div>

                {/* Right side: Sidebar (Author & Comments) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Author Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center space-x-4">
                        <div className="h-14 w-14 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            <User className="h-full w-full p-2 text-gray-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{content.profiles?.full_name || 'สิริวิชญ์ ทรัพย์มี'}</h3>
                            <div className="flex items-center text-blue-500 text-xs font-semibold">
                                <Sparkles className="h-3 w-3 mr-1 fill-current" />
                                Verified Teacher
                            </div>
                        </div>
                    </div>

                    {/* Comments Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-50">
                            <h3 className="font-bold text-gray-900">ความคิดเห็น</h3>
                        </div>

                        <div className="flex-grow p-4 space-y-4 max-h-[300px] overflow-y-auto">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex space-x-3">
                                    <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                                        {comment.profiles?.full_name?.[0] || 'U'}
                                    </div>
                                    <div className="bg-gray-50 px-3 py-2 rounded-lg text-sm flex-grow">
                                        <p className="font-bold text-gray-900 text-xs">{comment.profiles?.full_name || 'ผู้ใช้ทั่วไป'}</p>
                                        <p className="text-gray-700 mt-0.5">{comment.comment_text}</p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-center text-gray-400 text-sm py-4">ยังไม่มีความคิดเห็น</p>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50/50">
                            {user ? (
                                <div className="relative">
                                    <textarea
                                        className="w-full bg-white rounded-xl border-gray-100 shadow-sm focus:ring-2 focus:ring-indigo-500 p-3 pr-12 text-sm resize-none border"
                                        placeholder="เขียนความคิดเห็น..."
                                        rows="2"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <button
                                        onClick={handleCommentSubmit}
                                        className="absolute right-3 bottom-3 p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-sm"
                                    >
                                        <svg className="h-4 w-4 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <p className="text-xs text-center text-gray-500">กรุณาเข้าสู่ระบบเพื่อคอมเมนต์</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Description Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-1.5 bg-blue-500 text-white rounded shadow-sm">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">รายละเอียดเนื้อหา</h2>
                </div>
                <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {content.description || '-'}
                </div>
            </div>
        </div>
    )
}
