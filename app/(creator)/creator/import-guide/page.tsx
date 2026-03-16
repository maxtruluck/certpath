'use client'

import { useState } from 'react'

// ─── CSV Templates ───────────────────────────────────────────────
const STRUCTURE_CSV = `module_title,topic_title,module_description,topic_description
"Network Security","Firewalls and IDS","Covers network defense technologies","Understanding firewall types and intrusion detection systems"
"Network Security","VPNs and Tunneling","","VPN protocols and secure tunneling methods"
"Network Security","Network Segmentation","","Dividing networks for improved security"
"Identity & Access","Authentication Methods","Covers identity verification","Multi-factor authentication and biometrics"
"Identity & Access","Authorization Models","","RBAC, ABAC, and MAC models"
"Identity & Access","Identity Federation","","SSO, SAML, and OAuth concepts"`

const QUESTIONS_CSV = `topic_title,question_text,question_type,option_a,option_b,option_c,option_d,correct_answers,explanation,difficulty,tags
"Firewalls and IDS","Which firewall type inspects packets at the application layer?","multiple_choice","Packet filtering","Stateful inspection","Application-level gateway","Circuit-level gateway","c","Application-level gateways (proxy firewalls) inspect traffic at the application layer, providing deep packet inspection.",3,"firewall;application-layer"
"Firewalls and IDS","True or False: An IPS can actively block malicious traffic.","true_false","True","False","","","a","An Intrusion Prevention System (IPS) sits inline and can actively block or drop malicious packets, unlike an IDS which only detects.",2,"ids;ips"
"Authentication Methods","Which of the following are valid MFA factors? (Select all that apply)","multiple_select","Something you know","Something you have","Something you want","Something you are","a,b,d","The three MFA factors are: knowledge (something you know), possession (something you have), and inherence (something you are).",2,"mfa;authentication"
"Firewalls and IDS","The ___ algorithm is used by WPA3 for key exchange.","fill_blank","","","","","","SAE (Simultaneous Authentication of Equals) is used by WPA3.",3,"wifi;encryption",,"SAE|Simultaneous Authentication of Equals","exact"
"Network Security","Put these steps of the TLS handshake in order:","ordering","Client Hello","Server Hello","Certificate Exchange","Key Exchange","c,a,b,d","The TLS handshake follows: Client Hello, Server Hello, Certificate Exchange, Key Exchange.",3,"tls;handshake",,,,,"a,b,c,d"
"Identity & Access","Match each access control model with its description:","matching","","","","","","Each model has a distinct approach to access control.",2,"access-control",,,,,"RBAC|ABAC|MAC","Role-based|Attribute-based|Mandatory"`

const CONTENT_CSV = `topic_title,block_type,title,content
"Firewalls and IDS","concept","Types of Firewalls","There are several types of firewalls, each operating at different layers of the OSI model:\n\n- **Packet Filtering**: Examines packet headers (Layer 3-4)\n- **Stateful Inspection**: Tracks connection state\n- **Application-Level Gateway**: Deep packet inspection (Layer 7)\n- **Next-Gen Firewall (NGFW)**: Combines multiple inspection methods"
"Firewalls and IDS","exam_tip","Know the Differences","CompTIA loves to test the differences between IDS and IPS. Remember: IDS **detects** (passive), IPS **prevents** (active/inline)."
"Firewalls and IDS","definition","Intrusion Detection System (IDS)","A security tool that monitors network traffic or system activities for malicious behavior and policy violations, generating alerts when suspicious activity is detected."
"Authentication Methods","concept","Multi-Factor Authentication","MFA requires two or more verification factors from different categories:\n\n1. **Knowledge** - Something you know (password, PIN)\n2. **Possession** - Something you have (smart card, token)\n3. **Inherence** - Something you are (fingerprint, retina scan)"
"Authentication Methods","key_takeaway","MFA Best Practice","Always combine factors from **different categories**. Two passwords (both knowledge factors) is NOT true MFA."`

// ─── AI Prompt Templates ─────────────────────────────────────────
const AI_PROMPTS = [
  {
    title: 'Generate Course Structure',
    description: 'Use this prompt with any AI to generate a module/topic structure CSV.',
    prompt: `I'm creating a certification prep course for [CERTIFICATION NAME]. Generate a CSV with columns: module_title, topic_title, module_description, topic_description

Requirements:
- 4-6 modules covering all exam domains
- 3-5 topics per module
- Descriptions should be concise (1-2 sentences)
- Topics should map to specific exam objectives
- Output as valid CSV with headers

Format the output as a downloadable CSV file.`,
  },
  {
    title: 'Generate Practice Questions',
    description: 'Generate questions in the correct CSV format for bulk import.',
    prompt: `Generate practice questions for the topic "[TOPIC NAME]" in a [CERTIFICATION] exam prep course.

Output as CSV with columns: topic_title, question_text, question_type, option_a, option_b, option_c, option_d, correct_answers, explanation, difficulty, tags

Requirements:
- 10-15 questions per topic
- Mix of multiple_choice, multiple_select, and true_false types
- Difficulty range 1-5 (mostly 2-4)
- Detailed explanations for each answer
- Tags as semicolon-separated values
- For multiple_select, correct_answers should be comma-separated (e.g., "a,c")
- For true_false, only use option_a (True) and option_b (False)`,
  },
  {
    title: 'Generate Educational Content',
    description: 'Generate typed content blocks for a topic.',
    prompt: `Create educational content for the topic "[TOPIC NAME]" in a [CERTIFICATION] prep course.

Output as CSV with columns: topic_title, block_type, title, content

Use these block types:
- concept: Core concepts and explanations
- definition: Key term definitions
- example: Real-world examples or scenarios
- exam_tip: Specific exam preparation advice
- key_takeaway: Important points to remember
- code_block: Technical configurations or commands
- summary: Topic summary

Requirements:
- 5-8 content blocks per topic
- Content in Markdown format
- Start with a concept block, end with summary
- Include at least one exam_tip
- Use \\n for newlines within content cells`,
  },
  {
    title: 'Review & Improve Questions',
    description: 'Have AI review your existing questions for quality.',
    prompt: `Review these practice questions for a [CERTIFICATION] prep course and suggest improvements:

[PASTE YOUR QUESTIONS HERE]

Check for:
1. Accuracy of correct answers
2. Quality of distractors (wrong options should be plausible)
3. Clarity of question wording
4. Quality of explanations
5. Appropriate difficulty ratings
6. Any duplicate or near-duplicate questions

Output improved versions in the same CSV format.`,
  },
]

// ─── Component ───────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function DownloadButton({ content, filename, label }: { content: string; filename: string; label: string }) {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="btn-primary px-4 py-2 text-sm"
    >
      {label}
    </button>
  )
}

export default function ImportGuidePage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Content Import Guide</h1>
      <p className="text-sm text-gray-500 mb-8">
        Use CSV files and AI to quickly build your course content. Download templates, customize them, and import directly into the course builder.
      </p>

      {/* CSV Templates */}
      <div className="space-y-6 mb-12">
        <h2 className="text-lg font-semibold text-gray-900">CSV Templates</h2>

        {/* Structure Template */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Structure Template</h3>
              <p className="text-xs text-gray-400 mt-0.5">Modules and topics layout</p>
            </div>
            <DownloadButton content={STRUCTURE_CSV} filename="openED-structure-template.csv" label="Download CSV" />
          </div>
          <div className="px-5 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-medium">Column</th>
                  <th className="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">module_title</td><td>Module name (groups topics together)</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">topic_title</td><td>Topic name within the module</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-gray-400">module_description</td><td>Optional module description</td></tr>
                <tr><td className="py-1.5 pr-3 font-mono text-gray-400">topic_description</td><td>Optional topic description</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Questions Template */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Questions Template</h3>
              <p className="text-xs text-gray-400 mt-0.5">Practice questions with options and explanations</p>
            </div>
            <DownloadButton content={QUESTIONS_CSV} filename="openED-questions-template.csv" label="Download CSV" />
          </div>
          <div className="px-5 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-medium">Column</th>
                  <th className="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">topic_title</td><td>Must match an existing topic name</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">question_text</td><td>The question</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">question_type</td><td>multiple_choice, multiple_select, true_false, fill_blank, ordering, matching</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">option_a - option_f</td><td>Answer options (MC/MS/TF/ordering). Leave blank for fill_blank/matching.</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">correct_answers</td><td>Comma-separated correct option letters (MC/MS/TF only)</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">explanation</td><td>Explanation shown after answering</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-gray-400">difficulty</td><td>1-5 (default: 3)</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-gray-400">acceptable_answers</td><td>fill_blank only: pipe-separated answers (e.g., &quot;AES|Advanced Encryption Standard&quot;)</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-gray-400">match_mode</td><td>fill_blank only: &quot;exact&quot; or &quot;contains&quot; (default: exact)</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-gray-400">correct_order</td><td>ordering only: comma-separated option letters in correct order</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-gray-400">matching_left</td><td>matching only: pipe-separated left items</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-gray-400">matching_right</td><td>matching only: pipe-separated right items (same count as left)</td></tr>
                <tr><td className="py-1.5 pr-3 font-mono text-gray-400">tags</td><td>Semicolon-separated tags</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Template */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Content Blocks Template</h3>
              <p className="text-xs text-gray-400 mt-0.5">Educational content blocks per topic</p>
            </div>
            <DownloadButton content={CONTENT_CSV} filename="openED-content-template.csv" label="Download CSV" />
          </div>
          <div className="px-5 py-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-medium">Column</th>
                  <th className="py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="text-gray-600">
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">topic_title</td><td>Must match an existing topic name</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-blue-600">block_type</td><td>concept, definition, example, exam_tip, key_takeaway, code_block, summary, or note</td></tr>
                <tr className="border-b border-gray-50"><td className="py-1.5 pr-3 font-mono text-gray-400">title</td><td>Optional heading for the block</td></tr>
                <tr><td className="py-1.5 pr-3 font-mono text-blue-600">content</td><td>Markdown content (use \n for newlines)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Prompt Templates */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">AI Prompt Templates</h2>
        <p className="text-sm text-gray-500 -mt-4">
          Copy these prompts into ChatGPT, Claude, or any AI tool to generate content in the correct CSV format.
        </p>

        {AI_PROMPTS.map(prompt => (
          <div key={prompt.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{prompt.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{prompt.description}</p>
              </div>
              <CopyButton text={prompt.prompt} />
            </div>
            <div className="px-5 py-3">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-3">
                {prompt.prompt}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
