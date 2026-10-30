import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = new URL('../../', import.meta.url);
const packageJsonPath = fileURLToPath(new URL('package.json', root));
const seedSqlPath = fileURLToPath(new URL('supabase/seed.sql', root));
const warningScriptPath = fileURLToPath(
  new URL('workflow/scripts/warn-local-db-reset.mjs', root),
);

function splitSqlList(source: string): string[] {
  const expressions: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === "'" && inString && nextCharacter === "'") {
      current += "''";
      index += 1;
    } else if (character === "'") {
      inString = !inString;
      current += character;
    } else if (!inString && character === '(') {
      depth += 1;
      current += character;
    } else if (!inString && character === ')') {
      depth -= 1;
      current += character;
    } else if (!inString && depth === 0 && character === ',') {
      expressions.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }

  if (current.trim()) expressions.push(current.trim());
  return expressions;
}

describe('local database reset warning', () => {
  it('warns before both destructive pnpm reset commands', () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts: Record<string, string>;
    };
    const resetCommands = [
      packageJson.scripts['db:reset'],
      packageJson.scripts['db:seed'],
    ];
    const warning = spawnSync(process.execPath, [warningScriptPath], {
      encoding: 'utf8',
    });

    expect(warning.status).toBe(0);
    expect(`${warning.stdout}${warning.stderr}`).toContain(
      'WARNING: This command deletes and recreates the local Supabase database and all existing local data.',
    );
    expect(resetCommands).toHaveLength(2);
    expect(
      resetCommands.every((command) =>
        command.startsWith('node workflow/scripts/warn-local-db-reset.mjs && '),
      ),
    ).toBe(true);
  });

  it('initializes GoTrue lookup and token fields for seeded users', () => {
    const seedSql = readFileSync(seedSqlPath, 'utf8');
    const authUserInsert = seedSql.match(
      /insert into auth\.users \(([\s\S]*?)\)\s*select([\s\S]*?)from seed_accounts/i,
    );

    expect(authUserInsert).not.toBeNull();

    const columns = splitSqlList(authUserInsert?.[1] ?? '').map((column) =>
      column.toLowerCase(),
    );
    const values = splitSqlList(authUserInsert?.[2] ?? '');
    const valuesByColumn = new Map(
      columns.map((column, index) => [column, values[index]]),
    );

    expect(valuesByColumn.get('instance_id')).toBe(
      "'00000000-0000-0000-0000-000000000000'::uuid",
    );
    for (const tokenColumn of [
      'confirmation_token',
      'recovery_token',
      'email_change',
      'email_change_token_current',
      'email_change_token_new',
      'phone_change',
      'phone_change_token',
      'reauthentication_token',
    ]) {
      expect(valuesByColumn.get(tokenColumn)).toBe("''");
    }
  });
});
