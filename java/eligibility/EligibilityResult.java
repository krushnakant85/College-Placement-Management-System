package eligibility;

import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object representing the outcome of an eligibility evaluation.
 */
public class EligibilityResult {
    private boolean eligible;
    private List<String> missingRequirements;
    private List<String> reasons;

    public EligibilityResult() {
        this.eligible = true;
        this.missingRequirements = new ArrayList<>();
        this.reasons = new ArrayList<>();
    }

    public EligibilityResult(boolean eligible, List<String> missingRequirements, List<String> reasons) {
        this.eligible = eligible;
        this.missingRequirements = missingRequirements != null ? missingRequirements : new ArrayList<>();
        this.reasons = reasons != null ? reasons : new ArrayList<>();
    }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public List<String> getMissingRequirements() { return missingRequirements; }
    public void setMissingRequirements(List<String> missingRequirements) {
        this.missingRequirements = missingRequirements != null ? missingRequirements : new ArrayList<>();
    }

    public List<String> getReasons() { return reasons; }
    public void setReasons(List<String> reasons) {
        this.reasons = reasons != null ? reasons : new ArrayList<>();
    }

    public void addMissingRequirement(String req) {
        this.missingRequirements.add(req);
        this.eligible = false;
    }

    public void addReason(String reason) {
        this.reasons.add(reason);
    }

    /**
     * Serializes result to JSON string without external libraries.
     */
    public String toJson() {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"eligible\":").append(eligible).append(",");
        sb.append("\"missingRequirements\":[");
        for (int i = 0; i < missingRequirements.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escapeJson(missingRequirements.get(i))).append("\"");
        }
        sb.append("],");
        sb.append("\"reasons\":[");
        for (int i = 0; i < reasons.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escapeJson(reasons.get(i))).append("\"");
        }
        sb.append("]");
        sb.append("}");
        return sb.toString();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
