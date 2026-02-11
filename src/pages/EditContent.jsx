import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Edit3, Tag as TagIcon, Save, ArrowLeft } from 'lucide-react'

export default function EditContent() {
    const { id } = useParams()
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [categories, setCategories] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'video',
        url: '',
        thumbnail_url: '',
        category_id: '',
        status: 'draft',
        tags: ''
    })

    useEffect(() => {
        if (id) {
            fetchCategories()
            fetchContentData()
        }
    }, [id])

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name')
        if (data) setCategories(data)
    }

    const fetchContentData = async () => {
        try {
            setLoading(true)
            // 1. ดึงข้อมูลสื่อ
            const { data, error } = await supabase
                .from('contents')
                .select(`*, content_tags(tags(name))`)
                .eq('id', id)
                .single()

            if (error) throw error

            // ตรวจสอบว่าเป็นเจ้าของหรือไม่ (RSL ควรจะกันไว้แล้วแต่เช็คเพื่อความชัวร์)
            if (data.creator_id !== user.id) {
                alert('คุณไม่มีสิทธิ์แก้ไขสื่อนี้')
                navigate('/my-content')
                return
            }

            // 2. แปลง Tags จาก array of objects เป็น string
            const tagString = data.content_tags ? data.content_tags.map(ct => ct.tags.name).join(', ') : ''

            setFormData({
                title: data.title,
                description: data.description || '',
                type: data.type,
                url: data.url || '',
                thumbnail_url: data.thumbnail_url || '',
                category_id: data.category_id || '',
                status: data.status,
                tags: tagString
            })
        } catch (error) {
            alert('ไม่สามารถดึงข้อมูลได้: ' + error.message)
            navigate('/my-content')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)

        try {
            // 1. อัปเดตข้อมูลหลัก
            const { error: updateError } = await supabase
                .from('contents')
                .update({
                    title: formData.title,
                    description: formData.description,
                    type: formData.type,
                    url: formData.url,
                    thumbnail_url: formData.thumbnail_url,
                    category_id: formData.category_id || null,
                    status: formData.status,
                    updated_at: new Date()
                })
                .eq('id', id)

            if (updateError) throw updateError

            // 2. แก้ไข Tags (ลบของเก่าแล้วเพิ่มใหม่ - วิธีที่ง่ายที่สุดสำหรับ MVP)
            await supabase.from('content_tags').delete().eq('content_id', id)

            if (formData.tags.trim()) {
                const tagNames = formData.tags.split(',').map(t => t.trim()).filter(t => t !== '')
                for (const tagName of tagNames) {
                    let { data: tagData } = await supabase.from('tags').select('id').eq('name', tagName).single()
                    if (!tagData) {
                        const { data: newTag } = await supabase.from('tags').insert({ name: tagName }).select().single()
                        tagData = newTag
                    }
                    if (tagData) {
                        await supabase.from('content_tags').insert({
                            content_id: id,
                            tag_id: tagData.id
                        })
                    }
                }
            }

            alert('แก้ไขข้อมูลเรียบร้อยแล้ว!')
            navigate('/my-content')
        } catch (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="text-center py-20">กำลังโหลดข้อมูล...</div>

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-1" /> ย้อนกลับ
            </button>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-3xl font-bold mb-8 text-gray-900 flex items-center">
                    <Edit3 className="mr-3 text-indigo-600" /> แก้ไขข้อมูลสื่อการเรียนรู้
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">ชื่อเรื่อง *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">คำอธิบาย</label>
                            <textarea
                                name="description"
                                rows="4"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">ประเภท *</label>
                                <select
                                    name="type"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                                    value={formData.type}
                                    onChange={handleChange}
                                >
                                    <option value="video">วิดีโอ (Video)</option>
                                    <option value="pdf">E-book (PDF)</option>
                                    <option value="article">บทความ (Article)</option>
                                    <option value="audio">เสียง (Audio)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">หมวดหมู่</label>
                                <select
                                    name="category_id"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                >
                                    <option value="">เลือกหมวดหมู่...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">แท็ก (Tags)</label>
                            <div className="relative">
                                <TagIcon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    name="tags"
                                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 pl-10 border"
                                    placeholder="เช่น react, javascript"
                                    value={formData.tags}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">URL ของสื่อ *</label>
                            <input
                                type="url"
                                name="url"
                                required
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                                value={formData.url}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">URL รูปปก (Thumbnail)</label>
                            <input
                                type="url"
                                name="thumbnail_url"
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-3 border"
                                value={formData.thumbnail_url}
                                onChange={handleChange}
                            />
                            {formData.thumbnail_url && (
                                <div className="mt-4 border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white">
                                    <img
                                        src={formData.thumbnail_url}
                                        alt="Preview"
                                        className="w-full aspect-video object-cover rounded shadow-sm"
                                        onError={(e) => e.target.src = 'https://placehold.co/600x400?text=Invalid+Image+URL'}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">สถานะการเผยแพร่ *</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="status" value="draft" checked={formData.status === 'draft'} onChange={handleChange} />
                                    <span className="text-sm font-medium">ฉบับร่าง</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="status" value="published" checked={formData.status === 'published'} onChange={handleChange} />
                                    <span className="text-sm font-medium">เผยแพร่</span>
                                </label>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                <Save className="h-5 w-5 mr-2" />
                                {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
