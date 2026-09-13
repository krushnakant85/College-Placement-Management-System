package eligibility;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lightweight, zero-dependency JSON parser written in standard Java SE.
 */
public class SimpleJsonParser {

    private final String src;
    private int pos = 0;

    public SimpleJsonParser(String src) {
        this.src = src != null ? src.trim() : "";
    }

    public static Object parse(String json) {
        if (json == null || json.trim().isEmpty()) return null;
        SimpleJsonParser parser = new SimpleJsonParser(json);
        return parser.parseValue();
    }

    private Object parseValue() {
        skipWhitespace();
        if (pos >= src.length()) return null;

        char c = src.charAt(pos);
        if (c == '{') {
            return parseObject();
        } else if (c == '[') {
            return parseArray();
        } else if (c == '"') {
            return parseString();
        } else if (c == 't' || c == 'T') {
            return parseLiteral("true", Boolean.TRUE);
        } else if (c == 'f' || c == 'F') {
            return parseLiteral("false", Boolean.FALSE);
        } else if (c == 'n' || c == 'N') {
            return parseLiteral("null", null);
        } else if (c == '-' || Character.isDigit(c)) {
            return parseNumber();
        }
        throw new IllegalArgumentException("Unexpected character at position " + pos + ": " + c);
    }

    private Map<String, Object> parseObject() {
        Map<String, Object> map = new HashMap<>();
        pos++; // Skip '{'
        skipWhitespace();

        if (pos < src.length() && src.charAt(pos) == '}') {
            pos++;
            return map;
        }

        while (pos < src.length()) {
            skipWhitespace();
            if (pos >= src.length()) break;

            if (src.charAt(pos) != '"') {
                throw new IllegalArgumentException("Expected string key in object at pos " + pos);
            }
            String key = parseString();
            skipWhitespace();

            if (pos >= src.length() || src.charAt(pos) != ':') {
                throw new IllegalArgumentException("Expected ':' after key at pos " + pos);
            }
            pos++; // Skip ':'
            skipWhitespace();

            Object value = parseValue();
            map.put(key, value);

            skipWhitespace();
            if (pos < src.length() && src.charAt(pos) == ',') {
                pos++; // Skip ','
                skipWhitespace();
            } else if (pos < src.length() && src.charAt(pos) == '}') {
                pos++; // Skip '}'
                break;
            } else {
                break;
            }
        }
        return map;
    }

    private List<Object> parseArray() {
        List<Object> list = new ArrayList<>();
        pos++; // Skip '['
        skipWhitespace();

        if (pos < src.length() && src.charAt(pos) == ']') {
            pos++;
            return list;
        }

        while (pos < src.length()) {
            skipWhitespace();
            if (pos >= src.length()) break;

            Object item = parseValue();
            list.add(item);

            skipWhitespace();
            if (pos < src.length() && src.charAt(pos) == ',') {
                pos++; // Skip ','
                skipWhitespace();
            } else if (pos < src.length() && src.charAt(pos) == ']') {
                pos++; // Skip ']'
                break;
            } else {
                break;
            }
        }
        return list;
    }

    private String parseString() {
        if (pos >= src.length() || src.charAt(pos) != '"') {
            throw new IllegalArgumentException("Expected string quote at pos " + pos);
        }
        pos++; // Skip opening quote

        StringBuilder sb = new StringBuilder();
        while (pos < src.length()) {
            char c = src.charAt(pos++);
            if (c == '"') {
                return sb.toString();
            } else if (c == '\\') {
                if (pos >= src.length()) break;
                char esc = src.charAt(pos++);
                switch (esc) {
                    case '"': sb.append('"'); break;
                    case '\\': sb.append('\\'); break;
                    case '/': sb.append('/'); break;
                    case 'b': sb.append('\b'); break;
                    case 'f': sb.append('\f'); break;
                    case 'n': sb.append('\n'); break;
                    case 'r': sb.append('\r'); break;
                    case 't': sb.append('\t'); break;
                    case 'u':
                        if (pos + 4 <= src.length()) {
                            String hex = src.substring(pos, pos + 4);
                            sb.append((char) Integer.parseInt(hex, 16));
                            pos += 4;
                        }
                        break;
                    default: sb.append(esc); break;
                }
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    private Object parseLiteral(String literal, Object value) {
        int len = literal.length();
        if (pos + len <= src.length()) {
            String sub = src.substring(pos, pos + len);
            if (sub.equalsIgnoreCase(literal)) {
                pos += len;
                return value;
            }
        }
        throw new IllegalArgumentException("Unknown literal at pos " + pos);
    }

    private Object parseNumber() {
        int start = pos;
        if (src.charAt(pos) == '-') pos++;
        while (pos < src.length() && (Character.isDigit(src.charAt(pos)) || src.charAt(pos) == '.' || src.charAt(pos) == 'e' || src.charAt(pos) == 'E' || src.charAt(pos) == '+')) {
            pos++;
        }
        String numStr = src.substring(start, pos);
        if (numStr.contains(".") || numStr.contains("e") || numStr.contains("E")) {
            try {
                return Double.parseDouble(numStr);
            } catch (NumberFormatException e) {
                return 0.0;
            }
        } else {
            try {
                return Long.parseLong(numStr);
            } catch (NumberFormatException e) {
                return 0L;
            }
        }
    }

    private void skipWhitespace() {
        while (pos < src.length() && Character.isWhitespace(src.charAt(pos))) {
            pos++;
        }
    }

    public static Object getAny(Map<String, Object> map, String... keys) {
        if (map == null) return null;
        for (String k : keys) {
            if (map.containsKey(k) && map.get(k) != null) {
                return map.get(k);
            }
        }
        for (String k : keys) {
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(k) && entry.getValue() != null) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    public static double getDouble(Map<String, Object> map, double defaultVal, String... keys) {
        Object val = getAny(map, keys);
        if (val instanceof Number) {
            return ((Number) val).doubleValue();
        } else if (val instanceof String) {
            try {
                return Double.parseDouble(((String) val).trim());
            } catch (Exception ignored) {}
        }
        return defaultVal;
    }

    public static int getInt(Map<String, Object> map, int defaultVal, String... keys) {
        Object val = getAny(map, keys);
        if (val instanceof Number) {
            return ((Number) val).intValue();
        } else if (val instanceof String) {
            try {
                return Integer.parseInt(((String) val).trim());
            } catch (Exception ignored) {}
        }
        return defaultVal;
    }

    public static String getString(Map<String, Object> map, String defaultVal, String... keys) {
        Object val = getAny(map, keys);
        if (val != null) {
            return val.toString();
        }
        return defaultVal;
    }

    @SuppressWarnings("unchecked")
    public static List<String> getStringList(Map<String, Object> map, String... keys) {
        Object val = getAny(map, keys);
        List<String> result = new ArrayList<>();
        if (val instanceof List) {
            for (Object item : (List<?>) val) {
                if (item != null) {
                    result.add(item.toString().trim());
                }
            }
        } else if (val instanceof String) {
            String s = (String) val;
            if (!s.trim().isEmpty()) {
                String[] parts = s.split(",");
                for (String p : parts) {
                    if (!p.trim().isEmpty()) {
                        result.add(p.trim());
                    }
                }
            }
        }
        return result;
    }
}
