package eligibility;

import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object representing the input parameters for eligibility evaluation.
 */
public class EligibilityInput {
    private StudentData student;
    private JobData job;

    public static class StudentData {
        private double cgpa;
        private int backlogs;
        private String branch;
        private int graduationYear;
        private List<String> skills = new ArrayList<>();

        public StudentData() {}

        public StudentData(double cgpa, int backlogs, String branch, List<String> skills) {
            this(cgpa, backlogs, branch, 0, skills);
        }

        public StudentData(double cgpa, int backlogs, String branch, int graduationYear, List<String> skills) {
            this.cgpa = cgpa;
            this.backlogs = backlogs;
            this.branch = branch;
            this.graduationYear = graduationYear;
            if (skills != null) {
                this.skills = skills;
            }
        }

        public double getCgpa() { return cgpa; }
        public void setCgpa(double cgpa) { this.cgpa = cgpa; }

        public int getBacklogs() { return backlogs; }
        public void setBacklogs(int backlogs) { this.backlogs = backlogs; }

        public String getBranch() { return branch; }
        public void setBranch(String branch) { this.branch = branch; }

        public int getGraduationYear() { return graduationYear; }
        public void setGraduationYear(int graduationYear) { this.graduationYear = graduationYear; }

        public List<String> getSkills() { return skills; }
        public void setSkills(List<String> skills) {
            this.skills = skills != null ? skills : new ArrayList<>();
        }
    }

    public static class JobData {
        private double minimumCgpa;
        private int maximumBacklogs;
        private String eligibleBranch;
        private int graduationYear;
        private List<String> requiredSkills = new ArrayList<>();

        public JobData() {}

        public JobData(double minimumCgpa, int maximumBacklogs, String eligibleBranch, List<String> requiredSkills) {
            this(minimumCgpa, maximumBacklogs, eligibleBranch, 0, requiredSkills);
        }

        public JobData(double minimumCgpa, int maximumBacklogs, String eligibleBranch, int graduationYear, List<String> requiredSkills) {
            this.minimumCgpa = minimumCgpa;
            this.maximumBacklogs = maximumBacklogs;
            this.eligibleBranch = eligibleBranch;
            this.graduationYear = graduationYear;
            if (requiredSkills != null) {
                this.requiredSkills = requiredSkills;
            }
        }

        public double getMinimumCgpa() { return minimumCgpa; }
        public void setMinimumCgpa(double minimumCgpa) { this.minimumCgpa = minimumCgpa; }

        public int getMaximumBacklogs() { return maximumBacklogs; }
        public void setMaximumBacklogs(int maximumBacklogs) { this.maximumBacklogs = maximumBacklogs; }

        public String getEligibleBranch() { return eligibleBranch; }
        public void setEligibleBranch(String eligibleBranch) { this.eligibleBranch = eligibleBranch; }

        public int getGraduationYear() { return graduationYear; }
        public void setGraduationYear(int graduationYear) { this.graduationYear = graduationYear; }

        public List<String> getRequiredSkills() { return requiredSkills; }
        public void setRequiredSkills(List<String> requiredSkills) {
            this.requiredSkills = requiredSkills != null ? requiredSkills : new ArrayList<>();
        }
    }

    public EligibilityInput() {}

    public EligibilityInput(StudentData student, JobData job) {
        this.student = student;
        this.job = job;
    }

    public StudentData getStudent() { return student; }
    public void setStudent(StudentData student) { this.student = student; }

    public JobData getJob() { return job; }
    public void setJob(JobData job) { this.job = job; }
}
