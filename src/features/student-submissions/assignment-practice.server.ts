import 'server-only';
import type { PracticeCase } from './practice-tests';

export function getAssignmentTestExamples(
  mode: string | undefined,
  fixtures: string | undefined,
): PracticeCase[] | null {
  if (mode !== 'development' || fixtures !== 'true') return null;
  return [
    {
      id: 'example-sum-positive',
      name: 'Positive integers',
      stdin: '2 3',
      expected_stdout: '5\n',
    },
    {
      id: 'example-sum-zero',
      name: 'Zero sum',
      stdin: '-4 4',
      expected_stdout: '0\n',
    },
    {
      id: 'example-sum-negative',
      name: 'Negative integers',
      stdin: '-2 -5',
      expected_stdout: '-7\n',
    },
  ];
}
