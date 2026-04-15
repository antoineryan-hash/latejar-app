export const HERO = {
  eyebrow: "Coming May 2026",
  headline: "Late jar for meetings.",
  headlineAccent: "Auto-donates to the cause your team picks.",
  subhead:
    "We track your team's calendar and Meet attendance, calculate $1 per minute late, and route it to your chosen charity automatically. We take 10% to keep the lights on. You stop being late.",
  primaryCta: "Join the waitlist",
  secondaryCta: "See our live jar",
};

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Your calendar knows",
    body: "We read the scheduled start of every team meeting in your workspace. No manual logging, no honour system.",
  },
  {
    step: "02",
    title: "Meet knows you're late",
    body: "Google Meet reports when each attendee actually joined. The delta is your lateness, down to the second.",
  },
  {
    step: "03",
    title: "Charity gets paid",
    body: "$1 per minute late, auto-routed to the charity your team picks. We take 10% to keep the lights on.",
  },
];

export const FOUNDER_NOTE = `We built this at UpScale because our own team was consistently a few minutes late to every sync. Instead of nagging each other, we turned it into a fundraiser for a cause we all care about: TIACS — mental health support for Australian tradies, truckies, and farmers — via the Gold Coast Marathon our team is running.

It worked. People are still late, but now it feels like they're doing something good when it happens.

We figured other teams might want the same thing. So here we are.`;

export const CHARITY = {
  heading: "Where the money goes",
  body: "Your team picks any charity that accepts Stripe donations. 100% of the donation reaches the charity. We take a separate 10% platform fee — it covers hosting, API costs, and keeps us building. No skimming, no surprises.",
  tiacsUrl:
    "https://fundraise.tiacs.org/fundraisers/upscalegoldcoastmarathon2026",
  tiacsAbout:
    "TIACS is an ATO-endorsed Australian charity (ABN 58 631 207 031). Donations over $2 are tax-deductible.",
  tiacsCtaLabel: "Donate to our team's jar",
};

export const WAITLIST = {
  heading: "Join the waitlist",
  body: "We're opening up to the first ~10 teams in June 2026. Tell us who you are and we'll email you when your spot opens.",
  placeholderEmail: "you@team.com",
  placeholderWorkspace: "Team name (optional)",
  submitLabel: "Get early access",
  successMessage: "You're on the list. We'll be in touch.",
  errorMessage: "Something broke. Email hello@latejar.app instead.",
};

export const LIVE_JAR = {
  heading: "We eat our own cooking",
  sinceLine: (date: string, minutes: number, dollars: number) =>
    `Since we flipped this on ${date}, the UpScale team has been late ${minutes} minutes this month and forfeited $${dollars} to TIACS. Updated daily.`,
  leaderboardTitle: "Top culprits this month",
  emptyState:
    "The jar is fresh. Check back once we've run a few standups — we'll be late within a week.",
};
