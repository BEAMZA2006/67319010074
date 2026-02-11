import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Camera, Video, FileText, Music, Tag as TagIcon, UploadCloud, LayoutGrid, Globe, Lock, ChevronDown } from 'lucide-react'

export default function UploadContent() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [categories, setCategories] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'video',
        url: '',
        thumbnail_url: '',
        category_id: '',
        file: null
    })

    useEffect(() => {
        fetchCategories()
    }, [])

    // Real-time YouTube & Video File Thumbnail Generator
    useEffect(() => {
        const url = formData.url;
        if (url && (url.includes('youtube.com') || url.includes('youtu.be')) && !formData.thumbnail_url) {
            try {
                let videoId = '';
                if (url.includes('watch?v=')) {
                    videoId = url.split('watch?v=')[1].split('&')[0];
                } else if (url.includes('youtu.be/')) {
                    videoId = url.split('youtu.be/')[1].split('?')[0];
                }

                if (videoId) {
                    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    setFormData(prev => ({ ...prev, thumbnail_url: thumbUrl }));
                }
            } catch (e) {
                console.error("Failed to parse YouTube URL", e);
            }
        }
    }, [formData.url])

    // Auto-generate thumbnail when video file is selected
    useEffect(() => {
        const handleFileThumbnail = async () => {
            if (formData.file && formData.file.type.startsWith('video/') && !formData.thumbnail_url) {
                const thumb = await generateVideoThumbnail(formData.file);
                if (thumb) {
                    setFormData(prev => ({ ...prev, thumbnail_url: thumb }));
                }
            }
        };
        handleFileThumbnail();
    }, [formData.file])

    const fetchCategories = async () => {
        const { data, error } = await supabase.from('categories').select('*').order('name')
        if (data) setCategories(data)
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const generateVideoThumbnail = (file) => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;

            const timeout = setTimeout(() => {
                cleanup();
                resolve(null);
            }, 5000);

            const cleanup = () => {
                clearTimeout(timeout);
                URL.revokeObjectURL(video.src);
            };

            video.onloadedmetadata = () => {
                video.currentTime = 0.5; // ดรอปไปที่ 0.5 วินาที
            };

            video.onseeked = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const scale = 480 / video.videoWidth;
                    canvas.width = 480;
                    canvas.height = video.videoHeight * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    cleanup();
                    resolve(dataUrl);
                } catch (err) {
                    cleanup();
                    resolve(null);
                }
            };

            video.onerror = () => {
                cleanup();
                resolve(null);
            };
            video.src = URL.createObjectURL(file);
        });
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            let finalThumbnailUrl = formData.thumbnail_url
            let finalUrl = formData.url

            // Auto-generate YouTube thumbnail if not provided
            if (finalUrl && (finalUrl.includes('youtube.com') || finalUrl.includes('youtu.be')) && !finalThumbnailUrl) {
                const videoId = finalUrl.includes('watch?v=')
                    ? finalUrl.split('watch?v=')[1].split('&')[0]
                    : finalUrl.split('youtu.be/')[1].split('?')[0];
                finalThumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            }

            // ในโหมด Demo: จัดการไฟล์ให้ออกมาเป็น Base64
            if (formData.file) {
                if (formData.file.type.startsWith('image/')) {
                    const base64 = await fileToBase64(formData.file);
                    if (!finalThumbnailUrl) finalThumbnailUrl = base64;
                    if (formData.type === 'image') finalUrl = base64;
                } else if (formData.file.type.startsWith('video/')) {
                    // ใช้ Object URL เพื่อความรวดเร็วและแก้ปัญหา Storage เต็ม
                    // หมายเหตุ: วิธีนี้วิดีโอจะเล่นได้เฉพาะใน Session ปัจจุบัน (Demo Mode)
                    const objectUrl = URL.createObjectURL(formData.file);
                    if (formData.type === 'video') finalUrl = objectUrl;

                    // หากยังไม่มีรูปปก ให้ลองสร้างจากวินาทีแรก
                    if (!finalThumbnailUrl) {
                        finalThumbnailUrl = await generateVideoThumbnail(formData.file);
                    }
                }
            }

            // 1. บันทึกข้อมูลสื่อหลัก
            const { data: contentData, error: contentError } = await supabase.from('contents').insert({
                title: formData.title,
                description: formData.description,
                type: formData.type,
                url: finalUrl || finalThumbnailUrl,
                thumbnail_url: finalThumbnailUrl || 'https://placehold.co/600x400?text=No+Preview',
                creator_id: user.id,
                category_id: formData.category_id || null,
                status: 'published'
            }).select().single()

            if (contentError) throw contentError

            // 2. จัดการไฟล์ (ถ้ามี)
            if (formData.file) {
                console.log('Uploading file:', formData.file.name)
            }

            alert('อัปโหลดสื่อเรียบร้อยแล้ว!')
            navigate('/')
        } catch (error) {
            alert('เกิดข้อผิดพลาด: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="bg-white p-10 rounded-2xl shadow-xl shadow-gray-100 border border-gray-100">
                <div className="flex items-center justify-between mb-10 border-b border-gray-50 pb-6">
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                        <div className="p-2 bg-indigo-50 rounded-lg mr-4">
                            <UploadCloud className="h-8 w-8 text-indigo-600" />
                        </div>
                        อัปโหลดสื่อการเรียนรู้ใหม่
                    </h2>
                    <p className="text-sm text-gray-400 font-medium">แบ่งปันความรู้ของคุณสู่สังคม</p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Media Info */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">ชื่อเรื่อง (Title) *</label>
                            <input
                                type="text"
                                name="title"
                                required
                                className="w-full rounded-xl border-0 bg-gray-50/80 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 p-4 transition-all"
                                placeholder="ใส่ชื่อสื่อการเรียนรู้ของคุณ..."
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">คำอธิบาย (Description)</label>
                            <textarea
                                name="description"
                                rows="5"
                                className="w-full rounded-xl border-0 bg-gray-50/80 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 p-4 transition-all"
                                placeholder="อธิบายรายละเอียดของเนื้อหา เช่น วิธีการเรียนรู้ หรือจุดเด่นของสื่อนี้..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">ลิงก์วิดีโอ หรือ ลิงก์สื่อ (URL)</label>
                            <input
                                type="url"
                                name="url"
                                className="w-full rounded-xl border-0 bg-gray-50/80 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 p-4 transition-all"
                                placeholder="https://www.youtube.com/watch?v=... หรือลิงก์ไฟล์วิดีโอ"
                                value={formData.url}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">ประเภทสื่อ *</label>
                                <div className="relative">
                                    <select
                                        name="type"
                                        className="w-full rounded-xl border-0 bg-gray-50/80 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 p-4 appearance-none transition-all cursor-pointer"
                                        value={formData.type}
                                        onChange={handleChange}
                                    >
                                        <option value="video">วิดีโอ (Video)</option>
                                        <option value="image">ภาพ (Picture)</option>
                                        <option value="pdf">E-book (PDF)</option>
                                        <option value="article">บทความ (Article)</option>
                                        <option value="audio">เสียง (Audio)</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronDown className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">หมวดหมู่</label>
                                <div className="relative">
                                    <select
                                        name="category_id"
                                        className="w-full rounded-xl border-0 bg-gray-50/80 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 p-4 appearance-none transition-all cursor-pointer"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">เลือกหมวดหมู่...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <LayoutGrid className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Upload & Preview */}
                    <div className="space-y-6 bg-blue-50/30 p-8 rounded-2xl border border-blue-50">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">อัปโหลดไฟล์สมาชิก (Upload File)</label>
                            <div className="relative">
                                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-200 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-gray-50 transition-all shadow-sm">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <UploadCloud className="w-10 h-10 mb-3 text-indigo-400" />
                                        <p className="text-sm text-gray-500">
                                            {formData.file ? (
                                                <span className="text-indigo-600 font-bold">{formData.file.name}</span>
                                            ) : (
                                                <span>คลิกหรือลากไฟล์มาวางที่นี่</span>
                                            )}
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    />
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">URL รูปปก (Thumbnail)</label>
                            <input
                                type="url"
                                name="thumbnail_url"
                                placeholder="https://image-url.com/..."
                                className="w-full rounded-xl border-0 bg-white text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 p-4 shadow-sm"
                                value={formData.thumbnail_url}
                                onChange={handleChange}
                            />
                            {formData.thumbnail_url && (
                                <div className="mt-6">
                                    <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">ตัวอย่างหน้าปก (Preview)</p>
                                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg ring-4 ring-white">
                                        <img
                                            src={formData.thumbnail_url}
                                            alt="Thumbnail Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => e.target.src = 'https://placehold.co/600x400?text=Invalid+Image+URL'}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-5 px-6 border border-transparent rounded-2xl shadow-xl shadow-indigo-100 text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all transform hover:-translate-y-1"
                            >
                                <UploadCloud className="h-6 w-6 mr-2" />
                                {loading ? 'กำลังบันทึกข้อมูล...' : 'อัปโหลดสื่อการเรียนรู้'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
