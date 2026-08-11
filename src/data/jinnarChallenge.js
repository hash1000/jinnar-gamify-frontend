export const challengeData = {
  hero: {
    title: "How the Jinnar Viral Challenge Works",
    subtitle: "Create content. Get approved. Go viral. Earn points. Win rewards.",
    primaryButton: "Join Challenge",
    secondaryButton: "Upload Video for Approval"
  },
  
  steps: {
    title: "It's Simple — Just 3 Steps",
    items: [
      {
        number: 1,
        title: "Join an Active Draw",
        description: "Jinnar runs numbered challenge rounds called Draws (Draw 1, Draw 2, Draw 3...). Each Draw has:",
        features: [
          "A focus topic or creative direction",
          "Official hashtags and caption examples",
          "A start and closing date",
          "A prize pool"
        ],
        note: "Participants may join any active draw.",
        cta: "View Current Draws"
      },
      {
        number: 2,
        title: "Upload Your Video for Approval",
        description: "Before posting publicly, upload your video to Jinnar Viral for review. This ensures content quality, safety, and brand alignment.",
        reviewProcess: {
          title: "Review Process:",
          items: [
            "AI + human review",
            "Clear feedback if edits are needed",
            "Fast approval turnaround"
          ]
        },
        statuses: [
          { label: "Pending Review", color: "yellow" },
          { label: "Approved", color: "green" },
          { label: "Needs Revision", color: "red" }
        ]
      },
      {
        number: 3,
        title: "Post & Earn Points",
        description: "Once approved, publish your video on supported platforms and share your post link or screenshot.",
        platforms: [
          "TikTok",
          "Instagram",
          "Facebook",
          "YouTube"
        ],
        cta: "Submit Post Link / Proof"
      }
    ]
  },
  
  competition: {
    title: "Compete Within Each Draw",
    leaderboard: {
      title: "Draw 3 - East Africa",
      cta: "View Leaderboards",
      entries: [
        // { rank: 1, name: "Joseph M.", country: "Kenya", flag: "🇰🇪", points: 12900 },
        // { rank: 2, name: "Maria N.", country: "Tanzania", flag: "🇹🇿", points: 11540 },
        // { rank: 3, name: "Gift M.", country: "Uganda", flag: "🇺🇬", points: 10200 }
      ],
      pointsInfo: "Points ≈ 2,000 likes + 300 ≈ 2,600 points",
      note: "Points are verified using platform APIs and AI validation tools."
    }
  },
  
  winners: {
    title: "How Winners Are Selected",
    subtitle: "Your Content, Jinnar's Promotion",
    description: "By participating, you earn Jinnar permission to feature approved videos in marketing.",
    benefits: [
      "Cash prizes",
      "Official Jinnar merchandise",
      "Public recognition"
    ],
    cta: "View Prizes & Rewards"
  },
  
  callToAction: {
    title: "Ready to Join the Next Draw?",
    subtitle: "Create. Share. Compete. Win.",
    primaryButton: "Join Active Draw",
    secondaryButton: "Upload Video Now"
  },
  
  faq: {
    title: "FAQ Preview",
    subtitle: "Quick Questions",
    questions: [
      { question: "Can I join more than one Draw?", answered: true },
      { question: "How lang dees baayved sefer?", answered: false },
      { question: "Can I submit multiple videos in one Draw?", answered: true },
      { question: "How often are Draws held?", answered: false }
    ],
    cta: "View Full FAQ"
  }
};

export default challengeData;
