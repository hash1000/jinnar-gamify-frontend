// Dummy data for Home page - Will be replaced with API calls

export const homeData = {
    // Stats (from API)
    stats: {
        videosSubmitted: 12540,
        countriesParticipating: 18,
        totalVideosEarned: 45000, // Total videos that earned points
    },

    // Next Mega Draw (from API)
    nextMegaDraw: {
        date: "December 30, 2025",
        countdown: {
            days: 198,
            hours: 23,
            minutes: 14,
            seconds: 12
        }
    },

    // Announcements & Draw Results (from API)
    announcements: [
        {
            id: 1,
            type: "mega",
            title: "Mega Draw - December 30, 2025",
            description: "Top 50 creators win cash prizes + official Jinnar merchandise.",
            icon: "🎁",
            learnMoreLink: "/draws/mega-2025"
        },
        {
            id: 2,
            type: "regional",
            title: "Regional Challenge - East Africa (Jan 10, 2026)",
            description: "Special points multiplier for Kenya, Tanzania, Uganda",
            icon: "🇰🇪",
            learnMoreLink: "/draws/east-africa"
        }
    ],

    // Latest Draw Winners (from API)
    latestWinners: {
        drawName: "Nairobi Weekly Champions (Dec 5-12)",
        winners: [
            {
                rank: 1,
                name: "Joseph M.",
                country: "Kenya",
                flag: "🇰🇪",
                points: 12900,
                totalPoints: 12800
            },
            {
                rank: 2,
                name: "Maria N.",
                country: "Tanzania",
                flag: "🇹🇿",
                points: 11440,
                totalPoints: 11450
            },
            {
                rank: 3,
                name: "Kelvin Arts",
                country: "Uganda",
                flag: "🇺🇬",
                points: 10990,
                totalPoints: 10900
            }
        ],
        seeAllLink: "/past-winners"
    },

    // Featured Videos (from API)
    featuredVideos: [
        {
            id: 1,
            thumbnail: "/placeholder-video-1.jpg",
            creator: "Joseph M.",
            location: "Nairobi",
            points: 12800,
            rank: 1
        },
        {
            id: 2,
            thumbnail: "/placeholder-video-2.jpg",
            creator: "Lynda G.",
            location: "Tanzania",
            points: 11600,
            rank: 2
        },
        {
            id: 3,
            thumbnail: "/placeholder-video-3.jpg",
            creator: "Gift M.",
            location: "Tanzania",
            points: 10200,
            rank: 3
        }
    ],

    // Global Leaderboard (from API)
    globalLeaderboard: {
        weekly: [
            // { rank: 1, name: "Joseph M.", country: "Kenya", flag: "🇰🇪", points: 12900, avatar: "/avatar1.jpg" },
            // { rank: 2, name: "Maria N.", country: "Tanzania", flag: "🇹🇿", points: 11540, avatar: "/avatar2.jpg" },
            // { rank: 3, name: "Gift M.", country: "Uganda", flag: "🇺🇬", points: 10200, avatar: "/avatar3.jpg" }
        ],
        monthly: [
            // { rank: 1, name: "Joseph M.", country: "Kenya", flag: "🇰🇪", points: 45200, avatar: "/avatar1.jpg" },
            // { rank: 2, name: "Lynda G.", country: "Tanzania", flag: "🇹🇿", points: 38900, avatar: "/avatar2.jpg" },
            // { rank: 3, name: "Gift M.", country: "Uganda", flag: "🇺🇬", points: 35100, avatar: "/avatar3.jpg" }
        ]
    },

    // Regional Leaderboard (from API)
    regionalLeaderboard: {
        region: "East Africa",
        period: "Weekly",
        topCreators: [
            {
                rank: 1,
                name: "Joseph M.",
                country: "Kenya",
                flag: "🇰🇪",
                points: 12900,
                thumbnail: "/creator1.jpg"
            },
            {
                rank: 2,
                name: "Lynda G.",
                country: "Tanzania",
                flag: "🇹🇿",
                points: 11600,
                thumbnail: "/creator2.jpg"
            },
            {
                rank: 3,
                name: "Gift M.",
                country: "Uganda",
                flag: "🇺🇬",
                points: 10200,
                thumbnail: "/creator3.jpg"
            }
        ]
    },

    // Status Indicators (from data/home.js - NOT API)
    statusIndicators: [
        {
            status: "Pending Review",
            color: "yellow",
            icon: "⚠",
            description: "Your video is being reviewed"
        },
        {
            status: "Approved - Ready to Post",
            color: "green",
            icon: "✓",
            description: "Video approved! Post it now to earn points"
        },
        {
            status: "Rejected - View Feedback",
            color: "red",
            icon: "✗",
            description: "Video needs changes. Check feedback"
        }
    ],

    // Rules & Brand Standards (from data/home.js - NOT API)
    rulesAndStandards: {
        title: "Rules & Brand Standards",
        subtitle: "You allow Jinnar to feature your videos in official promotions.",
        contentUsagePermission: "You allow Jinnar to feature your videos in official promotions",
        guidelines: [
            "Original content only",
            "Respectful and brand-aligned content",
            "Must display Jinnar products",
            "Use official challenge hashtags",
            "No offensive or misleading screenshots"
        ],
        links: [
            { text: "Read full Rules & Terms", url: "/rules" },
            { text: "Rules and guidelines page", url: "/rules" }
        ]
    }
};

export default homeData;
