### ❌ DON'T - Unix-style command chaining on Windows

```bash
# WRONG - This fails on Windows PowerShell/CMD
command1 && command2 && command3

```

### ✅ DO - Use platform-appropriate separators

```powershell
# CORRECT for Windows PowerShell/CMD
command1; command2; command3

```

### 📋 EXPLANATION

- `&&` operator works on Unix/Linux/macOS bash shells ONLY
- Windows CMD and PowerShell use `;` for sequential command execution
- PowerShell also supports `|` for piping, but NOT `&&` for conditional execution
- **ALWAYS check the platform before suggesting command chains**

---

## 🖥️ PLATFORM DETECTION

### ❌ DON'T - Assume the operating system

```python
# WRONG - Hardcoding platform-specific commands
os.system("ls -la")  # Assumes Unix
os.system("rm -rf temp/")  # Assumes Unix

```

### ✅ DO - Detect platform first

```python
# CORRECT - Cross-platform approach
import platform
import os

current_os = platform.system()

if current_os == "Windows":
    os.system("dir")
    os.system("rmdir /s /q temp")
elif current_os in ["Linux", "Darwin"]:
    os.system("ls -la")
    os.system("rm -rf temp/")

```

### ✅ DO - Use Python's platform module directly

```python
import platform

# BEST - Use platform module directly in your Python code
current_os = platform.system()
print(f"Running on: {current_os}")

# Returns: 'Windows', 'Linux', or 'Darwin' (macOS)

```

### 📋 IMPORTANT NOTE FOR AI ASSISTANTS

**When checking platform from command line:**

- ❌ **DON'T** suggest: `os.popen('python -c "import platform; print(platform.system())"')`
- ❌ **DON'T** suggest: `subprocess.run(['python', '-c', '...'])`
- ✅ **DO** run the command directly: `python -c "import platform; print(platform.system())"`

**For AI assistants**: If you need to check the user's platform, instruct them to run:

```bash
python -c "import platform; print(platform.system())"

```

Then use the result they provide. Don't wrap it in Python subprocess calls.

---

## 📝 PYTHON COMMAND LENGTH

### ❌ DON'T - Execute long Python one-liners

```bash
# WRONG - Unreadable and error-prone
python -c "import json; import sys; data = json.loads(sys.stdin.read()); result = [item for item in data if item['status'] == 'active']; print(json.dumps(result, indent=2))"

```

### ✅ DO - Create temporary script files for complex operations

```python
# CORRECT - Create, execute, then cleanup
import tempfile
import os

script_content = """
import json
import sys

data = json.loads(sys.stdin.read())
result = [item for item in data if item['status'] == 'active']
print(json.dumps(result, indent=2))
"""

# Create temporary file
with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
    f.write(script_content)
    temp_script = f.name

try:
    # Execute the script
    os.system(f"python {temp_script}")
finally:
    # Cleanup
    os.remove(temp_script)

```

### 📋 RULE OF THUMB

- **One-liners**: Maximum 80 characters, simple operations only
- **Complex logic**: Always use temporary script files
- **Benefits**: Better debugging, error messages, and readability

---

## 🌐 NETWORK REQUESTS

### ❌ DON'T - Use shell commands for HTTP requests

```bash
# WRONG - Platform-dependent and unreliable
curl https://api.example.com/data
Invoke-WebRequest https://api.example.com/data  # PowerShell specific
wget https://api.example.com/data

```

### ✅ DO - Use Python's requests library

```python
# CORRECT - Cross-platform and reliable
import requests

try:
    response = requests.get('https://api.example.com/data', timeout=10)
    response.raise_for_status()
    data = response.json()
except requests.RequestException as e:
    print(f"Request failed: {e}")

```

### 📋 WHY?

- **Cross-platform**: Works on Windows, Linux, macOS without changes
- **Consistent**: Same behavior across all platforms
- **Error handling**: Better exception management
- **Pre-installed**: Python requests is widely available
- **Features**: Built-in timeout, retry logic, session management

---

## 💾 VARIABLE QUOTING IN SHELL

### ❌ DON'T - Leave variables unquoted

```bash
# WRONG - Breaks with spaces or special characters
FILE=/path/to/my file.txt
cat $FILE  # Fails!

```

### ✅ DO - Always quote variables

```bash
# CORRECT - Properly quoted
FILE="/path/to/my file.txt"
cat "$FILE"

# Use arrays for lists
FILES=("file1.txt" "file 2.txt" "file3.txt")
for file in "${FILES[@]}"; do
    process "$file"
done

```

---

## 🔍 CHECKING PREREQUISITES

### ❌ DON'T - Assume tools are installed

```bash
# WRONG - Fails if Docker isn't installed
docker run myimage

```

### ✅ DO - Verify prerequisites before execution

```bash
# CORRECT - Check before using
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

docker run myimage

```

```python
# Python equivalent
import shutil
import sys

if not shutil.which("docker"):
    print("Error: Docker is not installed", file=sys.stderr)
    sys.exit(1)

```

---

## 🏗️ ANTI-PATTERNS TO AVOID

### 1. ❌ SPAGHETTI CODE

**DON'T** write code without structure or planning

- Random files in random directories
- No clear program flow
- Tangled dependencies

**DO** plan architecture first, use modular design

### 2. ❌ GOLDEN HAMMER

**DON'T** use the same solution for every problem

- "I'll use regex for parsing XML/HTML/JSON"
- Over-reliance on one pattern or library

**DO** choose the right tool for each specific problem

### 3. ❌ BOAT ANCHOR (DEAD CODE)

**DON'T** leave unused code "just in case"

- Obsolete functions that "might be needed later"
- Commented-out code blocks

**DO** delete unused code (version control has your back)

### 4. ❌ COPY-PASTE PROGRAMMING

**DON'T** duplicate similar code across files

- Same logic repeated 10+ times
- Hard to maintain and update

**DO** create reusable functions and modules

## 📊 BEST PRACTICES SUMMARY

### ✅ ALWAYS DO:

1. **Detect the platform** before suggesting OS-specific commands
2. **Use Python standard library** for cross-platform operations (os, pathlib, subprocess)
3. **Create temp files** for complex Python operations instead of long one-liners
4. **Use Python requests library** instead of curl/wget/Invoke-WebRequest
5. **Add error handling** (try-except in Python, set -euo pipefail in bash)
6. **Quote all variables** in shell scripts: `"$VAR"` not `$VAR`
7. **Check prerequisites** before executing commands
8. **Use relative paths** with proper path joining (os.path.join or pathlib)
9. **Set proper permissions** for generated scripts
10. **Add cleanup handlers** for temporary files and resources

### ❌ NEVER DO:

1. **Use `&&` on Windows** - use `;` instead
2. **Use Unix commands on Windows** without platform check (ls, rm, cat, etc.)
3. **Use Windows commands on Unix** without platform check (dir, del, type, etc.)
4. **Execute long Python one-liners** - create temp script files
5. **Use curl/wget/Invoke-WebRequest** when Python requests is available
6. **Hardcode absolute paths** - use relative paths
7. **Leave variables unquoted** in shell scripts
8. **Assume tools are installed** - always check first
9. **Execute user input directly** - major security risk
10. **Use `shell=True`** in subprocess with user input