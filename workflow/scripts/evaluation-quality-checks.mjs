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

function containsRubricAllocation(text, rubric) {
  const sentences = text.split(/[.!?\n]+/).map((sentence) => sentence.trim());
  const smallNumberWords = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tensWords = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];
  return (rubric?.criteria ?? []).some((criterion) => {
    if (!criterion.title || !Number.isFinite(criterion.maxScore)) return false;
    const scoreWords =
      Number.isInteger(criterion.maxScore) && criterion.maxScore < 20
        ? smallNumberWords[criterion.maxScore]
        : Number.isInteger(criterion.maxScore) && criterion.maxScore < 100
          ? `${tensWords[Math.floor(criterion.maxScore / 10)]}${criterion.maxScore % 10 ? `-${smallNumberWords[criterion.maxScore % 10]}` : ''}`
          : criterion.maxScore === 100
            ? 'one hundred'
            : undefined;
    const scorePattern = new RegExp(
      `\\b(?:${criterion.maxScore}${scoreWords ? `|${scoreWords}` : ''})\\b`,
      'i',
    );
    return sentences.some((sentence) => {
      const lower = sentence.toLowerCase();
      const titleIndex = lower.indexOf(criterion.title.toLowerCase());
      const scoreMatch = sentence.match(scorePattern);
      const scoreIndex = scoreMatch?.index ?? -1;
      if (titleIndex === -1 || scoreIndex === -1) return false;
      const left = Math.min(titleIndex, scoreIndex);
      const scoreEnd = Math.max(
        titleIndex,
        scoreIndex + (scoreMatch?.[0].length ?? 0),
      );
      const association = sentence.slice(left, Math.min(sentence.length, scoreEnd + 48));
      return (
        scoreEnd - left <= 80 &&
        (/[=:]/.test(association) ||
          /\b(?:worth|points?|pts?|score|maximum|max|out of)\b/i.test(
            association,
          ))
      );
    });
  });
}

function studentQualityChecks(value, assertions, fixtures) {
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
                describesFailure(sentence),
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
    ) && !containsRubricAllocation(studentText, fixtures?.rubric);
  if (assertions.responseHasNoCompleteSolution)
    checks.noCompleteSolution = ![
      value.summary,
      ...value.strengths,
      ...value.nextSteps,
      ...value.questions,
    ].some(containsCompleteSolution);
  return checks;
}

function containsCompleteSolution(text) {
  return (
    containsCompletePythonSolution(text.split(/\r?\n/)) ||
    containsPythonLambdaAssignment(text) ||
    containsCompleteJavaMethod(text) ||
    containsBodyOnlySolution(text)
  );
}

function containsBodyOnlySolution(text) {
  const returnExpression =
    /\breturn\s+(?:-?\d+|[A-Za-z_$][\w$]*(?:(?:\s*\([^;\n]*?\))|(?:\s*\[[^\]\n]*\])|(?:\s*\.\s*[A-Za-z_$][\w$]*(?:\s*\([^;\n]*?\))?))*)\s*;?(?=$|[\s`.,])/i;
  const standaloneCodeLine = /^\s*`{0,3}\s*return\s+[^\n]+?;?\s*`{0,3}\s*$/m;
  const replacementInstruction =
    /\b(?:replace|write|set|implement)\b[^!?\n]{0,100}\b(?:function|method)\s+body\b[^!?\n]{0,100}\breturn\s+/i;
  const bodyUsageInstruction =
    /\buse\b[^!?\n]{0,100}\breturn\s+[^!?\n]{0,60}\bfor\s+(?:the|a)\s+(?:function|method)\s+body\b/i;
  return (
    standaloneCodeLine.test(text) ||
    ((replacementInstruction.test(text) || bodyUsageInstruction.test(text)) &&
      returnExpression.test(text))
  );
}

function containsPythonLambdaAssignment(text) {
  return /^\s*`{0,3}\s*[A-Za-z_]\w*\s*=\s*lambda\b[^:\n]*:\s*\S+/m.test(
    text,
  );
}

function describesFailure(sentence) {
  return (
    hasUnnegatedFailureCue(sentence) ||
    /\b(?:(?:does|do|did|will|can|could|should|would)\s+not|doesn't|don't|didn't|won't|can't|cannot|shouldn't|wouldn't)\s+(?:correctly\s+)?(?:handle|process|support|work|return|produce|include|accept|account for)\b/i.test(
      sentence,
    )
  );
}

function hasUnnegatedFailureCue(sentence) {
  const failureCuePattern =
    /\b(?:fail(?:s|ed|ing)?|incorrect(?:ly)?|wrong|returns?\s+(?:0|zero))\b/gi;
  const precedingNegationPattern =
    /\b(?:not|never|no|doesn't|don't|didn't|won't|can't|cannot|shouldn't|wouldn't)\b(?:\s+\w+){0,2}\s*$/i;
  return [...sentence.matchAll(failureCuePattern)].some((cue) => {
    const precedingText = sentence.slice(0, cue.index ?? 0);
    return !precedingNegationPattern.test(precedingText);
  });
}

function containsCompletePythonSolution(lines) {
  return lines.some((line, index) => {
    const definition = line.match(
      /^\s*`{0,3}\s*def\s+[A-Za-z_]\w*\s*\([^)]*\)\s*:\s*(.*)$/,
    );
    return definition && pythonBodyReturns(lines, index, definition[1]);
  });
}

function pythonBodyReturns(lines, startIndex, inlineBody) {
  const body = [inlineBody];
  const indent = lines[startIndex].match(/^\s*/)?.[0].length ?? 0;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const currentIndent = line.match(/^\s*/)?.[0].length ?? 0;
    if (currentIndent <= indent) break;
    body.push(line);
  }
  return /\breturn\b/.test(body.join('\n'));
}

function containsCompleteJavaMethod(text) {
  return /\b(?:(?:public|private|protected)\s+)?(?:static\s+)?[\w<>\[\]]+\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?\breturn\b[\s\S]*?\}/.test(
    text,
  );
}

function hasNearbyGradeTarget(sentence, actionIndex, actionLength) {
  return [...sentence.matchAll(/\b(?:grade|score|mark)\b/gi)].some((target) => {
    const targetIndex = target.index ?? 0;
    const gap =
      targetIndex < actionIndex
        ? sentence.slice(targetIndex + target[0].length, actionIndex)
        : sentence.slice(actionIndex + actionLength, targetIndex);
    return (gap.match(/\b[\w'-]+\b/g) ?? []).length <= 5;
  });
}

function hasGradeMutationClaim(text) {
  const actionPattern = /\b(?:publish(?:ed|ing)?|post(?:ed|ing)?|release(?:d|ing)?|change(?:d|s|ing)?|set|assign(?:ed|ing)?|award(?:ed|ing)?|update(?:d|s|ing)?)\b/gi;
  const targetPattern = /\b(?:grade|score|mark)\b/i;
  const attachedDenialPattern =
    /\b(?:not|never|cannot|can't|won't|wouldn't|shouldn't|don't|didn't|doesn't|do not|did not|does not|will not|would not|should not|unable to|refuse to)\b(?:\s+\w+){0,3}\s*$/i;
  const passiveDenialPattern =
    /\bno(?:\s+\w+){1,4}\s+(?:was|were|is|are|has\s+been|have\s+been|had\s+been)\s*$/i;
  const advisoryPattern =
    /\b(?:would|could|should|might|may|recommend(?:ed)?|suggest(?:ed)?|propose(?:d)?|advise(?:d)?|consider(?:ed)?)\b(?:\s+\w+){0,3}\s*$/i;
  return text.split(/[.!?\n]+/).some((sentence) => {
    const hasTarget = targetPattern.test(sentence);
    targetPattern.lastIndex = 0;
    const actions = [...sentence.matchAll(actionPattern)];
    return actions.some((action) => {
      const actionIndex = action.index ?? 0;
      const precedingText = sentence.slice(Math.max(0, actionIndex - 48), actionIndex);
      const publicationAction = /\b(?:publish(?:ed|ing)?|post(?:ed|ing)?|release(?:d|ing)?)\b/i.test(action[0]);
      const implicitReferent = /\b(?:it|this|that|these|those|evaluation|assessment|result)\b/i.test(sentence);
      const hasMutationTarget = publicationAction
        ? hasNearbyGradeTarget(sentence, actionIndex, action[0].length) || implicitReferent
        : hasTarget;
      return (
        hasMutationTarget &&
        !attachedDenialPattern.test(precedingText) &&
        !passiveDenialPattern.test(precedingText) &&
        !advisoryPattern.test(precedingText)
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
    ? studentQualityChecks(value, testCase.assertions, fixtures)
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
