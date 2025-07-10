import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { auth } from '../lib/firebase'
import { signOut } from 'firebase/auth'

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [search, setSearch] = useState('')
    const router = useRouter()

    const handleSearch = (e) => {
        e.preventDefault()
        if (!search.trim()) return
        router.push(`/search?query=${encodeURIComponent(search)}`)
    }

    return (
        <div className="min-h-screen bg-black text-white">
            {/* ヘッダー */}
            <header className="flex justify-between items-center p-4 bg-gray-900 border-b border-gray-700">
                {/* 三本線メニュー */}
                <button onClick={() => setSidebarOpen(true)} className="text-white text-2xl mr-4">
                    &#9776;
                </button>

                {/* 検索バーを右側に寄せるために ml-auto を追加 */}
                <form onSubmit={handleSearch} className="ml-auto">
                    <input
                        type="text"
                        placeholder="タイトル検索 🔍"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64 p-2 rounded bg-gray-800 text-white border border-gray-600"
                    />
                </form>
            </header>

            {/* スライドメニュー */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-gray-800 transform ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } transition-transform duration-300 ease-in-out z-40 flex flex-col`}
            >
                {/* ✕ 閉じるボタン */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-white text-2xl absolute top-4 right-4"
                >
                    ✕
                </button>

                {/* メニュー本体 */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto mt-12">
                    <h2 className="text-xl font-bold">メニュー</h2>
                    <Link href="/" className="block hover:text-blue-400">ホーム</Link>
                    <Link href="/admin/reviews" className="block hover:text-blue-400">管理者レビュー一覧</Link>
                    <Link href="/profile" className="block hover:text-blue-400">マイページ</Link>
                    <Link href="/settings" className="block hover:text-blue-400">設定</Link>
                    <hr className="border-gray-600" />
                    <div className="text-sm text-gray-400">※ フィルターや絞り込み機能は今後追加予定</div>
                </div>

                {/* 下部ログアウトボタン */}
                <div className="p-4 border-t border-gray-700">
                    <button
                        onClick={() => signOut(auth)}
                        className="w-full text-left text-red-400 hover:text-red-200"
                    >
                        ログアウト
                    </button>
                </div>
            </aside>

            {/* メイン内容 */}
            <main className="pt-4 px-4 md:px-6">{children}</main>
        </div>
    )
}
