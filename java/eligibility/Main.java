package eligibility;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/**
 * Command-line entry point for the Java Eligibility Engine.
 * Reads JSON payload from System.in, computes eligibility, and writes JSON to System.out.
 */
public class Main {

    @SuppressWarnings("unchecked")
    public static void main(String[] args) {
        try {
            // 1. Read input from stdin
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append("\n");
            }

            String inputJson = sb.toString().trim();
            if (inputJson.isEmpty()) {
                System.err.println("Eligibility Engine: Empty input stream.");
                EligibilityResult errorResult = new EligibilityResult();
                errorResult.addMissingRequirement("Empty input received.");
                errorResult.setEligible(false);
                System.out.println(errorResult.toJson());
                System.out.flush();
                return;
            }

            // 2. Parse JSON input
            Object parsed = SimpleJsonParser.parse(inputJson);
            if (!(parsed instanceof Map)) {
                System.err.println("Eligibility Engine: Expected root JSON object.");
                EligibilityResult errorResult = new EligibilityResult();
                errorResult.addMissingRequirement("Invalid JSON root structure.");
                errorResult.setEligible(false);
                System.out.println(errorResult.toJson());
                System.out.flush();
                return;
            }

            Map<String, Object> root = (Map<String, Object>) parsed;
            Map<String, Object> studentMap = (Map<String, Object>) SimpleJsonParser.getAny(root, "student", "studentData");
            Map<String, Object> jobMap = (Map<String, Object>) SimpleJsonParser.getAny(root, "job", "jobData");

            if (studentMap == null || jobMap == null) {
                System.err.println("Eligibility Engine: Missing 'student' or 'job' objects.");
                EligibilityResult errorResult = new EligibilityResult();
                errorResult.addMissingRequirement("Missing student or job data in payload.");
                errorResult.setEligible(false);
                System.out.println(errorResult.toJson());
                System.out.flush();
                return;
            }

            // 3. Extract Student Data (supporting both camelCase and snake_case)
            double cgpa = SimpleJsonParser.getDouble(studentMap, 0.0, "cgpa", "student_cgpa");
            int backlogs = SimpleJsonParser.getInt(studentMap, 0, "backlogs", "student_backlogs");
            String branch = SimpleJsonParser.getString(studentMap, "", "branch", "student_branch");
            int studentGradYear = SimpleJsonParser.getInt(studentMap, 0, "graduationYear", "graduation_year", "passing_year", "batch");
            List<String> skills = SimpleJsonParser.getStringList(studentMap, "skills", "student_skills", "skillNames");

            EligibilityInput.StudentData studentData = new EligibilityInput.StudentData(cgpa, backlogs, branch, studentGradYear, skills);

            // 4. Extract Job Data (supporting both camelCase and snake_case)
            double minCgpa = SimpleJsonParser.getDouble(jobMap, 0.0, "minimumCgpa", "minimum_cgpa", "min_cgpa", "cgpa");
            int maxBacklogs = SimpleJsonParser.getInt(jobMap, 0, "maximumBacklogs", "maximum_backlogs", "max_backlogs", "backlogs");
            String eligibleBranch = SimpleJsonParser.getString(jobMap, "", "eligibleBranch", "eligible_branch", "branch");
            int jobGradYear = SimpleJsonParser.getInt(jobMap, 0, "graduationYear", "graduation_year", "batch", "passing_year");
            List<String> requiredSkills = SimpleJsonParser.getStringList(jobMap, "requiredSkills", "required_skills", "skills");

            EligibilityInput.JobData jobData = new EligibilityInput.JobData(minCgpa, maxBacklogs, eligibleBranch, jobGradYear, requiredSkills);

            // 5. Evaluate Eligibility
            EligibilityInput input = new EligibilityInput(studentData, jobData);
            EligibilityResult result = EligibilityEngine.evaluate(input);

            // 6. Write JSON to stdout
            System.out.println(result.toJson());
            System.out.flush();

        } catch (Exception e) {
            System.err.println("Eligibility Engine Error: " + e.getMessage());
            EligibilityResult errRes = new EligibilityResult();
            errRes.addMissingRequirement("Evaluation execution error: " + e.getMessage());
            errRes.setEligible(false);
            System.out.println(errRes.toJson());
            System.out.flush();
        }
    }
}
