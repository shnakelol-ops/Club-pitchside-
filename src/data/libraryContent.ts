export type LibraryCategory =
  | "fix-my-team"
  | "systems"
  | "training-sessions"
  | "eight-week-plans"
  | "full-season-plans"
  | "underage-club-development";

export type SportFilter = "gaelic-football" | "ladies-football" | "hurling" | "camogie";

export type AgeGroupFilter = "u6-u8" | "u10" | "u12" | "u14" | "u16" | "minor" | "adult";

export type ProblemTag =
  | "struggling-to-score"
  | "losing-kickouts-puckouts"
  | "too-slow-in-attack"
  | "conceding-too-easy";

export type LibraryItem = {
  id: string;
  title: string;
  summary: string;
  category: LibraryCategory;
  sports: SportFilter[];
  ageGroups: AgeGroupFilter[];
  problemTags: ProblemTag[];
  keywords: string[];
  duration?: string;
  difficulty?: "basic" | "standard" | "advanced";
  setup: string;
  howItWorks: string;
  coachingPoints: string;
  progression: string;
  matchUse: string;
};

export const PROBLEM_OPTIONS: ReadonlyArray<{ id: ProblemTag; label: string }> = [
  { id: "struggling-to-score", label: "Struggling to score" },
  { id: "losing-kickouts-puckouts", label: "Losing kickouts / puckouts" },
  { id: "too-slow-in-attack", label: "Too slow in attack" },
  { id: "conceding-too-easy", label: "Conceding too easy" },
];

export const SPORT_FILTER_OPTIONS: ReadonlyArray<{ id: SportFilter; label: string }> = [
  { id: "gaelic-football", label: "Gaelic Football" },
  { id: "ladies-football", label: "Ladies Football" },
  { id: "hurling", label: "Hurling" },
  { id: "camogie", label: "Camogie" },
];

export const AGE_FILTER_OPTIONS: ReadonlyArray<{ id: AgeGroupFilter; label: string }> = [
  { id: "u6-u8", label: "U6/U8" },
  { id: "u10", label: "U10" },
  { id: "u12", label: "U12" },
  { id: "u14", label: "U14" },
  { id: "u16", label: "U16" },
  { id: "minor", label: "Minor" },
  { id: "adult", label: "Adult" },
];

export const QUICK_BROWSE_CATEGORIES: ReadonlyArray<{ id: LibraryCategory; label: string }> = [
  { id: "systems", label: "Systems" },
  { id: "training-sessions", label: "Training Sessions" },
  { id: "eight-week-plans", label: "8 Week Plans" },
  { id: "full-season-plans", label: "Full Season Plans" },
  { id: "underage-club-development", label: "Underage & Club Development" },
];

export const PROBLEM_TAB_OPTIONS: ReadonlyArray<{
  id: "systems" | "sessions" | "eight-week-plans";
  label: string;
  category: LibraryCategory;
}> = [
  { id: "systems", label: "Systems", category: "systems" },
  { id: "sessions", label: "Sessions", category: "training-sessions" },
  { id: "eight-week-plans", label: "8 Week Plans", category: "eight-week-plans" },
];

export const LIBRARY_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  "fix-my-team": "Fix My Team",
  systems: "Systems",
  "training-sessions": "Training Sessions",
  "eight-week-plans": "8 Week Plans",
  "full-season-plans": "Full Season Plans",
  "underage-club-development": "Underage & Club Development",
};

export const SPORT_LABELS: Record<SportFilter, string> = {
  "gaelic-football": "Gaelic Football",
  "ladies-football": "Ladies Football",
  hurling: "Hurling",
  camogie: "Camogie",
};

export const AGE_LABELS: Record<AgeGroupFilter, string> = {
  "u6-u8": "U6/U8",
  u10: "U10",
  u12: "U12",
  u14: "U14",
  u16: "U16",
  minor: "Minor",
  adult: "Adult",
};

export const LIBRARY_ITEMS: ReadonlyArray<LibraryItem> = [
  {
    id: "session-three-lane-finish",
    title: "Three Lane Finish",
    summary: "Build fast support runs and finish from central space.",
    category: "training-sessions",
    sports: ["gaelic-football", "ladies-football"],
    ageGroups: ["u14", "u16", "minor", "adult"],
    problemTags: ["struggling-to-score", "too-slow-in-attack"],
    keywords: ["scoring", "attack speed", "support runs"],
    duration: "40 min",
    difficulty: "standard",
    setup: "Set three lanes with cones. Use one goal and six balls.",
    howItWorks: "Ball must move through all lanes before a shot.",
    coachingPoints: "Pass early. Call support. Finish low and early.",
    progression: "Add one recovering defender in each lane.",
    matchUse: "Use before games when attacks are slow.",
  },
  {
    id: "session-kickout-press-wave",
    title: "Kickout Press Wave",
    summary: "Train first press line and second wave support.",
    category: "training-sessions",
    sports: ["gaelic-football", "ladies-football"],
    ageGroups: ["u14", "u16", "minor", "adult"],
    problemTags: ["losing-kickouts-puckouts", "conceding-too-easy"],
    keywords: ["kickout", "press", "shape"],
    duration: "35 min",
    difficulty: "standard",
    setup: "Use half pitch. Mark kickout zones and press triggers.",
    howItWorks: "GK restarts. Press line reacts to call and closes space.",
    coachingPoints: "Start narrow. Sprint on trigger. Protect inside lane.",
    progression: "Allow short and long options to read live choices.",
    matchUse: "Use when opponents build from kickouts too easily.",
  },
  {
    id: "session-puckout-break-race",
    title: "Puckout Break Race",
    summary: "Improve body position and first touch on broken ball.",
    category: "training-sessions",
    sports: ["hurling", "camogie"],
    ageGroups: ["u12", "u14", "u16", "minor", "adult"],
    problemTags: ["losing-kickouts-puckouts", "conceding-too-easy"],
    keywords: ["puckout", "break", "reaction"],
    duration: "30 min",
    difficulty: "basic",
    setup: "Mark break zone from 45 to midfield. Use two teams of six.",
    howItWorks: "Coach strikes long. Players compete for break and outlet pass.",
    coachingPoints: "Attack the drop zone. Stay side-on. Secure first pass.",
    progression: "Add one support runner and one sweeper.",
    matchUse: "Use when your side loses second ball too often.",
  },
  {
    id: "system-front-foot-3-2",
    title: "Front Foot 3-2",
    summary: "Simple attacking shape to get two inside runners free.",
    category: "systems",
    sports: ["gaelic-football", "ladies-football"],
    ageGroups: ["u16", "minor", "adult"],
    problemTags: ["struggling-to-score", "too-slow-in-attack"],
    keywords: ["shape", "inside run", "attack pattern"],
    difficulty: "standard",
    setup: "Set a 3-2 shape from midfield to scoring zone.",
    howItWorks: "Half-forward drags wide. Two runners attack inside channel.",
    coachingPoints: "Fix width early. Time first runner. Hit support hand pass.",
    progression: "Add a sweeper and force weak-side switch.",
    matchUse: "Use when defence sits deep and blocks central lane.",
  },
  {
    id: "system-counter-seal",
    title: "Counter Seal Shape",
    summary: "Lock the middle and force play to low-value areas.",
    category: "systems",
    sports: ["gaelic-football", "ladies-football", "hurling", "camogie"],
    ageGroups: ["u14", "u16", "minor", "adult"],
    problemTags: ["conceding-too-easy"],
    keywords: ["defence", "counter", "middle protection"],
    difficulty: "standard",
    setup: "Mark central lane and two outside traps.",
    howItWorks: "Closest player delays. Support locks central lane behind.",
    coachingPoints: "Delay first. Keep body inside. Tackle in pairs.",
    progression: "Add quick restart after turnover for counter attack.",
    matchUse: "Use when conceding from straight central breaks.",
  },
  {
    id: "system-puckout-box-2-2",
    title: "Puckout Box 2-2",
    summary: "Create clear short and long options on every puckout.",
    category: "systems",
    sports: ["hurling", "camogie"],
    ageGroups: ["u14", "u16", "minor", "adult"],
    problemTags: ["losing-kickouts-puckouts", "too-slow-in-attack"],
    keywords: ["puckout shape", "restart", "build up"],
    difficulty: "advanced",
    setup: "Build a 2-2 box with one high release player.",
    howItWorks: "GK reads press. Hit short if free, long to break if blocked.",
    coachingPoints: "Check shoulder early. Keep first touch forward.",
    progression: "Switch release side every second restart.",
    matchUse: "Use when press forces poor puckout choices.",
  },
  {
    id: "plan-8week-scoring-reset",
    title: "8 Week Scoring Reset",
    summary: "Short cycle to raise shot quality and decision speed.",
    category: "eight-week-plans",
    sports: ["gaelic-football", "ladies-football"],
    ageGroups: ["u14", "u16", "minor", "adult"],
    problemTags: ["struggling-to-score", "too-slow-in-attack"],
    keywords: ["8 week", "scoring plan", "decision speed"],
    duration: "8 weeks",
    difficulty: "standard",
    setup: "Run two focused attack sessions each week.",
    howItWorks: "Weeks 1-2 habits, 3-5 pressure, 6-8 match transfer.",
    coachingPoints: "Track shot map. Coach first action after pass.",
    progression: "Raise tempo each fortnight with tighter time limits.",
    matchUse: "Use mid-season when scores drop over three games.",
  },
  {
    id: "plan-8week-restart-control",
    title: "8 Week Restart Control",
    summary: "Own kickouts and puckouts with repeatable routines.",
    category: "eight-week-plans",
    sports: ["gaelic-football", "ladies-football", "hurling", "camogie"],
    ageGroups: ["u12", "u14", "u16", "minor", "adult"],
    problemTags: ["losing-kickouts-puckouts", "conceding-too-easy"],
    keywords: ["8 week", "restart", "kickout", "puckout"],
    duration: "8 weeks",
    difficulty: "standard",
    setup: "Choose two primary restart calls and one fallback call.",
    howItWorks: "Train calls under pressure every week with review clips.",
    coachingPoints: "Use clear call words. Protect middle first.",
    progression: "Add fake call in week five.",
    matchUse: "Use when restarts swing momentum against your team.",
  },
  {
    id: "plan-full-season-club-identity",
    title: "Full Season Club Identity",
    summary: "Build a clear playing style from pre-season to finals.",
    category: "full-season-plans",
    sports: ["gaelic-football", "ladies-football", "hurling", "camogie"],
    ageGroups: ["minor", "adult"],
    problemTags: ["too-slow-in-attack", "conceding-too-easy"],
    keywords: ["season plan", "identity", "club style"],
    duration: "Season",
    difficulty: "advanced",
    setup: "Set three style rules for attack and three for defence.",
    howItWorks: "Review style rules weekly and clip examples.",
    coachingPoints: "Keep language simple. Reward rule-following actions.",
    progression: "Add one new detail each block, not every week.",
    matchUse: "Use when team performance changes game to game.",
  },
  {
    id: "plan-full-season-underage-pathway",
    title: "Full Season Underage Pathway",
    summary: "Link skills and habits from U10 to Minor.",
    category: "underage-club-development",
    sports: ["gaelic-football", "ladies-football", "hurling", "camogie"],
    ageGroups: ["u10", "u12", "u14", "u16", "minor"],
    problemTags: ["too-slow-in-attack", "conceding-too-easy"],
    keywords: ["underage", "pathway", "club development"],
    duration: "Season",
    difficulty: "standard",
    setup: "Set age-stage goals for skill, game sense, and habits.",
    howItWorks: "Review each age block every six weeks with coaches.",
    coachingPoints: "Keep goals age-right. Repeat core habits often.",
    progression: "Move one habit up an age group each term.",
    matchUse: "Use to align all age groups with one club plan.",
  },
  {
    id: "session-u10-first-touch-games",
    title: "U10 First Touch Games",
    summary: "Short games to improve first touch under light pressure.",
    category: "underage-club-development",
    sports: ["gaelic-football", "ladies-football", "hurling", "camogie"],
    ageGroups: ["u6-u8", "u10"],
    problemTags: ["too-slow-in-attack"],
    keywords: ["u10", "first touch", "fun games"],
    duration: "25 min",
    difficulty: "basic",
    setup: "Create four small squares with one ball per square.",
    howItWorks: "Players receive and move ball before gentle pressure arrives.",
    coachingPoints: "Open body early. Keep touches short. Eyes up.",
    progression: "Shrink square sizes after each round.",
    matchUse: "Use as early block in underage sessions.",
  },
  {
    id: "fix-shot-selection-check",
    title: "Shot Selection Check",
    summary: "Simple checklist to stop low-value shots.",
    category: "fix-my-team",
    sports: ["gaelic-football", "ladies-football", "hurling", "camogie"],
    ageGroups: ["u14", "u16", "minor", "adult"],
    problemTags: ["struggling-to-score"],
    keywords: ["shot choice", "decision making", "scores"],
    duration: "10 min review",
    difficulty: "basic",
    setup: "Use board with three shot zones and team clips.",
    howItWorks: "Players score each shot as green, amber, or red choice.",
    coachingPoints: "Choose clear shots. Move ball before forcing attempt.",
    progression: "Add time pressure and defender pressure tags.",
    matchUse: "Use after games with many wides.",
  },
  {
    id: "fix-restart-pairs",
    title: "Restart Pair Roles",
    summary: "Give each pair one clear restart job.",
    category: "fix-my-team",
    sports: ["gaelic-football", "ladies-football", "hurling", "camogie"],
    ageGroups: ["u12", "u14", "u16", "minor", "adult"],
    problemTags: ["losing-kickouts-puckouts"],
    keywords: ["restart roles", "pair work", "kickout", "puckout"],
    duration: "15 min",
    difficulty: "basic",
    setup: "Pair players and assign near, middle, or far lane jobs.",
    howItWorks: "Repeat restarts with same pairs until timing is clean.",
    coachingPoints: "Talk early. Hold lane. Protect inside shoulder.",
    progression: "Rotate pair jobs after three clean wins.",
    matchUse: "Use when restart structure breaks under pressure.",
  },
  {
    id: "system-fast-exit-2pass",
    title: "Fast Exit Two Pass",
    summary: "Two-pass exit to move from defence to attack faster.",
    category: "systems",
    sports: ["gaelic-football", "ladies-football", "hurling", "camogie"],
    ageGroups: ["u14", "u16", "minor", "adult"],
    problemTags: ["too-slow-in-attack", "conceding-too-easy"],
    keywords: ["transition", "exit play", "speed"],
    difficulty: "standard",
    setup: "Mark exit gate at 45 and support lane outside.",
    howItWorks: "Turnover player finds first pass, then second pass through gate.",
    coachingPoints: "Secure first pass. Run hard off second pass.",
    progression: "Add chaser after second pass.",
    matchUse: "Use when transition stalls in your own half.",
  },
];
