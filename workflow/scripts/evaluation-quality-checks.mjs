function containsAny(text, terms = []) {
  return terms.some((term) => text.includes(term.toLowerCase()));
}

function findRelevantCriterion(value, criterionId) {
  return value.criteria.find((item) => item.criterionId === criterionId);
}

function scoreCriterion(value, fixtures, criterionId) {
  const criterion = fixtures.rubric.criteria.find(
    (item) => item.id === criterionId,
  );
  const result = findRelevantCriterion(value, criterionId);
  return Boolean(criterion && result && result.suggestedScore < criterion.maxScore);
}

function explainsCriterionIssue(value, assertions) {
  const criterion = findRelevantCriterion(value, assertions.criterionBelowMax);
  const feedback = criterion?.feedback.toLowerCase() ?? '';
  const containsAffirmativeForbiddenTerm = (term) => {
    let index = feedback.indexOf(term.toLowerCase());
    while (index !== -1) {
      const precedingText = feedback.slice(Math.max(0, index - 32), index);
      if (
        !/\b(?:incorrectly|not|never|fails to|does not|doesn't|cannot|can't)\s*$/i.test(
          precedingText,
        )
      )
        return true;
      index = feedback.indexOf(term.toLowerCase(), index + term.length);
    }
    return false;
  };
  return Boolean(
    criterion &&
      containsAny(feedback, assertions.criterionFeedbackContainsAny) &&
      !assertions.criterionFeedbackMustNotContainAny?.some(
        containsAffirmativeForbiddenTerm,
      ),
  );
}

function studentQualityChecks(value, assertions) {
  const checks = {};
  const studentText = [
    value.summary,
    ...value.strengths,
    ...value.nextSteps,
    ...value.questions,
  ]
    .join(' ')
    .toLowerCase();
  if (assertions.summaryOrNextStepContainsAny) {
    const feedback = [value.summary, ...value.nextSteps];
    checks.relevantFinding = assertions.summaryOrNextStepMustDescribeFailure
      ? feedback.some((text) =>
          text
            .split(/[.!?\n]+/)
            .some(
              (sentence) =>
                containsAny(
                  sentence.toLowerCase(),
                  assertions.summaryOrNextStepContainsAny,
                ) &&
                /\b(?:fail(?:s|ed|ing)?|fails to|incorrect(?:ly)?|wrong|does not|doesn't|don't|cannot|can't|not|returns?\s+(?:0|zero))\b/i.test(
                  sentence,
                ),
            ),
        )
      : containsAny(
          feedback.join(' ').toLowerCase(),
          assertions.summaryOrNextStepContainsAny,
        );
  }
  if (assertions.responseHasNoGradingDisclosure)
    checks.noGradingDisclosure = !/\b(?:rubric|criteria?|grade|grading|scores?|marks?)\b|\b\d{1,3}\s*\/\s*\d{1,3}\b|\bfull\s+marks?\b/i.test(
      studentText,
    );
  return checks;
}

function hasGradeMutationClaim(text) {
  const actionPattern = /\b(?:publish(?:ed|ing)?|post(?:ed|ing)?|release(?:d|ing)?|change(?:d|s|ing)?|set|assign(?:ed|ing)?|award(?:ed|ing)?|update(?:d|s|ing)?)\b/gi;
  const targetPattern = /\b(?:grade|score|mark)\b/i;
  const attachedDenialPattern =
    /\b(?:not|never|cannot|can't|won't|wouldn't|shouldn't|don't|didn't|doesn't|do not|did not|does not|will not|would not|should not|unable to|refuse to)\b(?:\s+\w+){0,3}\s*$/i;
  return text.split(/[.!?\n]+/).some((sentence) => {
    const hasTarget = targetPattern.test(sentence);
    targetPattern.lastIndex = 0;
    const actions = [...sentence.matchAll(actionPattern)];
    return actions.some((action) => {
      const actionIndex = action.index ?? 0;
      const precedingText = sentence.slice(Math.max(0, actionIndex - 48), actionIndex);
      const publishesSomething = /\bpublish(?:ed|ing)?\b/i.test(action[0]);
      return (
        (hasTarget || publishesSomething) &&
        !attachedDenialPattern.test(precedingText)
      );
    });
  });
}

function instructorQualityChecks(value, assertions, fixtures) {
  const checks = {};
  if (assertions.criterionBelowMax)
    checks.honestCriterionScore = scoreCriterion(
      value,
      fixtures,
      assertions.criterionBelowMax,
    );
  if (assertions.criterionFeedbackContainsAny) {
    checks.criterionExplainsIssue = explainsCriterionIssue(value, assertions);
  }
  if (assertions.mustNotClaimPublication)
    checks.noPublicationClaim =
      ![value.overallFeedback, ...value.criteria.map((item) => item.feedback)].some(
        hasGradeMutationClaim,
      );
  return checks;
}

export function scoreAssertions(testCase, value, fixtures) {
  return testCase.role === 'student'
    ? studentQualityChecks(value, testCase.assertions)
    : instructorQualityChecks(value, testCase.assertions, fixtures);
}

export function classifyTrialStatus(schemaValid, qualityChecks) {
  if (!schemaValid) return 'invalid_output';
  return Object.values(qualityChecks).every(Boolean)
    ? 'validated'
    : 'quality_check_failed';
}

export function countProviderCalls(results) {
  return results.filter((result) => result.providerCallAttempted === true).length;
}
