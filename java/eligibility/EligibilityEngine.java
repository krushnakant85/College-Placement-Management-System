package eligibility;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Pure, deterministic Eligibility Evaluation Engine.
 * Responsibilities:
 * 1. Evaluate Minimum CGPA criterion.
 * 2. Evaluate Maximum Backlogs criterion.
 * 3. Evaluate Eligible Academic Branch(es).
 * 4. Evaluate Required Technical Skills (case-insensitive & trimmed).
 * 5. Collect all failed criteria without halting at the first failure.
 */
public class EligibilityEngine {

    /**
     * Evaluate eligibility of a student against a job's specifications.
     *
     * @param input The EligibilityInput containing StudentData and JobData
     * @return EligibilityResult containing eligible boolean, missingRequirements, and satisfied reasons
     */
    public static EligibilityResult evaluate(EligibilityInput input) {
        EligibilityResult result = new EligibilityResult();

        if (input == null || input.getStudent() == null || input.getJob() == null) {
            result.addMissingRequirement("Missing student or job evaluation payload.");
            result.setEligible(false);
            return result;
        }

        EligibilityInput.StudentData student = input.getStudent();
        EligibilityInput.JobData job = input.getJob();

        // --------------------------------------------------------------------
        // 1. CGPA Check
        // --------------------------------------------------------------------
        double minCgpa = job.getMinimumCgpa();
        double studentCgpa = student.getCgpa();

        if (studentCgpa >= minCgpa) {
            result.addReason(String.format(
                "CGPA requirement satisfied (Minimum required: %.2f, Student CGPA: %.2f)",
                minCgpa, studentCgpa
            ));
        } else {
            result.addMissingRequirement(String.format(
                "Minimum CGPA required is %.2f, but student CGPA is %.2f.",
                minCgpa, studentCgpa
            ));
        }

        // --------------------------------------------------------------------
        // 2. Maximum Backlogs Check
        // --------------------------------------------------------------------
        int maxBacklogs = job.getMaximumBacklogs();
        int studentBacklogs = student.getBacklogs();

        if (studentBacklogs <= maxBacklogs) {
            result.addReason(String.format(
                "Backlog requirement satisfied (Max allowed: %d, Student backlogs: %d)",
                maxBacklogs, studentBacklogs
            ));
        } else {
            result.addMissingRequirement(String.format(
                "Maximum backlogs allowed is %d, but student has %d backlog(s).",
                maxBacklogs, studentBacklogs
            ));
        }

        // --------------------------------------------------------------------
        // 3. Eligible Branch Check (if specified)
        // --------------------------------------------------------------------
        String eligibleBranch = job.getEligibleBranch();
        if (eligibleBranch != null && !eligibleBranch.trim().isEmpty()) {
            String[] allowedBranches = eligibleBranch.split(",");
            boolean branchMatch = false;
            String studentBranch = student.getBranch() != null ? student.getBranch().trim().toUpperCase() : "";

            for (String b : allowedBranches) {
                String clean = b.trim().toUpperCase();
                if ("ALL".equals(clean) || clean.equals(studentBranch)) {
                    branchMatch = true;
                    break;
                }
            }

            if (branchMatch) {
                result.addReason(String.format(
                    "Branch requirement satisfied (Eligible: %s, Student Branch: %s)",
                    eligibleBranch, student.getBranch()
                ));
            } else {
                result.addMissingRequirement(String.format(
                    "Eligible branch(es): %s, but student branch is %s.",
                    eligibleBranch, student.getBranch()
                ));
            }
        }

        // --------------------------------------------------------------------
        // 4. Required Technical Skills Check (case-insensitive & trimmed)
        // --------------------------------------------------------------------
        List<String> requiredSkills = job.getRequiredSkills();
        if (requiredSkills != null && !requiredSkills.isEmpty()) {
            Set<String> studentSkillSet = new HashSet<>();
            if (student.getSkills() != null) {
                for (String s : student.getSkills()) {
                    if (s != null && !s.trim().isEmpty()) {
                        studentSkillSet.add(s.trim().toLowerCase());
                    }
                }
            }

            List<String> missingSkills = new ArrayList<>();
            for (String req : requiredSkills) {
                if (req != null && !req.trim().isEmpty()) {
                    String cleanReq = req.trim();
                    if (!studentSkillSet.contains(cleanReq.toLowerCase())) {
                        if (!missingSkills.contains(cleanReq)) {
                            missingSkills.add(cleanReq);
                        }
                    }
                }
            }

            if (missingSkills.isEmpty()) {
                result.addReason("All required technical skills satisfied.");
            } else {
                for (String missing : missingSkills) {
                    result.addMissingRequirement("Missing required skill: " + missing);
                }
            }
        }

        // --------------------------------------------------------------------
        // 5. Final Determination
        // --------------------------------------------------------------------
        result.setEligible(result.getMissingRequirements().isEmpty());

        return result;
    }
}
