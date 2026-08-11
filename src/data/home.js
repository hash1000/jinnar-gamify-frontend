// Static copy for the Home page (rules, status labels) — everything else
// (stats, leaderboards, winners, featured videos) is fetched live from the API.

export const homeData = {
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
