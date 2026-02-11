import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Search, BookOpen, Video, FileText, Mic, Sparkles, LayoutGrid } from 'lucide-react'

export default function Home() {
    const { user } = useAuth()
    const [contents, setContents] = useState([])
    const [recommended, setRecommended] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all')
    const [categories, setCategories] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('')

    useEffect(() => {
        fetchContents()
        fetchCategories()
        if (user) fetchRecommended()
    }, [user])

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name')
        if (data) setCategories(data)
    }

    const fetchRecommended = async () => {
        try {
            // ดึงประวัติการดู
            const { data: history } = await supabase
                .from('view_history')
                .select('content_id')
                .eq('user_id', user.id)
                .limit(5)

            let query = supabase
                .from('contents')
                .select('*, profiles(full_name), categories(name)')
                .eq('status', 'published')

            if (history && history.length > 0) {
                const viewedIds = history.map(h => h.content_id)
                query = query.not('id', 'in', `(${viewedIds.join(',')})`)
            }

            const { data } = await query.limit(3)
            setRecommended(data || [])
        } catch (error) {
            console.error('Error fetching recommendations:', error)
        }
    }

    const fetchContents = async () => {
        try {
            setLoading(true)
            let query = supabase
                .from('contents')
                .select(`
          *,
          profiles (full_name),
          categories (name),
          content_tags (tags (name))
        `)
                .eq('status', 'published')
                .order('created_at', { ascending: false })

            const { data, error } = await query

            if (error) throw error
            setContents(data || [])
        } catch (error) {
            console.error('Error fetching contents:', error.message)
        } finally {
            setLoading(false)
        }
    }

    const getIcon = (type) => {
        switch (type) {
            case 'video': return <Video className="h-6 w-6 text-red-500" />
            case 'pdf': return <BookOpen className="h-6 w-6 text-orange-500" />
            case 'article': return <FileText className="h-6 w-6 text-blue-500" />
            case 'audio': return <Mic className="h-6 w-6 text-purple-500" />
            default: return <FileText className="h-6 w-6 text-gray-500" />
        }
    }

    const filteredContents = contents.filter(content => {
        const searchLower = searchTerm.toLowerCase()
        const tags = content.content_tags?.map(ct => ct.tags?.name.toLowerCase()) || []

        const matchesSearch =
            content.title.toLowerCase().includes(searchLower) ||
            content.description?.toLowerCase().includes(searchLower) ||
            tags.some(t => t.includes(searchLower))

        const matchesType = filterType === 'all' || content.type === filterType
        const matchesCategory = selectedCategory === '' || content.category_id === selectedCategory

        return matchesSearch && matchesType && matchesCategory
    })

    return (
        <div className="space-y-12 pb-20">
            {/* Hero Section */}
            <div className="text-center py-16 px-4">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">คลังความรู้ดิจิทัลสำหรับคุณ</h1>
                <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">เข้าถึง E-books วิดีโอ และบทความคุณภาพได้ทุกที่ทุกเวลา</p>

                {/* Search Bar centered */}
                <div className="max-w-3xl mx-auto flex shadow-sm rounded-lg overflow-hidden border border-blue-200">
                    <input
                        type="text"
                        className="block w-full px-5 py-4 text-lg border-0 focus:ring-0 focus:outline-none placeholder:text-gray-400"
                        placeholder="ค้นหาบทเรียนที่สนใจ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="bg-blue-600 text-white px-8 py-4 font-bold flex items-center hover:bg-blue-700 transition-colors">
                        <Search className="h-5 w-5 mr-2" />
                        ค้นหา
                    </button>
                </div>
            </div>

            {/* Filter Section (Mini) - Hidden in screenshot but kept for functionality */}
            <div className="flex justify-center space-x-4 mb-8">
                <select
                    className="rounded-lg border-gray-200 shadow-sm text-sm p-2 border focus:ring-blue-500"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="">ทุกหมวดหมู่ (All Categories)</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>

                <select
                    className="rounded-lg border-gray-200 shadow-sm text-sm p-2 border focus:ring-blue-500"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">ทุกประเภทสื่อ (All Types)</option>
                    <option value="video">วิดีโอ (Video)</option>
                    <option value="pdf">E-book (PDF)</option>
                    <option value="article">บทความ (Article)</option>
                    <option value="audio">เสียง (Audio)</option>
                </select>
            </div>


            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                    <LayoutGrid className="h-6 w-6 mr-3 text-blue-600" />
                    บทเรียนล่าสุด
                </h2>

                {loading ? (
                    <div className="text-center py-10">กำลังโหลด...</div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredContents.map((content) => (
                            <Link key={content.id} to={`/content/${content.id}`} className="block group">
                                <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden h-full flex flex-col">
                                    <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative h-48">
                                        {content.thumbnail_url ? (
                                            <img
                                                src={content.thumbnail_url}
                                                alt={content.title}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                {getIcon(content.type)}
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                                            {getIcon(content.type)}
                                        </div>
                                    </div>
                                    <div className="p-4 flex-grow flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase leading-none">
                                                    {content.categories?.name || 'ทั่วไป'}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(content.created_at).toLocaleDateString('th-TH')}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 line-clamp-2 leading-tight">
                                                {content.title}
                                            </h3>
                                            <p className="mt-2 text-sm text-gray-500 line-clamp-2">
                                                {content.description}
                                            </p>
                                            {/* Tags */}
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {content.content_tags?.slice(0, 3).map((ct, idx) => (
                                                    <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                        #{ct.tags?.name}
                                                    </span>
                                                ))}
                                                {content.content_tags?.length > 3 && (
                                                    <span className="text-[10px] text-gray-400">+{content.content_tags.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center text-sm text-gray-500">
                                            <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold mr-2">
                                                {content.profiles?.full_name?.charAt(0) || 'U'}
                                            </div>
                                            <span className="truncate font-medium">
                                                {content.profiles?.full_name || 'ไม่ระบุชื่อ'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {filteredContents.length === 0 && (
                            <div className="col-span-full text-center py-20 flex flex-col items-center">
                                <div className="bg-gray-100 p-6 rounded-2xl mb-6">
                                    <LayoutGrid className="h-12 w-12 text-gray-400" />
                                </div>
                                <p className="text-xl text-gray-400 font-medium tracking-wide">
                                    ไม่พบข้อมูลสื่อการเรียนรู้...
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
