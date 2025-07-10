import { useEffect, useState } from 'react'
import Link from 'next/link'
import { db } from '../lib/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

export default function Home() {
    const [popularMovies, setPopularMovies] = useState([])
    const [famousMovies, setFamousMovies] = useState([])
    const [comments, setComments] = useState([])

    useEffect(() => {
        async function fetchPopular() {
            const res = await fetch('https://api.themoviedb.org/3/movie/popular?language=ja-JP&page=1', {
                headers: {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`,
                    accept: 'application/json',
                },
            })
            const data = await res.json()
            setPopularMovies(data.results)
        }

        async function fetchFamous() {
            const ids = [1891, 11, 238, 155, 278, 122]
            const movies = await Promise.all(
                ids.map((id) =>
                    fetch(`https://api.themoviedb.org/3/movie/${id}?language=ja-JP`, {
                        headers: {
                            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_ACCESS_TOKEN}`,
                            accept: 'application/json',
                        },
                    }).then((res) => res.json())
                )
            )
            setFamousMovies(movies)
        }

        fetchPopular()
        fetchFamous()
    }, [])

    useEffect(() => {
        const q = query(collection(db, 'reviews'), orderBy('timestamp', 'desc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reviews = snapshot.docs.map((doc) => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                    top: Math.random() * window.innerHeight,
                    delay: Math.random() * 5,
                }
            })
            setComments(reviews)
        })

        return () => unsubscribe()
    }, [])

    return (
        <div className="relative p-6 bg-black min-h-screen text-white overflow-hidden">
            <h1 className="text-3xl font-bold mb-6">人気の映画</h1>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {popularMovies.map((movie) => (
                    <Link href={`/movie/${movie.id}`} key={movie.id}>
                        <div className="bg-gray-800 p-2 rounded cursor-pointer hover:bg-gray-700">
                            <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="rounded" />
                            <p className="mt-2">{movie.title}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <h2 className="text-2xl font-semibold mb-4">みんなが知ってる有名映画</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
                {famousMovies.map((movie) => (
                    <Link href={`/movie/${movie.id}`} key={movie.id}>
                        <div className="bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600">
                            <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} className="rounded" />
                            <p className="mt-2">{movie.title}</p>
                        </div>
                    </Link>
                ))}
            </div>

            {/* 弾幕コメント */}
            {comments.map((comment, index) => (
                <Link href={`/movie/${comment.movieId}`} key={`${comment.id}-${index}`}>
                    <div
                        className="absolute whitespace-nowrap text-lg font-bold text-white cursor-pointer"
                        style={{
                            top: `${comment.top}px`,
                            animationDelay: `${comment.delay}s`,
                            animationName: 'slide',
                            animationDuration: '15s',
                            animationTimingFunction: 'linear',
                            animationIterationCount: 'infinite',
                        }}
                    >
                        {'⭐'.repeat(comment.rating)} {comment.text}
                    </div>
                </Link>
            ))}

            <style jsx>{`
                @keyframes slide {
                    0% {
                        transform: translateX(100vw);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }
            `}</style>
        </div>
    )
}
