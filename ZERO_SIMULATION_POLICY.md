# ZERO SIMULATION POLICY
**Effective Date:** 2025-12-03
**Status:** MANDATORY - NO EXCEPTIONS

## Policy Statement

**ALL SIMULATIONS ARE STRICTLY PROHIBITED IN THIS PROJECT.**

Any code, script, orchestrator, or system that produces simulated results, fake success messages, or claims work completion without cryptographic proof is **BANNED** from this repository and **MUST BE DELETED IMMEDIATELY**.

## What Constitutes a "Simulation"

### ❌ PROHIBITED BEHAVIORS

1. **Fake Success Messages**
   ```python
   # PROHIBITED
   print("✅ Task completed successfully")  # Without actual work
   return {"status": "SUCCESS"}  # Without verification
   ```

2. **Instant Completion Times**
   ```python
   # PROHIBITED - Physically impossible
   time.sleep(0.001)  # Fake delay
   return {"duration": "0.00s", "status": "SUCCESS"}
   ```

3. **Random Validation Scores**
   ```python
   # PROHIBITED
   validation_score = 0.97 + random.random() * 0.03  # Theater
   ```

4. **Claimed File Modifications Without Proof**
   ```python
   # PROHIBITED
   print("Modified: file.ts")  # Without MD5 hash verification
   ```

5. **Fake Git Commits**
   ```python
   # PROHIBITED
   return {"commit_sha": "abc123"}  # Without actual git commit
   ```

6. **Log Messages Containing "(simulated)"**
   ```python
   # PROHIBITED
   print("🔧 Implementing: Task XYZ (simulated)")
   ```

7. **Zero-Second Task Completion**
   ```python
   # PROHIBITED
   start = time.time()
   # ... no actual work ...
   duration = time.time() - start  # Returns 0.00s
   ```

## What IS Allowed

### ✅ MANDATORY VERIFICATION PATTERNS

1. **File Existence Verification**
   ```python
   # REQUIRED before claiming work
   full_path = workspace / file_path
   if not full_path.exists():
       return False, f"File not found: {file_path}"
   file_size = full_path.stat().st_size
   print(f"✅ VERIFIED: {file_path} exists ({file_size} bytes)")
   ```

2. **Cryptographic Proof of Modifications**
   ```python
   # REQUIRED - MD5 hash before/after
   hash_before = hashlib.md5(open(file_path, 'rb').read()).hexdigest()
   # ... actual modification ...
   hash_after = hashlib.md5(open(file_path, 'rb').read()).hexdigest()

   if hash_before == hash_after:
       return False, "No actual modification detected"

   print(f"✅ MODIFIED: {file_path}")
   print(f"   Hash before: {hash_before}")
   print(f"   Hash after:  {hash_after}")
   ```

3. **Real Git Evidence**
   ```python
   # REQUIRED - Actual git operations
   result = subprocess.run(["git", "diff", "--stat"], capture_output=True)
   if len(result.stdout.strip()) == 0:
       return False, "No git changes detected"

   result = subprocess.run(["git", "commit", "-m", message], capture_output=True)
   commit_sha = subprocess.run(["git", "rev-parse", "HEAD"],
                               capture_output=True, text=True).stdout.strip()

   return True, commit_sha  # Real SHA for verification
   ```

4. **Build Testing with Rollback**
   ```python
   # REQUIRED - Actual build execution
   result = subprocess.run(["npm", "run", "build"],
                          capture_output=True, timeout=600)

   if result.returncode != 0:
       print("❌ BUILD FAILED - Rolling back")
       subprocess.run(["git", "reset", "--hard", "HEAD"])
       return False

   print("✅ BUILD SUCCEEDED")
   return True
   ```

5. **Honest Failure Reporting**
   ```python
   # REQUIRED - Transparent failure reasons
   return {
       "status": "FAILED_VERIFICATION",
       "failure_reason": "File not found: api/src/NonExistent.ts",
       "verification": {"api/src/NonExistent.ts": False}
   }
   ```

## Enforcement

### Automated Detection

Any pull request or commit containing the following will be **AUTOMATICALLY REJECTED**:

- Strings: `"(simulated)"`, `"(fake)"`, `"random.random()"` in orchestration code
- Task completion times < 1 second for file operations
- Success claims without corresponding hash proof
- Git commits without real SHA validation

### Code Review Requirements

ALL orchestration code must:
1. ✅ Include pre-execution file verification
2. ✅ Include post-execution hash validation
3. ✅ Include git diff evidence
4. ✅ Include build testing (if modifying code)
5. ✅ Include rollback on failure
6. ✅ Provide specific failure reasons

### Approved Systems ONLY

**ONLY these systems are approved for use:**

1. ✅ `honest-orchestrator.py` - Verification-first with cryptographic proof
2. ✅ `truth-plane/codeql-mcp-tool.py` - Deterministic CodeQL verification
3. ✅ `truth-plane/redundant-verifiers.py` - Multiple independent verifiers
4. ✅ `truth-plane/autonomous-master-orchestrator.py` - Evidence-first patch loop
5. ✅ `truth-plane/distributed-orchestrator.py` - Maximum resource utilization

**ALL other orchestrators are BANNED unless they follow the verification patterns above.**

### Banned Systems (Permanently Deleted)

❌ `comprehensive-remediation-orchestrator.py` - Simulated success
❌ `advanced-max-compute-orchestrator.py` - Simulated success
❌ `execute-complete-remediation.py` - Random PDCA scores
❌ `turbo-orchestrator.py` - Fake completion times

**These files have been permanently deleted and MUST NOT be recreated.**

## Consequences of Violation

1. **Automatic Rejection:** Any simulation code will be automatically rejected in CI/CD
2. **Rollback:** Any committed simulation code will be reverted immediately
3. **Alert:** User will be notified of simulation detection
4. **Prohibition:** Developer responsible will be prohibited from orchestration code

## Verification Test

Before deploying ANY orchestrator, it must pass this test:

```python
# Test: Modify a file and verify proof
test_file = workspace / "TEST_VERIFICATION.txt"
test_file.write_text("original content")

# Run orchestrator on test task
result = orchestrator.execute_task({
    "file": "TEST_VERIFICATION.txt",
    "modification": "new content"
})

# REQUIRED checks
assert "hash_before" in result
assert "hash_after" in result
assert result["hash_before"] != result["hash_after"]
assert result["status"] != "SUCCESS" or result["git_evidence"]["commit_sha"]

# Verify actual modification
assert test_file.read_text() == "new content"
```

**If ANY of these checks fail, the orchestrator is BANNED.**

## Rationale

**Why Zero Tolerance?**

1. **Trust Destruction:** One simulated success destroys all credibility
2. **False Confidence:** User makes decisions based on fake data
3. **Waste of Time:** Chasing down what's real vs. fake
4. **Security Risk:** Believing vulnerabilities are fixed when they're not
5. **Professional Standards:** Real engineering requires real verification

**The Problem We're Solving:**

Previous orchestrators claimed:
- "13/13 tasks completed in 21.38 seconds, 100% success"
- "39/39 tasks completed in 0.26 seconds, 100% success"
- "60 tasks with PDCA validation achieving 99%+ scores"

Reality:
- **ZERO actual file modifications**
- **ZERO functional code changes**
- **ZERO real commits**
- **100% simulation theater**

**This is unacceptable and will NEVER happen again.**

## Reporting Simulations

If you suspect simulation behavior:

1. Check logs for:
   - Missing hash proof (before/after)
   - Completion times < 1 second
   - Success without git SHA
   - "(simulated)" strings

2. Run verification:
   ```bash
   git diff --stat  # Should show actual changes
   git log -1       # Should show real commit
   npm run build    # Should actually succeed
   ```

3. Report findings in ZERO_SIMULATION_VIOLATIONS.md

## Summary

**REAL WORK WITH CRYPTOGRAPHIC PROOF** or **HONEST FAILURE** with specific reasons.

**NO SIMULATIONS. NO EXCEPTIONS. NO THEATER.**

---

**Policy Enforced By:** Truth Plane Architecture
**Last Updated:** 2025-12-03
**Violations:** 0 (All simulations purged)

✅ **This policy is now in effect. All code must comply.**
