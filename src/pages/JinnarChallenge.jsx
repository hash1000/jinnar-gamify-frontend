import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import challengeData from '../data/jinnarChallenge';
import { faqData } from '../data/FAQ';
import viralService from '../services/viralService';
import { useCurrency } from '../contexts/CurrencyContext';

// Truncates long text and reveals the rest on click
const ReadMore = ({ text, limit = 120, className = '' }) => {
    const [expanded, setExpanded] = useState(false);

    if (!text) return null;

    const isLong = text.length > limit;
    const displayText = expanded || !isLong ? text : `${text.slice(0, limit).trimEnd()}…`;

    return (
        <span className={className}>
            {displayText}
            {isLong && (
                <button
                    type="button"
                    onClick={() => setExpanded((prev) => !prev)}
                    className="ml-1 text-blue-600 hover:text-blue-800 font-semibold text-sm whitespace-nowrap"
                >
                    {expanded ? 'Show less' : 'Read more'}
                </button>
            )}
        </span>
    );
};

const JinnarChallenge = () => {
    // State for dynamic data
    const { format } = useCurrency();
    const [activeDraw, setActiveDraw] = useState(null);
    const [leaderboardPreview, setLeaderboardPreview] = useState([]);
    const [loadingDraw, setLoadingDraw] = useState(true);
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

    // Fetch Active Draw
    useEffect(() => {
        const fetchActiveDraw = async () => {
            try {
                const response = await viralService.getActiveDraws();
                if (response.success && response.data.length > 0) {
                    // Get the first active draw (most relevant one)
                    const draw = response.data[0];
                    setActiveDraw(draw);

                    // Once we have a draw, fetch its top 3 leaders for preview
                    fetchLeaderboardPreview(draw._id);
                }
            } catch (error) {
                console.error('Error fetching active draw:', error);
            } finally {
                setLoadingDraw(false);
            }
        };

        fetchActiveDraw();
    }, []);

    // Fetch Leaderboard Preview for the specific draw
    const fetchLeaderboardPreview = async (drawId) => {
        setLoadingLeaderboard(true);
        try {
            // scope='global', limit=3
            const response = await viralService.getLeaderboard(drawId, 'global', 3);
            if (response.success) {
                setLeaderboardPreview(response.data);
            }
        } catch (error) {
            console.error('Error fetching leaderboard preview:', error);
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    return (
        <div className="min-h-screen bg-white">

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-12">

                {/* Hero Section */}
                <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            How the Jinnar Viral Challenge Works
                        </h1>
                        <p className="text-gray-700 mb-6">
                            Create content. Get approved. Go <span className="text-blue-600 font-semibold">viral</span>. Earn points. Win <span className="text-blue-600 font-semibold">rewards</span>.
                        </p>
                        <div className="flex gap-3">
                            <Link to="/upload">
                                <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2.5 px-6 rounded-md transition-colors">
                                    {activeDraw ? 'Join Active Challenge' : 'Join Challenge'}
                                </button>
                            </Link>
                            <Link to="/upload">
                                <button className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 px-6 rounded-md transition-colors flex items-center gap-2">
                                    Upload Video for Approval
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </Link>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl h-72 flex items-center justify-center">
                        <span className="text-6xl">🚀</span>
                    </div>
                </div>

                {/* It's Simple - Just 4 Steps */}
                <h2 className="text-3xl font-bold text-gray-900 mb-12">
                    It's Simple — Just 4 Steps
                </h2>

                <div className="grid md:grid-cols-2 gap-6 mb-16 items-stretch">

                    {/* Step 1: Join an Active Draw */}
                    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-800 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                                1
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {activeDraw ? `Join ${activeDraw.title}` : 'Join an Active Draw'}
                            </h3>
                        </div>

                        <p className="text-gray-700 mb-4 text-sm">
                            Jinnar runs numbered challenge rounds called <span className="font-semibold">Draws</span>.
                        </p>

                        {activeDraw ? (
                            <div className="bg-gray-50 rounded-lg border border-gray-100 p-4 mb-4 space-y-3 flex-1">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Current Theme</p>
                                    <p className="text-sm font-semibold text-blue-800">
                                        <ReadMore text={activeDraw.theme} limit={60} />
                                    </p>
                                </div>

                                {activeDraw?.hashtags?.length > 0 && (
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Hashtags</p>
                                        <p className="text-sm text-gray-800 break-words">
                                            <ReadMore text={activeDraw.hashtags.join(' ')} limit={60} />
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Deadline</p>
                                        <p className="text-sm font-medium text-gray-900">{new Date(activeDraw.endDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Prize Pool</p>
                                        <p className="text-sm font-bold text-green-600">{format(activeDraw.prizePool || 10000)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 mb-4">
                                <p className="text-gray-700 text-sm">Each Draw has a focus topic, official hashtags, deadlines, and a prize pool.</p>
                            </div>
                        )}

                        <Link to="/upload" className="mt-auto">
                            <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-5 rounded-md transition-colors flex items-center gap-2">
                                {loadingDraw ? 'Loading Draw...' : 'Join Now'}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </Link>
                    </div>

                    {/* Step 2: Upload Your Video for Approval */}
                    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-800 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                                2
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Upload Your Video for Approval</h3>
                        </div>

                        <p className="text-gray-700 mb-4 text-sm">
                            <ReadMore
                                text="Before posting publicly, upload your video to Jinnar Viral for review. This ensures content quality, safety, and brand alignment."
                                limit={110}
                            />
                        </p>

                        <div className="mb-4 flex-1">
                            <p className="font-semibold text-gray-900 mb-2 text-sm">Review Process:</p>
                            <ul className="space-y-1 ml-4 text-sm">
                                <li className="text-gray-700">• AI + human review</li>
                                <li className="text-gray-700">• Clear feedback if edits are needed</li>
                                <li className="text-gray-700">• Fast approval turnaround</li>
                            </ul>
                        </div>

                        <div className="flex gap-2 flex-wrap mt-auto">
                            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                <span className="text-yellow-600">⚠</span> Pending Review
                            </span>
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                <span className="text-green-600">✓</span> Approved
                            </span>
                            <span className="bg-red-100 text-red-800 px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                                <span className="text-red-600">●</span> Needs Revision
                            </span>
                        </div>
                    </div>

                    {/* Step 3: Post & Earn Points */}
                    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-800 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                                3
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Post & Earn Points</h3>
                        </div>

                        <p className="text-gray-700 mb-4 text-sm">
                            Once approved, publish your video on supported platforms and share your post link or screenshot.
                        </p>

                        <div className="mb-4 flex-1">
                            <p className="font-semibold text-gray-900 mb-3 text-sm">Supported Platforms:</p>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700 text-sm">TikTok | Instagram</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-gray-700 text-sm">Facebook | YouTube</span>
                                </div>
                            </div>
                        </div>

                        <Link to="/submit-link" className="mt-auto">
                            <button className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2 px-5 rounded-md transition-colors text-sm flex items-center gap-2">
                                Submit Post Link / Proof
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </Link>
                    </div>

                    {/* Step 4: Compete Within Each Draw */}
                    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-800 text-white rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                                4
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Compete Within This Draw</h3>
                        </div>

                        {/* Leaderboard Preview */}
                        <div className="bg-gray-900 text-white rounded-xl p-5 mb-4 flex-1">
                            <div className="flex justify-between items-start gap-2 mb-4">
                                <h4 className="text-sm font-bold">
                                    <ReadMore
                                        text={activeDraw ? `Leaders: ${activeDraw.title}` : 'Leaderboard Preview'}
                                        limit={40}
                                        className="text-white"
                                    />
                                </h4>
                                <Link to="/leaderboards" className="text-xs text-blue-400 hover:text-blue-300 whitespace-nowrap flex-shrink-0">
                                    View Full Leaderboard →
                                </Link>
                            </div>

                            <div className="space-y-3">
                                <div className="grid grid-cols-4 gap-3 text-xs text-gray-400 pb-2 border-b border-gray-700">
                                    <div>Rank</div>
                                    <div className="col-span-2">Name</div>
                                    <div className="text-right">Points</div>
                                </div>

                                {loadingLeaderboard ? (
                                    <div className="text-center py-4 text-gray-500 text-sm">Loading current leaders...</div>
                                ) : leaderboardPreview.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 text-sm">
                                        No entries yet. Be the first!
                                    </div>
                                ) : (
                                    leaderboardPreview.map((entry, index) => (
                                        <div key={index} className="grid grid-cols-4 gap-3 items-center text-sm">
                                            <div className="text-blue-400 font-bold"># {entry.rank || index + 1}</div>
                                            <div className="col-span-2 flex items-center gap-2 min-w-0">
                                                <span className="truncate">{entry.name || 'Anonymous user'}</span>
                                                {/* Flag placeholder - api might not return country code yet */}
                                                <span className="text-xs text-gray-500 flex-shrink-0">{entry.country || '🌐'}</span>
                                            </div>
                                            <div className="text-right font-bold">{entry.totalPoints?.toLocaleString()}</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-700">
                                <p className="text-xs text-gray-400">
                                    <span className="font-semibold">Get Points:</span> Likes, views, shares + content quality.
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-gray-600 mt-auto">
                            <span className="inline-block mr-1">✓</span>
                            Points are verified using platform APIs and AI validation tools.
                        </p>
                    </div>
                </div>

                {/* How Winners Are Selected */}
                <div className="mb-16">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">How Winners Are Selected</h3>

                    <p className="text-lg font-semibold text-blue-800 mb-4">Your Content, Jinnar's Promotion</p>

                    <p className="text-gray-700 mb-6 max-w-2xl">
                        By participating, you earn Jinnar permission to feature approved videos in marketing.
                    </p>

                    <ul className="space-y-2 mb-6 ml-4 max-w-xl">
                        <li className="text-gray-700">• Cash prize pool of {activeDraw?.prizePool ? format(activeDraw.prizePool) : format(10000) + '+'}</li>
                        <li className="text-gray-700">• Official Jinnar merchandise</li>
                        <li className="text-gray-700">• Public recognition on our socials</li>
                    </ul>

                    <Link to="/winners">
                        <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2.5 px-6 rounded-md transition-colors flex items-center gap-2">
                            View Prizes & Rewards
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </Link>
                </div>

                {/* Ready to Join the Next Draw */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 mb-12">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🎯</span>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Ready to Join {activeDraw ? activeDraw.title : 'the Next Draw'}?
                        </h2>
                    </div>
                    <p className="text-gray-700 mb-6">Create. Share. Compete. Win.</p>
                    <div className="flex gap-3">
                        <Link to="/upload">
                            <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2.5 px-6 rounded-md transition-colors">
                                Join Active Draw
                            </button>
                        </Link>
                        <Link to="/upload">
                            <button className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 px-6 rounded-md transition-colors flex items-center gap-2">
                                Upload Video Now
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </Link>
                    </div>
                </div>

                {/* FAQ Preview - Static Data is fine here */}
                <div className="bg-blue-50 rounded-2xl p-8">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">📋</span>
                        <h3 className="text-xl font-bold text-gray-900">FAQ Preview</h3>
                    </div>
                    <p className="text-gray-700 mb-6 text-sm">Quick Questions</p>

                    <div className="space-y-3 mb-6">
                        {faqData.slice(0, 4).map((faq, index) => (
                            <div key={faq.id} className="flex items-center gap-3 text-gray-700 text-sm">
                                <span className={index % 2 === 0 ? "text-green-600" : "text-gray-400"}>
                                    {index % 2 === 0 ? "✓" : "○"}
                                </span>
                                <span>{faq.question}</span>
                                {index % 2 === 0 && <span className="text-blue-600 text-xs">✓</span>}
                            </div>
                        ))}
                    </div>

                    <Link to="/faq">
                        <button className="bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 px-6 rounded-md transition-colors flex items-center gap-2 text-sm">
                            View Full FAQ
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </Link>
                </div>
            </div>

        </div>
    );
};

export default JinnarChallenge;
