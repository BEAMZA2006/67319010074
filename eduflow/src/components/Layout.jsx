import Navbar from './Navbar'

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <footer className="py-10 border-t border-gray-100 bg-white">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm text-gray-400">© 2026 EduFlow Platform - Learning for Everyone</p>
                </div>
            </footer>
        </div>
    )
}
