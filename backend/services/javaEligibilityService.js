const { spawn } = require('child_process');
const path = require('path');

// Absolute path to compiled Java classes (configurable via environment variable)
const JAVA_BIN_DIR = process.env.JAVA_BIN_DIR || path.resolve(__dirname, '../../java/bin');
const JAVA_TIMEOUT_MS = 5000;

/**
 * Pure JavaScript fallback evaluation logic.
 * Guarantees zero downtime and 100% reliability if Java process fails or times out.
 */
function evaluateFallback(job, student, studentSkills = []) {
  const reasons = [];
  const missingRequirements = [];

  // 1. CGPA Check
  const jobMinCgpa = parseFloat(job.minimum_cgpa !== undefined ? job.minimum_cgpa : job.minimumCgpa || 0);
  const studentCgpa = parseFloat(student.cgpa !== undefined ? student.cgpa : 0);

  if (studentCgpa >= jobMinCgpa) {
    reasons.push(
      `CGPA requirement satisfied (Minimum required: ${jobMinCgpa.toFixed(2)}, Student CGPA: ${studentCgpa.toFixed(2)})`
    );
  } else {
    missingRequirements.push(
      `Minimum CGPA required is ${jobMinCgpa.toFixed(2)}, but student CGPA is ${studentCgpa.toFixed(2)}.`
    );
  }

  // 2. Backlogs Check
  const jobMaxBacklogs = parseInt(job.maximum_backlogs !== undefined ? job.maximum_backlogs : job.maximumBacklogs || 0, 10);
  const studentBacklogs = parseInt(student.backlogs !== undefined ? student.backlogs : 0, 10);

  if (studentBacklogs <= jobMaxBacklogs) {
    reasons.push(
      `Backlog requirement satisfied (Max allowed: ${jobMaxBacklogs}, Student backlogs: ${studentBacklogs})`
    );
  } else {
    missingRequirements.push(
      `Maximum backlogs allowed is ${jobMaxBacklogs}, but student has ${studentBacklogs} backlog(s).`
    );
  }

  // 3. Branch Check
  const eligibleBranchStr = (job.eligible_branch !== undefined ? job.eligible_branch : job.eligibleBranch) || 'All';
  const allowedBranches = eligibleBranchStr.split(',').map((b) => b.trim().toUpperCase());
  const studentBranch = (student.branch ? student.branch.trim() : '').toUpperCase();

  if (allowedBranches.includes('ALL') || allowedBranches.includes(studentBranch)) {
    reasons.push(
      `Branch requirement satisfied (Eligible: ${eligibleBranchStr}, Student Branch: ${student.branch || ''})`
    );
  } else {
    missingRequirements.push(
      `Eligible branch(es): ${eligibleBranchStr}, but student branch is ${student.branch || ''}.`
    );
  }

  // 4. Graduation Year Check (if job specifies graduation_year > 0)
  const jobGradYear = parseInt(job.graduation_year !== undefined ? job.graduation_year : job.graduationYear || 0, 10);
  const studentGradYear = parseInt(student.graduation_year !== undefined ? student.graduation_year : student.graduationYear || 0, 10);

  if (jobGradYear > 0) {
    if (studentGradYear === jobGradYear) {
      reasons.push(
        `Graduation year requirement satisfied (Eligible Batch: ${jobGradYear}, Student Batch: ${studentGradYear})`
      );
    } else {
      missingRequirements.push(
        `Eligible graduation year is ${jobGradYear}, but student graduation year is ${studentGradYear || 'unspecified'}.`
      );
    }
  }

  // 5. Skills Check (if job has required skills)
  const reqSkillsRaw = job.requiredSkills || job.required_skills || [];
  const reqSkillsList = Array.isArray(reqSkillsRaw)
    ? reqSkillsRaw
    : typeof reqSkillsRaw === 'string' && reqSkillsRaw.trim().length > 0
    ? reqSkillsRaw.split(',')
    : [];

  if (reqSkillsList.length > 0) {
    const studentSkillsLower = new Set(
      (Array.isArray(studentSkills) ? studentSkills : (student.skills || []))
        .map((s) => (s ? String(s).trim().toLowerCase() : ''))
        .filter(Boolean)
    );

    const missingSkills = [];
    for (const req of reqSkillsList) {
      const cleanReq = req ? String(req).trim() : '';
      if (cleanReq && !studentSkillsLower.has(cleanReq.toLowerCase())) {
        if (!missingSkills.includes(cleanReq)) {
          missingSkills.push(cleanReq);
        }
      }
    }

    if (missingSkills.length === 0) {
      reasons.push('All required technical skills satisfied.');
    } else {
      for (const m of missingSkills) {
        missingRequirements.push(`Missing required technical skill: ${m}`);
      }
    }
  }

  const isEligible = missingRequirements.length === 0;

  return {
    isEligible,
    eligible: isEligible,
    reasons,
    missingRequirements,
    engine: 'JavaScript Fallback Engine'
  };
}

/**
 * Spawns the Java Eligibility Engine child process to evaluate eligibility.
 *
 * @param {Object} job - Job record containing criteria (minimum_cgpa, eligible_branch, maximum_backlogs, etc.)
 * @param {Object} student - Student record containing academic profile (cgpa, branch, backlogs)
 * @param {Array<string>} [studentSkills=[]] - Array of technical skills possessed by the student
 * @returns {Promise<Object>} Eligibility result object { isEligible, eligible, reasons, missingRequirements, engine }
 */
function evaluateWithJava(job, student, studentSkills = []) {
  return new Promise((resolve) => {
    // 1. Prepare JSON input payload conforming to Java SimpleJsonParser / EligibilityInput
    const payload = {
      student: {
        cgpa: parseFloat(student.cgpa !== undefined ? student.cgpa : 0),
        backlogs: parseInt(student.backlogs !== undefined ? student.backlogs : 0, 10),
        branch: student.branch || '',
        graduationYear: parseInt(student.graduation_year !== undefined ? student.graduation_year : student.graduationYear || 0, 10),
        skills: Array.isArray(studentSkills) && studentSkills.length > 0
          ? studentSkills
          : (Array.isArray(student.skills) ? student.skills : [])
      },
      job: {
        minimumCgpa: parseFloat(job.minimum_cgpa !== undefined ? job.minimum_cgpa : job.minimumCgpa || 0),
        maximumBacklogs: parseInt(job.maximum_backlogs !== undefined ? job.maximum_backlogs : job.maximumBacklogs || 0, 10),
        eligibleBranch: job.eligible_branch !== undefined ? job.eligible_branch : job.eligibleBranch || 'All',
        graduationYear: parseInt(job.graduation_year !== undefined ? job.graduation_year : job.graduationYear || 0, 10),
        requiredSkills: Array.isArray(job.requiredSkills)
          ? job.requiredSkills
          : (job.required_skills
              ? (Array.isArray(job.required_skills) ? job.required_skills : String(job.required_skills).split(',').map(s => s.trim()).filter(Boolean))
              : [])
      }
    };

    let resolved = false;
    let stdoutData = '';
    let stderrData = '';

    // 2. Spawn Java child process
    const child = spawn('java', ['-cp', JAVA_BIN_DIR, 'eligibility.Main']);

    // 3. Set safety timeout
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn('[JavaEligibilityService] Java process timed out after ' + JAVA_TIMEOUT_MS + 'ms. Executing fallback.');
        try {
          child.kill('SIGTERM');
        } catch (ignored) {}
        resolve(evaluateFallback(job, student, studentSkills));
      }
    }, JAVA_TIMEOUT_MS);

    // 4. Capture stdout and stderr
    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    // 5. Handle errors during spawn
    child.on('error', (err) => {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        console.warn('[JavaEligibilityService] Java spawn failed (' + err.message + '). Executing fallback.');
        resolve(evaluateFallback(job, student, studentSkills));
      }
    });

    // 6. Handle process completion
    child.on('close', (code) => {
      clearTimeout(timer);
      if (resolved) return;
      resolved = true;

      if (code !== 0) {
        console.warn('[JavaEligibilityService] Java process exited with code ' + code + ': ' + stderrData.trim() + '. Executing fallback.');
        return resolve(evaluateFallback(job, student, studentSkills));
      }

      try {
        const result = JSON.parse(stdoutData.trim());
        const isEligible = result.eligible === true;
        resolve({
          isEligible,
          eligible: isEligible,
          reasons: Array.isArray(result.reasons) ? result.reasons : [],
          missingRequirements: Array.isArray(result.missingRequirements) ? result.missingRequirements : [],
          engine: 'Java SE Eligibility Engine'
        });
      } catch (parseErr) {
        console.warn('[JavaEligibilityService] Failed to parse Java JSON output: ' + stdoutData + '. Executing fallback.');
        resolve(evaluateFallback(job, student, studentSkills));
      }
    });

    // 7. Pipe payload to stdin
    try {
      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    } catch (writeErr) {
      clearTimeout(timer);
      if (!resolved) {
        resolved = true;
        console.warn('[JavaEligibilityService] Failed to write to Java stdin: ' + writeErr.message + '. Executing fallback.');
        resolve(evaluateFallback(job, student, studentSkills));
      }
    }
  });
}

module.exports = {
  evaluateWithJava,
  evaluateFallback,
  JAVA_BIN_DIR
};
