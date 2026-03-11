/**
 * Question Validation Script
 * Usage: npx tsx scripts/validate-questions.ts
 *
 * Validates all questions in the database for correctness.
 */

import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface QuestionOption {
  id: string;
  text: string;
  is_correct: boolean;
}

async function main() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching questions:', error);
    return;
  }

  console.log(`Validating ${questions.length} questions...\n`);

  let valid = 0;
  let invalid = 0;
  const issues: { id: string; text: string; problems: string[] }[] = [];

  for (const q of questions) {
    const problems: string[] = [];

    // Check question text length
    if (!q.question_text || q.question_text.length < 20) {
      problems.push('Question text too short (< 20 chars)');
    }

    // Check options
    const options = q.options as QuestionOption[];
    if (!options || options.length !== 4) {
      problems.push(`Expected 4 options, found ${options?.length ?? 0}`);
    }

    // Check correct option
    if (!q.correct_option_ids || q.correct_option_ids.length === 0) {
      problems.push('No correct option ID');
    } else {
      const correctId = q.correct_option_ids[0];
      const matchingOption = options?.find((o: QuestionOption) => o.id === correctId);
      if (!matchingOption) {
        problems.push(`Correct option "${correctId}" not found in options`);
      }
    }

    // Check explanation length
    if (!q.explanation || q.explanation.length < 50) {
      problems.push('Explanation too short (< 50 chars)');
    }

    // Check difficulty range
    if (q.difficulty < 1 || q.difficulty > 5) {
      problems.push(`Difficulty ${q.difficulty} out of range (1-5)`);
    }

    // Check for is_correct in options
    if (options) {
      const correctOptions = options.filter((o: QuestionOption) => o.is_correct);
      if (correctOptions.length !== 1) {
        problems.push(`Expected 1 correct option in options array, found ${correctOptions.length}`);
      }
    }

    if (problems.length > 0) {
      invalid++;
      issues.push({ id: q.id, text: q.question_text?.substring(0, 60) ?? 'N/A', problems });
    } else {
      valid++;
    }
  }

  console.log(`✅ Valid: ${valid}`);
  console.log(`❌ Invalid: ${invalid}`);

  if (issues.length > 0) {
    console.log('\nIssues found:');
    for (const issue of issues) {
      console.log(`\n  ID: ${issue.id}`);
      console.log(`  Text: ${issue.text}...`);
      issue.problems.forEach((p) => console.log(`    ⚠️  ${p}`));
    }
  }

  // Domain distribution
  const { data: domains } = await supabase.from('domains').select('id, name');
  const domainMap = new Map((domains ?? []).map((d) => [d.id, d.name]));

  console.log('\nDomain Distribution:');
  const domainCounts = new Map<string, number>();
  for (const q of questions) {
    const name = domainMap.get(q.domain_id) ?? 'Unknown';
    domainCounts.set(name, (domainCounts.get(name) ?? 0) + 1);
  }
  for (const [name, count] of domainCounts) {
    console.log(`  ${name}: ${count}`);
  }
}

main().catch(console.error);
