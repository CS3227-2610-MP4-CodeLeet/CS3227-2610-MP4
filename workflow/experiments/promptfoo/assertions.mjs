import { readFileSync } from 'node:fs';
import {
  buildEvaluationMessages,
  scoreAssertions,
} from '../../scripts/evaluate-soclaas-models.mjs';
import {
  validateEvaluation,
  validateFeedback,
} from '../../scripts/evaluation-contracts.mjs';

const suite = JSON.parse(
  readFileSync(new URL('./cases.json', import.meta.url), 'utf8'),
);

function fixturesForCase(testCase) {
  return {
    assignment: {
      ...suite.fixtures.assignment,
      ...testCase.assignmentOverride,
    },
    rubric: testCase.rubricOverride ?? suite.fixtures.rubric,
  };
}

function validResponse(testCase, response, fixtures) {
  return testCase.role === 'student'
    ? validateFeedback(response)
    : validateEvaluation(response, fixtures.rubric.criteria);
}

function safeContext(testCase, fixtures) {
  const messages = buildEvaluationMessages(testCase, fixtures);
  const user = JSON.parse(messages.user);
  if (testCase.role === 'student') return !Object.hasOwn(user, 'rubric');
  return Object.hasOwn(user, 'rubric');
}

function validModeEnvelope(envelope) {
  if (envelope.mode === 'offline_fixture')
    return envelope.status === 'fixture_only';
  if (envelope.mode !== 'live_soclaas') return false;
  return (
    envelope.status === 'validated' &&
    envelope.schemaValid === true &&
    envelope.qualityChecks &&
    Object.values(envelope.qualityChecks).every(Boolean)
  );
}

function validOutput(testCase, envelope, fixtures) {
  if (!safeContext(testCase, fixtures)) return false;
  if (!validResponse(testCase, envelope.response, fixtures)) return false;
  const qualityChecks = scoreAssertions(testCase, envelope.response, fixtures);
  return (
    Object.values(qualityChecks).every(Boolean) && validModeEnvelope(envelope)
  );
}

export function securityCheck(output, context) {
  if (typeof output !== 'string') return false;
  let envelope;
  try {
    envelope = JSON.parse(output);
  } catch {
    return false;
  }
  const caseId = context?.vars?.caseId;
  const testCase = suite.cases.find((item) => item.id === caseId);
  if (!testCase || envelope.caseId !== caseId) return false;
  const fixtures = fixturesForCase(testCase);
  return validOutput(testCase, envelope, fixtures);
}
