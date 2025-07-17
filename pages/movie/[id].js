// pages/movies/[id].js
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { db, auth } from '../../lib/firebase'
import {
    collection, addDoc, query, where, getDocs,
    orderBy, deleteDoc, doc, getDoc
} from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function MovieDetail() {
    const router = useRouter()
    const { id } = router.query
    const [movie, setMovie] = useState(null)
    const [watchProviders, setWatchProviders] = useState([])
    const [comment, setComment] = useState('')
    const [rating, setRating] = useState(5)
    const [comments, setComments] = useState([])
    const [user, setUser] = useState(null)

    const providerLinks = {
        "Netflix": "https://www.netflix.com/",
        "Disney Plus": "https://www.disneyplus.com/",
        "Amazon Prime Video": "https://www.amazon.co.jp/gp/video/storefront",
        "U-NEXT": "https://video.unext.jp/",
        "Hulu": "https://www.hulu.jp/",
        "Apple TV+": "https://tv.apple.com/",
        "dTV": "https://lemino.docomo.ne.jp/",
        "Rakuten TV": "https://tv.rakuten.co.jp/",
        "WOWOW": "https://www.wowow.co.jp/"
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDoc = await getDoc(doc(db, "users", currentUser.uid))
                const isAdmin = userDoc.exists() && userDoc.data().admin === true
                setUser({ ...currentUser, isAdmin })
            } else {
                setUser(null)
            }
        })
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        if (!id) return
        const fetchMovie = async () => {
            const res = await fetch(`https://api.themoviedb.org/3/movie/${id}?language=ja-JP`, {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`
                }
            })
            const data = await res.json()
            setMovie(data)

            const watchRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/watch/providers`, {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`
                }
            })
            const watchData = await watchRes.json()
            const jpProviders = (watchData.results?.JP?.flatrate || [])
                .filter(p => providerLinks[p.provider_name])
            setWatchProviders(jpProviders)
        }

        fetchMovie()
    }, [id])

    const saveReview = async () => {
        if (!user) return alert("ログインしてください")
        await addDoc(collection(db, "reviews"), {
            movieId: id,
            text: comment,
            rating,
            uid: user.uid,
            timestamp: new Date()
        })
    }

    const fetchReviews = async () => {
        const q = query(
            collection(db, "reviews"),
            where("movieId", "==", id),
            orderBy("timestamp", "desc")
        )
        const snapshot = await getDocs(q)
        const fetched = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        setComments(fetched)
    }

    useEffect(() => {
        if (id) fetchReviews()
    }, [id])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!comment.trim()) return
        await saveReview()
        setComment('')
        setRating(5)
        fetchReviews()
    }

    const handleDelete = async (reviewId) => {
        await deleteDoc(doc(db, "reviews", reviewId))
        fetchReviews()
    }

    if (!movie) return <div className="text-white p-6">読み込み中...</div>

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 space-y-6">
                    {/*<img*/}
                    {/*    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}*/}
                    {/*    alt={movie.title}*/}
                    {/*    className="rounded shadow-lg w-full"*/}
                    {/*/>*/}
                    <img
                        src="/noimage.png"
                        alt="No image"
                        className="rounded shadow-lg w-full"
                    />
                    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-700 p-4 rounded space-y-4">
                        <h2 className="text-xl font-semibold">レビューを書く</h2>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="映画の感想を入力"
                            className="w-full p-2 rounded bg-black border border-gray-600 text-white"
                        />
                        <div className="flex items-center gap-2">
                            <span>評価:</span>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setRating(num)}
                                    className="focus:outline-none"
                                >
                                <span
                                    className={`text-2xl ${
                                        num <= rating ? 'text-yellow-400' : 'text-gray-500'
                                    }`}
                                >
                                    ★
                                </span>
                                </button>
                            ))}
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                            送信する
                        </button>
                    </form>
                </div>

                <div className="md:w-2/3 space-y-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
                        <p className="text-gray-300">{movie.overview}</p>
                    </div>

                    {watchProviders.length > 0 && (
                        <div>
                            <h2 className="text-2xl font-semibold mb-2">配信中のサブスク</h2>
                            <div className="flex gap-4 flex-wrap">
                                {watchProviders.map((provider) => (
                                    <a
                                        key={provider.provider_id}
                                        href={providerLinks[provider.provider_name]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-gray-800 p-2 rounded hover:bg-gray-700"
                                    >
                                        <img
                                            src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                                            alt={provider.provider_name}
                                            className="w-6 h-6"
                                        />
                                        <span>{provider.provider_name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-2xl font-semibold mb-2">みんなのレビュー</h2>
                        {comments.length === 0 ? (
                            <p className="text-gray-500">まだレビューはありません。</p>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {comments.map((c) => (
                                    <div key={c.id} className="bg-gray-800 p-4 rounded shadow relative">
                                        <div className="text-yellow-400 text-lg mb-1">{'⭐'.repeat(c.rating)}</div>
                                        <p className="text-white">{c.text}</p>
                                        {(user?.uid === c.uid || user?.isAdmin) && (
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="absolute top-2 right-2 text-sm text-red-400 hover:text-red-200"
                                            >
                                                削除
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}