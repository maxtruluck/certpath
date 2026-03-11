/**
 * AI Question Generation Script
 * Usage: npx tsx scripts/generate-questions.ts
 *
 * Generates Security+ SY0-701 practice questions using Claude API.
 * Requires ANTHROPIC_API_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CERT_ID = 'a0000000-0000-0000-0000-000000000001';

// Security+ SY0-701 sub-objectives
const SUB_OBJECTIVES = [
  // Domain 1: General Security Concepts (12%)
  { domain_id: 'd0000000-0000-0000-0000-000000000001', domain: 'General Security Concepts', sub: 'Compare and contrast various types of security controls (technical, managerial, operational, physical)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000001', domain: 'General Security Concepts', sub: 'Summarize fundamental security concepts (CIA triad, non-repudiation, AAA, gap analysis, zero trust, physical security)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000001', domain: 'General Security Concepts', sub: 'Explain the importance of change management processes and their impact on security' },
  { domain_id: 'd0000000-0000-0000-0000-000000000001', domain: 'General Security Concepts', sub: 'Explain the importance of using appropriate cryptographic solutions (PKI, encryption, hashing, digital signatures, key management)' },

  // Domain 2: Threats, Vulnerabilities, and Mitigations (22%)
  { domain_id: 'd0000000-0000-0000-0000-000000000002', domain: 'Threats, Vulnerabilities, and Mitigations', sub: 'Compare and contrast common threat actors and motivations (nation-state, unskilled attacker, hacktivist, insider threat)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000002', domain: 'Threats, Vulnerabilities, and Mitigations', sub: 'Explain common threat vectors and attack surfaces (message-based, image-based, file-based, voice, removable device, supply chain)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000002', domain: 'Threats, Vulnerabilities, and Mitigations', sub: 'Explain various types of vulnerabilities (application, OS, web, hardware, cloud, supply chain, zero-day)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000002', domain: 'Threats, Vulnerabilities, and Mitigations', sub: 'Given a scenario, analyze indicators of malicious activity (malware, physical, network, application attacks)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000002', domain: 'Threats, Vulnerabilities, and Mitigations', sub: 'Explain the purpose of mitigation techniques used to secure the enterprise (segmentation, access control, patching, encryption, monitoring)' },

  // Domain 3: Security Architecture (18%)
  { domain_id: 'd0000000-0000-0000-0000-000000000003', domain: 'Security Architecture', sub: 'Compare and contrast security implications of different architecture models (cloud, IaC, serverless, microservices, IoT, SCADA)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000003', domain: 'Security Architecture', sub: 'Given a scenario, apply security principles to secure enterprise infrastructure (device placement, security zones, attack surface, connectivity)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000003', domain: 'Security Architecture', sub: 'Compare and contrast concepts and strategies to protect data (data types, classification, data sovereignty, methods to secure data)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000003', domain: 'Security Architecture', sub: 'Explain the importance of resilience and recovery in security architecture (HA, site considerations, platform diversity, backups, power)' },

  // Domain 4: Security Operations (28%)
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Given a scenario, apply common security techniques to computing resources (hardening, wireless, mobile, endpoint, monitoring)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Explain the security implications of proper hardware, software, and data asset management' },
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Explain various activities associated with vulnerability management (identification, analysis, response, validation, reporting)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Explain security alerting and monitoring concepts and tools (SIEM, SOAR, antivirus, DLP, SCAP, benchmarks)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Given a scenario, modify enterprise capabilities to enhance security (firewall, IDS/IPS, web filter, OS security, email security)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Given a scenario, implement and maintain identity and access management (provisioning, permissions, MFA, PAM, SSO, federation)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Explain the importance of automation and orchestration related to secure operations' },
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Explain appropriate incident response activities (process, playbooks, tabletop, forensics, root cause analysis)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000004', domain: 'Security Operations', sub: 'Given a scenario, use data sources to support an investigation (log data, metadata, NetFlow, vulnerability scans)' },

  // Domain 5: Security Program Management and Oversight (20%)
  { domain_id: 'd0000000-0000-0000-0000-000000000005', domain: 'Security Program Management and Oversight', sub: 'Summarize elements of effective security governance (policies, standards, procedures, external considerations, board of directors)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000005', domain: 'Security Program Management and Oversight', sub: 'Explain elements of the risk management process (identification, assessment, analysis, risk register, risk tolerance, reporting)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000005', domain: 'Security Program Management and Oversight', sub: 'Explain the processes associated with third-party risk assessment and management' },
  { domain_id: 'd0000000-0000-0000-0000-000000000005', domain: 'Security Program Management and Oversight', sub: 'Summarize elements of effective security compliance (monitoring, privacy, reporting, consequences, frameworks like GDPR, PCI-DSS, HIPAA)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000005', domain: 'Security Program Management and Oversight', sub: 'Explain types and purposes of audits and assessments (attestation, internal, external, penetration testing)' },
  { domain_id: 'd0000000-0000-0000-0000-000000000005', domain: 'Security Program Management and Oversight', sub: 'Given a scenario, implement security awareness practices (phishing campaigns, training, reporting, development, execution)' },
];

interface GeneratedQuestion {
  question_text: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
  explanation: string;
  difficulty: number;
  tags: string[];
}

async function generateQuestionsForObjective(
  objective: typeof SUB_OBJECTIVES[0],
  count: number = 15
): Promise<GeneratedQuestion[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    temperature: 0.7,
    system: `You are an expert CompTIA Security+ (SY0-701) exam question writer.
Generate practice questions that test understanding, not just memorization.
Each question must have exactly 4 options with exactly 1 correct answer.
Explanations should teach the concept, not just state the answer.
Respond ONLY with a JSON array, no markdown or preamble.`,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} multiple-choice practice questions for the following
CompTIA Security+ SY0-701 exam sub-objective:

Domain: ${objective.domain}
Sub-objective: ${objective.sub}

For each question, provide:
- question_text: The question prompt
- options: Array of 4 objects with {id: "a"|"b"|"c"|"d", text: string}
- correct_option_id: The id of the correct option
- explanation: 2-3 sentence explanation of why the answer is correct
- difficulty: 1-5 (1=recall, 3=application, 5=analysis)
- tags: Array of relevant topic tags

Mix difficulty levels: ~30% easy (1-2), ~50% medium (3), ~20% hard (4-5).
Include scenario-based questions where appropriate.`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return [];

  try {
    return JSON.parse(textBlock.text);
  } catch {
    console.error('Failed to parse response for:', objective.sub);
    return [];
  }
}

function validateQuestion(q: GeneratedQuestion): boolean {
  if (!q.question_text || q.question_text.length < 20) return false;
  if (!q.options || q.options.length !== 4) return false;
  if (!q.correct_option_id || !q.options.find((o) => o.id === q.correct_option_id)) return false;
  if (!q.explanation || q.explanation.length < 50) return false;
  if (!q.difficulty || q.difficulty < 1 || q.difficulty > 5) return false;
  return true;
}

async function main() {
  console.log(`Starting question generation for ${SUB_OBJECTIVES.length} sub-objectives...`);

  let totalGenerated = 0;
  let totalInserted = 0;

  for (let i = 0; i < SUB_OBJECTIVES.length; i++) {
    const obj = SUB_OBJECTIVES[i];
    console.log(`\n[${i + 1}/${SUB_OBJECTIVES.length}] ${obj.domain}: ${obj.sub.substring(0, 60)}...`);

    try {
      const questions = await generateQuestionsForObjective(obj);
      totalGenerated += questions.length;

      const valid = questions.filter(validateQuestion);
      console.log(`  Generated: ${questions.length}, Valid: ${valid.length}`);

      for (const q of valid) {
        const { error } = await supabase.from('questions').insert({
          certification_id: CERT_ID,
          domain_id: obj.domain_id,
          question_text: q.question_text,
          question_type: 'multiple_choice',
          options: q.options.map((o) => ({ ...o, is_correct: o.id === q.correct_option_id })),
          correct_option_ids: [q.correct_option_id],
          explanation: q.explanation,
          difficulty: Math.round(q.difficulty),
          tags: q.tags ?? [],
          source: 'ai_generated',
          is_verified: false,
        });

        if (!error) totalInserted++;
        else console.error(`  Insert error: ${error.message}`);
      }

      // Rate limit: wait 1 second between API calls
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`  Error: ${err}`);
    }
  }

  console.log(`\n✅ Done! Generated: ${totalGenerated}, Inserted: ${totalInserted}`);
}

main().catch(console.error);
