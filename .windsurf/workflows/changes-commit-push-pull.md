---
description: whenever the user is asking ai to commit, push code or even make a pull request
auto_execution_mode: 1
---

### **1. Repository Status**

1.1. Run `git status --short`.

If no changes → **terminate** with message `"No diffs to commit."`

1.2. Run `git rev-parse --abbrev-ref HEAD`.

If branch = `main` or `master`:

- **Understand** this is unsafe for direct commits.

- Infer a new branch name from the current task title:

→ lowercase

→ spaces → hyphens

→ prefix with `feat/`, `fix/`, or `chore/`

- Execute:

`git checkout -b <inferred-branch>`

- example `git checkout -b feat/native-termina` -> inferred from task `add native terminal support`

1.3. **Understand**: from now on, all commits belong to that branch.

---

### **2. Diff Understanding**

2.1. Run `git diff --no-color` (or `git diff --cached` if staged).

2.2. For each file diff:

- If >300 lines → **do not output or store the full diff**.
- **Mentally analyze** first 150 + last 150 lines.
- **Understand** that middle content exists but is omitted for stability.
- Continue processing normally using semantic patterns.

2.3. Extract metadata:

- File path
- LOC added/deleted
- Change type (A/M/D/R)

2.4. Classify file type:

| Type | Rule |
| --- | --- |
| source | `/src/`, `.js`, `.ts`, `.py`, `.rs`, `.cpp` |
| test | `/tests/`, `.spec.`, `.test.` |
| docs | `/docs/`, `.md`, `.rst` |
| config | `/config/`, `.json`, `.yaml`, `.toml` |
| ci | `.github/`, `.workflow/`, `.gitlab-ci.yml` |

---

### **3. Smart Grouping**

3.1. Group files by logical scope (feature name, folder, or module).

3.2. **Infer group purpose**:

- source + test + docs → **feature**
- config only → **chore**
- ci scripts → **ci**
- docs only → **docs**
- test only → **test**
- otherwise → **refactor**

3.3. Sort by importance → feat → fix → refactor → test → docs → chore → ci.

---

### **4. Staging**

4.1. For each group → `git add <group-files>`.

4.2. Verify with `git diff --cached --name-only`.

4.3. **If mismatch** → restage until verified clean.

---

### **5. Commit Generation**

5.1. Determine commit prefix from group type:

| Group | Prefix |
| --- | --- |
| feature | feat |
| fix | fix |
| refactor | refactor |
| test | test |
| docs | docs |
| chore | chore |
| ci | ci |

5.2. Determine scope → use directory or module name.

Example: `terminal`, `auth`, `parser`.

5.3. Generate commit title:

```
<type>(<scope>): <summary>

```

5.4. Generate commit body:

- Summarize semantic intent (not just diff).
- Mention what changed and why.
- Include stats: `+x / -y` lines, `n` files.
- If applicable, mention issue numbers.

5.5. Execute commit:

```
git commit -m "<title>" -m "<body>"

```

5.6. Verify last commit via:

```
git log -1 --pretty=oneline

```

If failed → retry once safely.

---

### **6. Safety Validation**

6.1. Run `git status --short`.

If dirty → warn and skip auto-fix.

6.2. Ensure no untracked files before proceeding to push.

---

### **7. Smart Push**

7.1. Detect remote:

```
git remote get-url origin

```

If not found → **skip PR step** and stop after commit.

If found → proceed.

7.2. Detect if branch exists on remote:

```
git ls-remote --heads origin <branch>

```

If not →

`git push --set-upstream origin <branch>`

Else →

`git push origin HEAD`

if user skipped this phase, it is okay, he does not want to push the code yet

7.3. **Understand**: remote push success means branch is now synced.

---

### **8. Pull Request Creation (Conditional)**

8.1. **Condition:**

If remote host includes `github.com`, **then continue**, else skip.

8.2. **Understand** how to prepare PR:

- Title = same as last commit title.
- Body = commit body + diff summary.
- Target branch = `main` or `master`.

8.3. Execute:

```
gh pr create --fill --base main --head <branch> --title "<title>" --body "<body>"

```

If `gh` command is not available → **skip PR creation** silently.

8.4. **Understand**: if PR already exists → `gh` will show a message; do not retry or crash.

---

### **9. Stability Rules**

- **Never output or render full diffs >300 LOC**.
- **Never push directly to `main` or `master`.**
- **Never crash** on any git or GitHub CLI error; log and continue safely.
- **If any subprocess fails twice** → abort workflow gracefully with diagnostic info.
- **If partial diff understanding occurs** → still reason with available lines.
- **If gh is unavailable** → skip PR creation but note `"gh not found, PR skipped."`

---

### **10. Completion**

10.1. Output minimal safe summary:

```
✅ Committed and pushed branch <branch>.
✅ Pull Request created (if GitHub available).

```

10.2. **Understand**: workflow is finished, state is clean, and AI can continue next task.

---