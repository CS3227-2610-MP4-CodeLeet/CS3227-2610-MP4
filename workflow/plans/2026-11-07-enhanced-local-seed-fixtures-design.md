# Enhanced Local Seed Fixtures Design

## Intent and Why
Local development and automated testing require realistic, rich fixture data that reflects actual platform capabilities rather than trivial placeholders. Enhancing the seed fixtures ensures developers and evaluators can immediately sign in with standard credentials (including an admin account), test course workspaces across Python, Java, and polyglot contexts, and interact with realistic LeetCode-style assignments with valid test cases, rubrics, submissions, grades, and forum discussions.

## Goals
- Provide an admin user (`admin@codeleet.test`), 3 instructors, and 12 students with a uniform default password (`password`, 8 characters, satisfying both client-side validation and Supabase auth requirements).
- Provision 3 active course workspaces:
  1. **Python Programming**: Python-only course (e.g., CS101) owned by Instructor 1.
  2. **Java Programming**: Java-only course (e.g., CS102) owned by Instructor 2.
  3. **Data Structures & Algorithms**: Polyglot course with both Python and Java assignments owned by Instructor 3.
- Enroll students and instructors as members across all 3 courses with all course features (`assessments`, `ai`, `discussions`, `xp`, `leaderboard`) enabled.
- Seed realistic, well-known LeetCode Easy problems (e.g., Two Sum, Valid Palindrome, Best Time to Buy and Sell Stock, Valid Parentheses, Roman to Integer, Fizz Buzz) with:
  - Formatted instructions with problem description, constraints, and I/O examples.
  - Multi-criterion rubrics (Correctness, Edge Cases, Code Style, Efficiency) totaling 10–20 max XP.
  - Practice test sets in `assignment_practice_sets` and drafts with valid `stdin` and `expected_stdout` (adhering to the schema's 5-case limit and JSON constraints).
- Seed realistic multi-revision submissions, instructor grades with scores and feedback, earned student XP for the leaderboard, and course-specific forum discussions.
- Preserve the archived `Legacy` course required by existing migration invariants.
- Update `supabase/README.md` to document the default password and the seeded course structures.

## Non-Goals & Anti-Goals
- **Non-Goals:** Modifying database schema migrations or application source logic; seeding sensitive or real student/instructor credentials.
- **Anti-Goals:** Committing real secrets, bypassing Supabase auth constraints, exceeding the 5-test-case limit per assignment, or breaking existing e2e test assumptions.

## Constraints
- Password length must satisfy Supabase's 6-character minimum (`minimum_password_length = 6`) and client-side password field validation (`minLength={8}`). Default password is set to `password` (8 characters).
- Test cases must satisfy `public.valid_practice_cases` (max 5 cases per set; exactly 4 keys: `id`, `name`, `stdin`, `expected_stdout`; stdin <= 4096 bytes; stdout <= 8192 bytes).
- Assignments must adhere to `language in ('python', 'java')` and reference a valid `course_id`.
- Code execution is strictly browser-only (stdin/stdout via `Main` class for Java, script for Python).

## Approaches Considered
- **Approach 1: Self-Contained Declarative SQL in `supabase/seed.sql` (Chosen):**
  Uses PostgreSQL extensions (`extensions.crypt('password', extensions.gen_salt('bf'))`) to populate `auth.users`, courses, memberships, assignments, practice sets, rubrics, submissions, grades, and forum threads in one atomic script. Directly compatible with `pnpm db:seed` and `supabase db reset`. Zero external runtime dependencies.
- **Approach 2: Programmatic Seed Script via Supabase Admin API:**
  Populates data via Node.js/TypeScript calling Supabase RPCs and REST endpoints. Trades off execution speed and CLI resets for UI-level RPC validation.
- **Decision:** Approach 1 was chosen for speed, reproducibility, zero dependencies, and native integration with `pnpm db:seed`.

## Detailed Seed Plan
1. **Accounts & Authentication:**
   - Hash password `password` using bcrypt in `seed_accounts`.
   - Update `auth.users` encrypted password, confirmed email, identities, and profiles.
   - Maintain `admin@codeleet.test` with `admin` role in `public.user_roles`.
2. **Courses:**
   - Course A (`96000000-0000-4000-8000-000000000001`): "CS101: Introduction to Python Programming", active, owner Instructor 1.
   - Course B (`96000000-0000-4000-8000-000000000002`): "CS102: Data Structures in Java", active, owner Instructor 2.
   - Course C (`96000000-0000-4000-8000-000000000003`): "CS201: Algorithms & Problem Solving" (Polyglot), active, owner Instructor 3.
   - Retain `Legacy` course for historical compatibility.
   - Enable all 5 features for each course in `public.course_features`.
   - Add student and instructor memberships to all courses in `public.course_memberships`.
3. **Assignments (LeetCode Easy):**
   - **Course A (Python):**
     1. *Two Sum* (Python) — Find two indices adding to target.
     2. *Valid Palindrome* (Python) — Alphanumeric palindrome check ignoring case.
     3. *Best Time to Buy and Sell Stock* (Python) — Maximize profit from stock prices.
   - **Course B (Java):**
     1. *Valid Parentheses* (Java) — Check balanced brackets.
     2. *Roman to Integer* (Java) — Parse Roman numeral to integer.
     3. *Binary Search* (Java) — O(log n) element lookup in sorted array.
   - **Course C (Polyglot):**
     1. *Palindrome Number* (Python) — Integer palindrome check without converting to string.
     2. *Fizz Buzz* (Java) — Generate FizzBuzz sequence up to n.
     3. *Contains Duplicate* (Python) — Array duplicate detection.
4. **Test Cases & Rubrics:**
   - Each assignment receives 3 to 4 well-structured test cases in `assignment_practice_sets` and drafts with deterministic stdin/stdout.
   - Rubrics in `assignment_rubrics` defining criteria for Correctness, Edge Cases, and Efficiency/Code Quality.
5. **Submissions, Grades, & Activity:**
   - Multi-student submissions with valid solutions demonstrating passes and edge-case revisions.
   - Grades with realistic scores and feedback contributing to XP awards and leaderboard rankings.
   - Forum threads and replies per course discussing algorithms, edge cases, and best practices.
6. **Documentation:**
   - Update `supabase/README.md` to document the seeded credentials (`password`), courses, and assignment details.

