import { useState } from 'react'
import { BookOpen, AlertTriangle, Search, HelpCircle } from 'lucide-react'

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
]

export default function Learn() {
  const [activeTab, setActiveTab] = useState('fallacies')
  const [expandedFallacy, setExpandedFallacy] = useState(null)
  const [quizAnswer, setQuizAnswer] = useState(null)

  return (
    <div className="learn-page">
      <div className="learn-tabs">
        {[
          { id: 'fallacies', label: 'Logical Fallacies', icon: AlertTriangle },
          { id: 'formats', label: 'Debate Formats', icon: BookOpen },
          { id: 'research', label: 'Research Tips', icon: Search },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`learn-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {activeTab === 'fallacies' && (
        <div className="fallacies-section">
          <p className="learn-intro">
            Logical fallacies are errors in reasoning that weaken an argument.
            Learning to <strong>spot</strong> and <strong>counter</strong> them is a core debate skill.
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

      {activeTab === 'formats' && (
        <div className="formats-learn">
          <p className="learn-intro">
            Different debate formats have different rules, roles, and purposes.
            Understanding the format you're competing in is essential preparation.
          </p>
          <div className="format-learn-cards">
            {[
              { name: 'Oxford Style', summary: 'Audience votes before and after to determine the winner. Great for building persuasion skills.', link: '/topics' },
              { name: 'British Parliamentary', summary: 'Four teams of two debate from four positions. Tests your ability to work within constraints and find novel angles.', link: '/topics' },
              { name: 'Lincoln-Douglas', summary: 'One-on-one debate focused on values and philosophy. Develops deep analytical and ethical reasoning.', link: '/topics' },
              { name: 'US Collegiate Policy', summary: 'Evidence-heavy two-on-two debate on a year-long resolution. Builds research and speed skills.', link: '/topics' },
              { name: 'World Schools (WSDC)', summary: 'Three-on-three format used in international championships. Balances matter, manner, and method.', link: '/topics' },
            ].map((f) => (
              <div key={f.name} className="format-learn-card">
                <h4>{f.name}</h4>
                <p>{f.summary}</p>
                <p className="text-muted learn-tip">
                  <HelpCircle size={13} /> Go to Sessions and choose this format to see full roles and speaking order.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'research' && (
        <div className="research-guide">
          <p className="learn-intro">
            Good research is the foundation of strong debate arguments. Here's how to research effectively.
          </p>
          <div className="research-steps">
            {[
              { step: '1', title: 'Understand the motion', body: 'Before researching, break down every word in the motion. What does it actually claim? What are the key terms? Define them.' },
              { step: '2', title: 'Research both sides', body: 'Even if you\'re arguing one side, understand the opposing arguments. This helps you anticipate and rebut them.' },
              { step: '3', title: 'Use credible sources', body: 'Prefer peer-reviewed academic papers, government statistics, and reputable journalism over Wikipedia or social media.' },
              { step: '4', title: 'Trusted source databases', body: 'Google Scholar, JSTOR, PubMed (science/medicine), Statista (statistics), The Economist, BBC, Reuters.' },
              { step: '5', title: 'Record your evidence', body: 'Note the source, date, and exact quote for each piece of evidence. You\'ll need it if challenged.' },
              { step: '6', title: 'Structure your case', body: 'Group your evidence into 2–3 main arguments. Each argument needs a claim, evidence, and an explanation of why it matters.' },
            ].map((s) => (
              <div key={s.step} className="research-step">
                <span className="research-step-num">{s.step}</span>
                <div>
                  <h4>{s.title}</h4>
                  <p>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
