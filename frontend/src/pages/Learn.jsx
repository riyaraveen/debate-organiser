import { useState } from 'react'
import { BookOpen, AlertTriangle, Search, Mic, RefreshCw, Layers, ExternalLink } from 'lucide-react'
import PageHero from '../components/ui/PageHero'

const FALLACIES = [
  {
    name: 'Ad Hominem',
    short: 'Attacking the person, not the argument.',
    example: '"You can\'t trust his views on climate change — he failed science in school."',
    howToSpot: 'Listen for personal attacks instead of engagement with the actual argument.',
    howToCounter: 'Redirect: "Let\'s focus on the argument itself, not the person making it."',
  },
  {
    name: 'Strawman',
    short: 'Misrepresenting the opponent\'s argument to make it easier to attack.',
    example: '"My opponent wants to reduce military spending, so they must want us to be completely defenceless!"',
    howToSpot: 'Ask: "Did they actually say that?"',
    howToCounter: 'Clarify your position: "That\'s not my argument. I said..."',
  },
  {
    name: 'Slippery Slope',
    short: 'Claiming one small step will lead to extreme, often catastrophic consequences.',
    example: '"If we allow same-sex marriage, next people will want to marry animals."',
    howToSpot: 'Look for a chain of events with no evidence each step follows inevitably.',
    howToCounter: 'Challenge each step: "What evidence shows that leads to the next step?"',
  },
  {
    name: 'Appeal to Authority',
    short: 'Using an authority figure\'s opinion as evidence, even if irrelevant.',
    example: '"This famous actor says the vaccine is dangerous, so it must be."',
    howToSpot: 'Is the authority actually an expert in this specific topic?',
    howToCounter: 'Ask for peer-reviewed evidence, not just endorsements.',
  },
  {
    name: 'False Dichotomy',
    short: 'Presenting only two options when more exist.',
    example: '"You\'re either with us or against us."',
    howToSpot: 'Listen for "either/or" framing. Are there really only two options?',
    howToCounter: 'Name the third (or fourth) option they ignored.',
  },
  {
    name: '"Think of the Children"',
    short: 'Appealing to the wellbeing of children to shut down rational debate.',
    example: '"We can\'t legalise this — what will it teach our children?"',
    howToSpot: 'When children are invoked emotionally with no logical connection to the policy.',
    howToCounter: 'Ask for evidence about actual harm to children, not just emotional appeal.',
  },
  {
    name: 'Bandwagon (Ad Populum)',
    short: 'Claiming something is true or good because many people believe it.',
    example: '"Millions of people believe this supplement works, so it must."',
    howToSpot: 'Popularity does not equal truth.',
    howToCounter: 'Historical precedents: many people once believed the Earth was flat.',
  },
  {
    name: 'Circular Reasoning',
    short: 'The conclusion is used as a premise in the argument.',
    example: '"The Bible is true because it says so in the Bible."',
    howToSpot: 'Does the argument go in a loop? Is the "proof" just a restatement of the claim?',
    howToCounter: 'Ask for independent evidence outside the circle.',
  },
  {
    name: 'Hasty Generalisation',
    short: 'Drawing a broad conclusion from a small or unrepresentative sample.',
    example: '"I met two rude people from that city — everyone there must be rude."',
    howToSpot: 'How large and representative is the sample? Does it justify the sweeping claim?',
    howToCounter: '"That\'s one data point, not a pattern. Here\'s broader evidence that shows..."',
  },
  {
    name: 'Red Herring',
    short: 'Introducing an irrelevant issue to distract from the actual argument.',
    example: 'When asked about rising crime, a politician pivots to immigration statistics.',
    howToSpot: 'Ask: "Is this actually related to the motion, or is it a distraction?"',
    howToCounter: 'Bring the debate back: "That\'s an interesting point, but the motion is about X."',
  },
  {
    name: 'False Equivalence',
    short: 'Treating two things as equal when they are significantly different in scale or nature.',
    example: '"Cycling without a helmet is just as dangerous as drink-driving."',
    howToSpot: 'Are the two things actually comparable? What are the differences in scale and context?',
    howToCounter: 'Quantify the difference: cite the actual data showing why they are not equivalent.',
  },
  {
    name: 'Appeal to Nature',
    short: 'Assuming something is good because it is natural, or bad because it is artificial.',
    example: '"Essential oils are better than medicine because they\'re all-natural."',
    howToSpot: 'Natural ≠ safe or effective. Artificial ≠ harmful. Arsenic is natural.',
    howToCounter: 'Give counter-examples: many natural things are deadly, many synthetic things save lives.',
  },
  {
    name: 'Post Hoc (False Cause)',
    short: 'Assuming that because B followed A, A caused B.',
    example: '"I wore my lucky socks and we won the match — the socks caused the win."',
    howToSpot: 'Correlation is not causation. Were there other factors? Is there a mechanism?',
    howToCounter: 'Ask for a causal mechanism, not just a timeline.',
  },
  {
    name: 'No True Scotsman',
    short: 'Redefining a group to exclude counterexamples, protecting a generalisation.',
    example: '"No true vegan would eat honey." — used to dismiss vegans who do.',
    howToSpot: 'When someone moves the goalposts after a counterexample is presented.',
    howToCounter: '"You\'re redefining the term to avoid the counterexample. That\'s not a valid response."',
  },
  {
    name: 'Genetic Fallacy',
    short: 'Dismissing an argument based on its origin rather than its merit.',
    example: '"That study was funded by a pharmaceutical company, so we can ignore it."',
    howToSpot: 'The source\'s history or motives don\'t automatically invalidate the argument\'s content.',
    howToCounter: 'Engage with the evidence itself: "Even if the source is biased, is the data accurate?"',
  },
]

const FORMATS = [
  {
    name: 'Oxford Style',
    summary: 'Audience votes before and after to determine the winner. The team that changes the most minds wins.',
    structure: '2 teams — Proposition (for) and Opposition (against), 3 speakers each.',
    speakers: [
      'Proposition Speaker 1 — Opening case (7 min)',
      'Opposition Speaker 1 — Opening case (7 min)',
      'Proposition Speaker 2 — Extend & rebut (7 min)',
      'Opposition Speaker 2 — Extend & rebut (7 min)',
      'Floor speeches — Open to audience (2 min each)',
      'Opposition Speaker 3 — Closing summary (4 min)',
      'Proposition Speaker 3 — Closing summary (4 min)',
    ],
    scoring: 'Winner is determined by the swing in audience votes, not raw numbers. Pre-vote and post-vote are compared.',
    tips: 'Address the audience directly — they are the judges. Emotional persuasion and clarity matter as much as logic.',
  },
  {
    name: 'British Parliamentary (BP)',
    summary: 'Four teams of two debate from four positions. Used in the World Universities Debating Championships.',
    structure: '4 teams of 2: Opening Government, Opening Opposition, Closing Government, Closing Opposition.',
    speakers: [
      'Prime Minister — Opens the debate, defines the motion (7 min)',
      'Leader of Opposition — Rebuts and offers counter-model (7 min)',
      'Deputy Prime Minister — Extends Government case (7 min)',
      'Deputy Leader of Opposition — Extends Opposition case (7 min)',
      'Member for Government — New closing argument (7 min)',
      'Member for Opposition — New closing argument (7 min)',
      'Government Whip — Summary, no new arguments (7 min)',
      'Opposition Whip — Summary, no new arguments (7 min)',
    ],
    scoring: 'Teams ranked 1st–4th. Judged on matter (content 40%), manner (delivery 40%), method (structure 20%). Points of Information (POIs) offered during middle 5 minutes.',
    tips: 'Closing teams must find a new angle — repeating opening arguments loses you points. POIs can destabilise the other team if well-timed.',
  },
  {
    name: 'Lincoln-Douglas (LD)',
    summary: 'One-on-one values debate. Focuses on ethics, philosophy and competing values rather than policy.',
    structure: '1v1 — Affirmative vs Negative. Each debater argues both sides across two rounds in a tournament.',
    speakers: [
      'Affirmative Constructive (AC) — 6 min',
      'Cross-Examination by Negative — 3 min',
      'Negative Constructive (NC) — 7 min',
      'Cross-Examination by Affirmative — 3 min',
      '1st Affirmative Rebuttal (1AR) — 4 min',
      'Negative Rebuttal (NR) — 6 min',
      '2nd Affirmative Rebuttal (2AR) — 3 min',
    ],
    scoring: 'Judge evaluates who best upheld their value premise and criterion. Dropped arguments are considered conceded.',
    tips: 'Your Value and Criterion are the lens through which all arguments are weighed. Winning the framework often wins the round.',
  },
  {
    name: 'US Collegiate Policy',
    summary: 'Evidence-heavy two-on-two debate on a year-long resolution. Builds research depth and analytical speed.',
    structure: '2v2 — Affirmative vs Negative. Both speakers participate in cross-examinations.',
    speakers: [
      '1st Affirmative Constructive (1AC) — 8 min',
      'Cross-Ex by 2nd Negative — 3 min',
      '1st Negative Constructive (1NC) — 8 min',
      'Cross-Ex by 1st Affirmative — 3 min',
      '2nd Affirmative Constructive (2AC) — 8 min',
      'Cross-Ex by 1st Negative — 3 min',
      '2nd Negative Constructive (2NC) — 8 min',
      'Cross-Ex by 2nd Affirmative — 3 min',
      '1st Negative Rebuttal (1NR) — 5 min',
      '1st Affirmative Rebuttal (1AR) — 5 min',
      '2nd Negative Rebuttal (2NR) — 5 min',
      '2nd Affirmative Rebuttal (2AR) — 5 min',
    ],
    scoring: 'Judges evaluate plan feasibility, impacts (magnitude, probability, timeframe), and dropped arguments. Evidence quality is paramount.',
    tips: 'The "flow" (notetaking) is critical. Every dropped argument is conceded. Speed (spreading) is common at high levels — practice flowing.',
  },
  {
    name: 'World Schools (WSDC)',
    summary: 'Three-on-three format used in international championships. Balances matter, manner, and method equally.',
    structure: '2 teams of 3 — Proposition and Opposition. Used in World Schools Debating Championships.',
    speakers: [
      'Proposition 1st Speaker — Case opening (8 min)',
      'Opposition 1st Speaker — Rebut & open case (8 min)',
      'Proposition 2nd Speaker — Extend & rebut (8 min)',
      'Opposition 2nd Speaker — Extend & rebut (8 min)',
      'Proposition 3rd Speaker — Rebut, no new arguments (8 min)',
      'Opposition 3rd Speaker — Rebut, no new arguments (8 min)',
      'Opposition Reply Speech — 1st or 2nd speaker only (4 min)',
      'Proposition Reply Speech — 1st or 2nd speaker only (4 min)',
    ],
    scoring: 'Each speaker scored out of 100: Matter (content & logic) 40, Manner (delivery) 40, Method (structure) 20. POIs offered during minutes 1–7.',
    tips: 'Reply speeches must give a "biased adjudication" — summarise why your side won. 3rd speakers cannot introduce new arguments.',
  },
]

const RESEARCH_TIPS = [
  {
    step: '1',
    title: 'Understand the motion first',
    body: 'Before touching Google, break down every word in the motion. What does it actually claim? Identify the key terms and define them. For example, in "This House believes social media does more harm than good" — define "social media" (all platforms? just consumer?), "harm" (individual? societal?), and "more harm than good" (net balance?).',
    example: 'Motion: "Compulsory voting undermines democracy." Define "compulsory voting" (fines only, or imprisonment?), "undermines" (weakens vs. destroys), and "democracy" (liberal vs. participatory model).',
  },
  {
    step: '2',
    title: 'Research both sides equally',
    body: 'Even if you know which side you\'ll argue, research the opposing case just as deeply. The best rebuttals come from understanding the other side\'s strongest arguments before the debate, not scrambling to respond in the room.',
    example: 'If arguing for UBI, read the strongest critiques: inflation risk, work disincentives, cost projections. Then prepare pre-emptive answers.',
  },
  {
    step: '3',
    title: 'Use a source hierarchy',
    body: 'Not all sources are equal. Rank them: peer-reviewed journals > government/intergovernmental data > established think-tanks > quality journalism > opinion pieces. Avoid Wikipedia as a primary source (it\'s fine for orientation, not citation).',
    example: 'For a climate debate: IPCC reports > Nature journal articles > BBC Science > an opinion columnist.',
  },
  {
    step: '4',
    title: 'Go to primary sources',
    body: 'When a newspaper cites a study, find the actual study. Numbers get distorted in secondary reporting. The original paper will have caveats, methodology, and sample sizes that the headline omits — and your opponent may not have read it.',
    example: '"Study shows X causes Y" — find the actual paper. Often it says "correlates with" or "in a sample of 200 students".',
  },
  {
    step: '5',
    title: 'Trusted databases & sources',
    body: 'Bookmark these: Google Scholar (academic papers), JSTOR (humanities/social sciences), PubMed (medicine/biology), Statista (statistics), Our World in Data (data visualisations), The Economist, BBC, Reuters, AP. For policy: government .gov sites, UN, World Bank, IMF.',
    example: 'For an economics debate: World Bank data + IMF reports + peer-reviewed journal > news article alone.',
  },
  {
    step: '6',
    title: 'Record evidence systematically',
    body: 'For each piece of evidence, note: (1) author & credentials, (2) publication & date, (3) exact quote, (4) what argument it supports. If challenged in the debate, you need to be able to cite it precisely.',
    example: 'Card format: "Dr. Jane Smith, Oxford Professor of Economics, writing in The Lancet (2023): \'X% of Y showed Z.\' Supports: harm argument, point 2."',
  },
  {
    step: '7',
    title: 'Structure your case with PEEL',
    body: 'Each argument should follow PEEL: Point (your claim), Evidence (your data/source), Explain (why the evidence proves the point), Link (tie back to the motion). Judges want to follow a clear logical chain, not a data dump.',
    example: 'Point: "Social media harms mental health." Evidence: "APA 2023 study: teens using 3+ hours/day show 30% higher depression rates." Explain: "Constant social comparison triggers anxiety." Link: "This demonstrates a measurable societal harm."',
  },
  {
    step: '8',
    title: 'Anticipate and pre-empt',
    body: 'After building your case, ask: what\'s the strongest counter-argument? Build a response into your speech. "Some may argue X — however, this ignores Y." This shows intellectual honesty and closes doors before opponents open them.',
    example: 'Arguing for veganism? Pre-empt the nutrition argument: "Critics point to protein deficiency — yet the British Dietetic Association confirms a well-planned vegan diet meets all nutritional needs."',
  },
]

const SPEAKING_TIPS = [
  {
    category: 'Structure & Signposting',
    icon: '📋',
    tips: [
      { title: 'Use a clear roadmap', body: 'Open with "I will make three arguments today. First... Second... Third..." — this primes the audience and judge to follow your logic. Don\'t make them guess your structure.' },
      { title: 'Signpost transitions', body: 'Use explicit transitions: "Moving to my second argument...", "Having established X, I now turn to Y..." Judges who are flowing your speech need these anchors.' },
      { title: 'Summarise before you close', body: 'Before your final sentence, quickly recap: "In conclusion, we have shown X, Y, and Z, and that is why the motion stands." Never just stop speaking.' },
    ],
  },
  {
    category: 'Delivery & Voice',
    icon: '🎙️',
    tips: [
      { title: 'Vary your pace deliberately', body: 'Slow down for key points — the judge\'s pen needs to catch up. Speed up slightly for background context. A monotone pace at one speed is hard to follow.' },
      { title: 'Use the pause', body: 'A 2-second pause after a key point signals importance and lets it land. Most beginners are terrified of silence — but pauses show confidence.' },
      { title: 'Project, don\'t shout', body: 'Debate is not about being loud, it\'s about being heard clearly. Project from your diaphragm. If you find yourself raising your pitch when nervous, consciously bring it down.' },
      { title: 'Match tone to content', body: 'Moral arguments deserve gravitas. Rhetorical questions deserve a slight rise. Humour (used sparingly) can be a sharp tool. Flat delivery flattens even strong content.' },
    ],
  },
  {
    category: 'Body Language & Presence',
    icon: '🧍',
    tips: [
      { title: 'Eye contact with the room', body: 'Sweep the room — don\'t just stare at the judge or your notes. Make individuals feel addressed. In Oxford-style debates, the audience is your judge.' },
      { title: 'Don\'t hide behind your notes', body: 'Notes are a safety net, not a script. Prepare bullet points, not sentences. If you\'re reading your speech, you\'ve prepared too little or written too much.' },
      { title: 'Use purposeful gestures', body: 'Open palms signal openness and honesty. Counting on fingers reinforces listed arguments. Avoid fidgeting, swaying, or hands in pockets — it distracts from your words.' },
    ],
  },
  {
    category: 'Handling Nerves',
    icon: '💪',
    tips: [
      { title: 'Reframe nerves as energy', body: 'The physical symptoms of anxiety and excitement are nearly identical. Tell yourself: "I\'m excited" instead of "I\'m nervous" — research shows this actually improves performance.' },
      { title: 'Breathe before you start', body: 'Take a slow breath before standing. Start speaking only when you feel settled. The first 20 seconds set the tone for your entire speech.' },
      { title: 'Prepare so you can improvise', body: 'The more thoroughly you prepare your core arguments, the more mental bandwidth you have to respond dynamically in the room. Confidence comes from preparation.' },
    ],
  },
]

const REBUTTAL_TECHNIQUES = [
  {
    name: 'The Direct Refutation',
    short: 'Directly challenge the claim, evidence, or logic of an argument.',
    when: 'Use when the opponent\'s argument is factually incorrect or logically flawed.',
    howTo: 'Follow the CARE structure: Claim (restate what they said), Attack (identify the flaw), Reason (explain why it\'s wrong), Evidence (prove your point).',
    example: '"My opponent claimed that X leads to Y. However, this ignores [evidence]. In fact, [counter-evidence] shows the opposite — Z."',
  },
  {
    name: 'The Turn',
    short: 'Flip an opponent\'s argument so it supports your side instead.',
    when: 'Use when their argument actually proves your point if examined properly.',
    howTo: 'Accept their premises but show the conclusion is the opposite of what they claim.',
    example: '"My opponent says economic growth will slow if we implement this policy. In fact, evidence shows that investing in this area generates more growth — their own logic supports us."',
  },
  {
    name: 'The Concede & Minimise',
    short: 'Accept a minor point but show it doesn\'t change the overall picture.',
    when: 'Use when fighting every point is less effective than focusing on what matters.',
    howTo: 'Acknowledge the point briefly, then pivot: "Even if we accept that... it doesn\'t address the larger issue of..."',
    example: '"I accept that there may be some short-term disruption. But the long-term benefits — as we\'ve shown — vastly outweigh this temporary inconvenience."',
  },
  {
    name: 'The Burden Shift',
    short: 'Challenge the opponent to prove something they\'ve merely asserted.',
    when: 'Use when opponents make claims without supporting evidence.',
    howTo: 'Name the assertion and call for evidence: "My opponent asserts X — but assertion is not argument."',
    example: '"My opponent simply stated that crime would rise. Where is the evidence? Countries that implemented this policy saw crime fall by X% — we have the data, they have a claim."',
  },
  {
    name: 'The Impact Comparison',
    short: 'Accept that both sides have harms, but argue your harms are smaller.',
    when: 'Use in a debate where both sides acknowledge trade-offs.',
    howTo: 'Explicitly weigh the harms: probability, scale, reversibility, proximity.',
    example: '"Both sides agree there are costs. But our harm affects 100 people temporarily. Their harm affects 10,000 people permanently. The weighing is clear."',
  },
  {
    name: 'Point of Information (POI)',
    short: 'A brief interruption during an opponent\'s speech to challenge a claim.',
    when: 'Offered during the middle portion of speeches in BP and WSDC formats.',
    howTo: 'Stand, say "Point of information?" or just "POI." Keep it to one short question or challenge. If accepted, be sharp and sit down immediately.',
    example: '"You said the policy has no precedent — but doesn\'t [Country X] already do exactly this?"',
  },
]

const ARGUMENT_FRAMEWORKS = [
  {
    name: 'PEEL',
    tagline: 'The foundational argument structure for any debate speech.',
    steps: [
      { letter: 'P', word: 'Point', desc: 'State your claim clearly and boldly. This is your argument in one sentence.' },
      { letter: 'E', word: 'Evidence', desc: 'Back it with data, examples, or expert opinion. Be specific — name the source, year, figure.' },
      { letter: 'E', word: 'Explain', desc: 'Connect the evidence to your point. Why does this evidence prove your claim? This is the logical step most beginners skip.' },
      { letter: 'L', word: 'Link', desc: 'Tie the argument back to the motion. "This shows that... which is why the motion stands/falls."' },
    ],
    example: 'Point: "Social media causes depression in teenagers." Evidence: "A 2023 APA study found teens using 3+ hours daily showed 30% higher depression rates." Explain: "Constant social comparison and cyberbullying create chronic stress." Link: "This demonstrates a direct, measurable harm — supporting our case that social media does more harm than good."',
  },
  {
    name: 'AREA',
    tagline: 'An expanded structure that builds a more complete case.',
    steps: [
      { letter: 'A', word: 'Assertion', desc: 'Make your claim — your argument in one sentence.' },
      { letter: 'R', word: 'Reasoning', desc: 'Explain the logical mechanism. Why should this claim be true in principle?' },
      { letter: 'E', word: 'Evidence', desc: 'Prove it empirically. Real-world data, case studies, expert consensus.' },
      { letter: 'A', word: 'And so', desc: 'Draw the conclusion. "And so, this proves that... in the context of this debate..."' },
    ],
    example: 'Assertion: "Capital punishment does not deter crime." Reasoning: "Criminals rarely calculate consequences rationally in the moment." Evidence: "The US states with the death penalty have consistently higher murder rates than abolition states (FBI, 2022)." And so: "The deterrence case for capital punishment collapses — the evidence shows it simply does not work."',
  },
  {
    name: 'Claim–Warrant–Impact',
    tagline: 'Used heavily in US Policy debate. Focuses on why an argument matters.',
    steps: [
      { letter: 'C', word: 'Claim', desc: 'What you are arguing — the conclusion you want the judge to accept.' },
      { letter: 'W', word: 'Warrant', desc: 'The logical or evidential support for the claim. Why should they believe it?' },
      { letter: 'I', word: 'Impact', desc: 'Why does this matter? Quantify the scale. Link to the bigger picture of the debate.' },
    ],
    example: 'Claim: "The policy will reduce carbon emissions." Warrant: "Every country that implemented a carbon tax saw emissions fall within 3 years — Canada down 11%, Sweden down 25% (World Bank, 2023)." Impact: "At the current trajectory, this buys us a decade of runway to deploy clean energy — potentially preventing catastrophic 2°C overshoot."',
  },
  {
    name: 'The Rebuttal Sandwich',
    tagline: 'A structure for the rebuttals section of your speech.',
    steps: [
      { letter: '1', word: 'Summarise', desc: 'Briefly restate what your opponent argued — fairly and accurately.' },
      { letter: '2', word: 'Attack', desc: 'Identify the flaw: logical error, missing evidence, false assumption, or counter-evidence.' },
      { letter: '3', word: 'Rebuild', desc: 'Return to your case. Show how even after dealing with their point, your argument still stands.' },
    ],
    example: '"My opponent argued that universal healthcare is too expensive. However, they compared gross costs without accounting for savings on emergency care — the Commonwealth Fund (2022) shows universal systems cost 20% less per capita. And this actually reinforces our case: the policy is not only morally right, it\'s economically efficient."',
  },
]

const RESOURCES = [
  {
    category: 'YouTube Channels',
    icon: '▶️',
    items: [
      { name: 'Intelligence Squared', desc: 'World-class Oxford-style debates on policy, ethics, and ideas. Excellent models for structure and delivery.', url: 'https://www.youtube.com/@intelligencesquared' },
      { name: 'Oxford Union', desc: 'Historic debates and speeches from one of the world\'s most prestigious debating societies.', url: 'https://www.youtube.com/@TheOxfordUnion' },
      { name: 'Munk Debates', desc: 'High-profile debates on major global issues, featuring leading thinkers and public figures.', url: 'https://www.youtube.com/@MunkDebates' },
      { name: 'TED Talks', desc: 'Not debates, but outstanding models of structured argumentation, storytelling, and delivery.', url: 'https://www.youtube.com/@TED' },
      { name: 'Crash Course Philosophy', desc: 'Clear explanations of logic, fallacies, and ethical frameworks — great for building conceptual vocabulary.', url: 'https://www.youtube.com/@crashcourse' },
    ],
  },
  {
    category: 'Research & Argument Resources',
    icon: '🔍',
    items: [
      { name: 'ProCon.org', desc: 'Balanced pro/con breakdowns of major debate topics. Great starting point for building both sides of a case.', url: 'https://www.procon.org' },
      { name: 'Our World in Data', desc: 'Free, peer-reviewed data visualisations on global issues. Excellent source for statistics on health, economy, environment.', url: 'https://ourworldindata.org' },
      { name: 'Google Scholar', desc: 'Find peer-reviewed academic papers on any topic. Use quotes for exact phrases. Filter by date for recent studies.', url: 'https://scholar.google.com' },
      { name: 'Statista', desc: 'Statistics and data on nearly every topic. Often cited in debates — check the original source they link to.', url: 'https://www.statista.com' },
      { name: 'Internet Archive', desc: 'Access older articles and sources that may have been paywalled or taken down.', url: 'https://archive.org' },
    ],
  },
  {
    category: 'Debate Training & Organisations',
    icon: '🏆',
    items: [
      { name: 'IDEA (International Debate Education Association)', desc: 'Resources, curricula, and debate formats for schools and students worldwide.', url: 'https://idebate.org' },
      { name: 'NSDA (National Speech & Debate Association)', desc: 'Resources for competitive speech and debate, including rules, event guides, and topic archives.', url: 'https://www.speechanddebate.org' },
      { name: 'Debate.org', desc: 'Community debate platform — read live debates on hundreds of topics to see argument patterns.', url: 'https://www.debate.org' },
      { name: 'World Schools Debating Championships', desc: 'Official WSDC site — past motions, adjudication criteria, and speaker guides.', url: 'https://www.wsdc.info' },
    ],
  },
  {
    category: 'Reading List',
    icon: '📚',
    items: [
      { name: 'Thank You for Arguing — Jay Heinrichs', desc: 'A witty, practical guide to rhetoric and persuasion rooted in classical techniques. Highly readable.', url: null },
      { name: 'The Art of Thinking Clearly — Rolf Dobelli', desc: '99 cognitive biases and logical errors explained. Great for spotting fallacies and improving your reasoning.', url: null },
      { name: 'How to Win Every Argument — Madsen Pirie', desc: 'A catalogue of fallacies with examples. Short, sharp chapters — ideal reference.', url: null },
      { name: 'Thinking, Fast and Slow — Daniel Kahneman', desc: 'Nobel Prize-winning exploration of how we reason. Foundational for understanding why arguments work or fail.', url: null },
    ],
  },
]

export default function Learn() {
  const [activeTab, setActiveTab] = useState('fallacies')
  const [expandedFallacy, setExpandedFallacy] = useState(null)
  const [expandedFormat, setExpandedFormat] = useState(null)
  const [expandedRebuttal, setExpandedRebuttal] = useState(null)
  const [expandedFramework, setExpandedFramework] = useState(null)

  const tabs = [
    { id: 'fallacies', label: 'Logical Fallacies', icon: AlertTriangle },
    { id: 'formats', label: 'Debate Formats', icon: BookOpen },
    { id: 'research', label: 'Research Tips', icon: Search },
    { id: 'speaking', label: 'Speaking & Delivery', icon: Mic },
    { id: 'rebuttal', label: 'Rebuttal Techniques', icon: RefreshCw },
    { id: 'frameworks', label: 'Argument Structure', icon: Layers },
    { id: 'resources', label: 'Resources & Links', icon: ExternalLink },
  ]

  return (
    <div className="page-container">
      <PageHero title="Learn" subtitle="Debate skills & resources" color="#D02020">
        <svg viewBox="0 0 400 88" preserveAspectRatio="xMidYMid slice">
          <circle cx="50" cy="44" r="60" fill="white" opacity="0.08"/>
          <polygon points="160,2 196,70 124,70" fill="#F0C020" opacity="0.22"/>
          <rect x="220" y="14" width="50" height="50" fill="white" opacity="0.07" transform="rotate(12 245 39)"/>
          <circle cx="340" cy="44" r="55" fill="white" opacity="0.08"/>
          <circle cx="390" cy="-10" r="50" fill="white" opacity="0.06"/>
        </svg>
      </PageHero>
      <div className="learn-body">
      <div className="learn-tabs">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`learn-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* FALLACIES */}
      {activeTab === 'fallacies' && (
        <div className="fallacies-section">
          <p className="learn-intro">
            Logical fallacies are errors in reasoning that weaken an argument.
            Learning to <strong>spot</strong> and <strong>counter</strong> them is a core debate skill. {FALLACIES.length} fallacies listed.
          </p>
          <div className="fallacies-list">
            {FALLACIES.map((f) => (
              <div key={f.name} className={`fallacy-card ${expandedFallacy === f.name ? 'expanded' : ''}`}>
                <button className="fallacy-header" onClick={() => setExpandedFallacy(expandedFallacy === f.name ? null : f.name)}>
                  <strong>{f.name}</strong>
                  <span className="text-muted">{f.short}</span>
                  <span className="chevron">{expandedFallacy === f.name ? '▲' : '▼'}</span>
                </button>
                {expandedFallacy === f.name && (
                  <div className="fallacy-body">
                    <div className="fallacy-section">
                      <h5>Example</h5>
                      <blockquote>{f.example}</blockquote>
                    </div>
                    <div className="fallacy-section">
                      <h5>How to spot it</h5>
                      <p>{f.howToSpot}</p>
                    </div>
                    <div className="fallacy-section">
                      <h5>How to counter it</h5>
                      <p>{f.howToCounter}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORMATS */}
      {activeTab === 'formats' && (
        <div className="formats-learn">
          <p className="learn-intro">
            Different debate formats have different rules, roles, and purposes.
            Understanding the format you're competing in is essential preparation. Click a format to see full details.
          </p>
          <div className="fallacies-list">
            {FORMATS.map((f) => (
              <div key={f.name} className={`fallacy-card ${expandedFormat === f.name ? 'expanded' : ''}`}>
                <button className="fallacy-header" onClick={() => setExpandedFormat(expandedFormat === f.name ? null : f.name)}>
                  <strong>{f.name}</strong>
                  <span className="text-muted">{f.summary}</span>
                  <span className="chevron">{expandedFormat === f.name ? '▲' : '▼'}</span>
                </button>
                {expandedFormat === f.name && (
                  <div className="fallacy-body">
                    <div className="fallacy-section">
                      <h5>Structure</h5>
                      <p>{f.structure}</p>
                    </div>
                    <div className="fallacy-section">
                      <h5>Speaking Order & Times</h5>
                      <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                        {f.speakers.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="fallacy-section">
                      <h5>Scoring</h5>
                      <p>{f.scoring}</p>
                    </div>
                    <div className="fallacy-section">
                      <h5>Pro tip</h5>
                      <p>{f.tips}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESEARCH */}
      {activeTab === 'research' && (
        <div className="research-guide">
          <p className="learn-intro">
            Good research is the foundation of strong debate arguments. Here's how to research effectively — with examples for each step.
          </p>
          <div className="research-steps">
            {RESEARCH_TIPS.map((s) => (
              <div key={s.step} className="research-step">
                <span className="research-step-num">{s.step}</span>
                <div>
                  <h4>{s.title}</h4>
                  <p>{s.body}</p>
                  {s.example && (
                    <blockquote style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                      <strong>Example:</strong> {s.example}
                    </blockquote>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPEAKING */}
      {activeTab === 'speaking' && (
        <div className="fallacies-section">
          <p className="learn-intro">
            Strong arguments poorly delivered lose debates. Master these skills to make your content land with maximum impact.
          </p>
          <div className="fallacies-list">
            {SPEAKING_TIPS.map((cat) => (
              <div key={cat.category} className="fallacy-card expanded">
                <div className="fallacy-header" style={{ cursor: 'default' }}>
                  <strong>{cat.icon} {cat.category}</strong>
                </div>
                <div className="fallacy-body">
                  {cat.tips.map((tip) => (
                    <div key={tip.title} className="fallacy-section">
                      <h5>{tip.title}</h5>
                      <p>{tip.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REBUTTAL */}
      {activeTab === 'rebuttal' && (
        <div className="fallacies-section">
          <p className="learn-intro">
            Rebuttal is where debates are won or lost. A case that can't be defended collapses. Learn these six core techniques.
          </p>
          <div className="fallacies-list">
            {REBUTTAL_TECHNIQUES.map((r) => (
              <div key={r.name} className={`fallacy-card ${expandedRebuttal === r.name ? 'expanded' : ''}`}>
                <button className="fallacy-header" onClick={() => setExpandedRebuttal(expandedRebuttal === r.name ? null : r.name)}>
                  <strong>{r.name}</strong>
                  <span className="text-muted">{r.short}</span>
                  <span className="chevron">{expandedRebuttal === r.name ? '▲' : '▼'}</span>
                </button>
                {expandedRebuttal === r.name && (
                  <div className="fallacy-body">
                    <div className="fallacy-section">
                      <h5>When to use it</h5>
                      <p>{r.when}</p>
                    </div>
                    <div className="fallacy-section">
                      <h5>How to do it</h5>
                      <p>{r.howTo}</p>
                    </div>
                    <div className="fallacy-section">
                      <h5>Example</h5>
                      <blockquote>{r.example}</blockquote>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARGUMENT FRAMEWORKS */}
      {activeTab === 'frameworks' && (
        <div className="fallacies-section">
          <p className="learn-intro">
            Every strong argument follows a structure. These frameworks give your arguments clarity, logical flow, and impact — whether you're writing a speech or thinking on your feet.
          </p>
          <div className="fallacies-list">
            {ARGUMENT_FRAMEWORKS.map((fw) => (
              <div key={fw.name} className={`fallacy-card ${expandedFramework === fw.name ? 'expanded' : ''}`}>
                <button className="fallacy-header" onClick={() => setExpandedFramework(expandedFramework === fw.name ? null : fw.name)}>
                  <strong>{fw.name}</strong>
                  <span className="text-muted">{fw.tagline}</span>
                  <span className="chevron">{expandedFramework === fw.name ? '▲' : '▼'}</span>
                </button>
                {expandedFramework === fw.name && (
                  <div className="fallacy-body">
                    <div className="fallacy-section">
                      <h5>The Steps</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {fw.steps.map((step) => (
                          <div key={step.letter} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <span style={{ fontWeight: 900, fontSize: '1.1rem', minWidth: '28px', background: '#222', color: '#FFD600', padding: '2px 6px', textAlign: 'center' }}>{step.letter}</span>
                            <div><strong>{step.word}</strong> — {step.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="fallacy-section">
                      <h5>Full Example</h5>
                      <blockquote>{fw.example}</blockquote>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RESOURCES */}
      {activeTab === 'resources' && (
        <div className="fallacies-section">
          <p className="learn-intro">
            The best debaters never stop learning. These resources will sharpen your research, argumentation, and delivery — curated for school and competitive debaters.
          </p>
          <div className="fallacies-list">
            {RESOURCES.map((cat) => (
              <div key={cat.category} className="fallacy-card expanded">
                <div className="fallacy-header" style={{ cursor: 'default' }}>
                  <strong>{cat.icon} {cat.category}</strong>
                </div>
                <div className="fallacy-body">
                  {cat.items.map((item) => (
                    <div key={item.name} className="fallacy-section">
                      <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {item.name} <ExternalLink size={13} />
                          </a>
                        ) : item.name}
                      </h5>
                      <p>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
