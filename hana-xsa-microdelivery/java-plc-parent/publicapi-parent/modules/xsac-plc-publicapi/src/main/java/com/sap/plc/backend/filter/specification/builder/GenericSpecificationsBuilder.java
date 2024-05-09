package com.sap.plc.backend.filter.specification.builder;

import com.sap.plc.backend.exception.BadRequestException;
import com.sap.plc.backend.filter.specification.Expression;
import com.sap.plc.backend.filter.specification.GenericSpecification;
import com.sap.plc.backend.filter.specification.SearchCriteria;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Stack;
import java.util.regex.Matcher;

import static com.sap.plc.backend.util.GeneralUtils.COMPILED_SEARCH_FILTER_PATTERN;
import static com.sap.plc.backend.util.GeneralUtils.removeQuote;
import static com.sap.plc.backend.util.GeneralUtils.validateOperation;

public class GenericSpecificationsBuilder<TEntity> {

    public static final String AND = "AND";
    public static final String OR = "OR";

    public Specification<TEntity> build(String filter) {
        if (StringUtils.isBlank(filter)) {
            return null;
        }

        filter = filter.trim();

        if (filter.startsWith("[") && filter.endsWith("]") && filter.indexOf(']') == filter.length() - 1) {
            filter = filter.substring(1, filter.length() - 1);
        }

        Expression rootExpression = parsePrecedences(new Expression(null, filter, null));
        return parseExprTree(rootExpression);

    }

    public Specification<TEntity> build(String filter, Timestamp validAt) {
        Specification<TEntity> spec;

        if (validAt != null && !StringUtils.isBlank(filter)) {
            spec = build(filter);
            spec = spec.and(validitySpec(validAt));
            return spec;
        }

        if (validAt == null && !StringUtils.isBlank(filter)) {
            return this.build(filter);
        }

        if (validAt != null && StringUtils.isBlank(filter)) {
            return validitySpec(validAt);
        }

        return null;
    }

    private Specification<TEntity> validitySpec(Timestamp validAt) {
        return getSpec(new SearchCriteria("validFrom", "<=", validAt))
                .and(
                        getSpec(new SearchCriteria("validTo", ">", validAt))
                                .or(getSpec(new SearchCriteria("validTo", "IS NULL", "")))
                );
    }

    public GenericSpecification<TEntity> getSpec(SearchCriteria searchCriteria) {
        return new GenericSpecification<>(searchCriteria);
    }

    public Specification<TEntity> parseExprTree(Expression expr) {
        Specification<TEntity> result;

        if (expr.getSubExpressions() != null && !expr.getSubExpressions().isEmpty()) {
            List<Expression> subExpressions = expr.getSubExpressions();

            result = Specification.where(parseExprTree(subExpressions.get(0)));

            for (int i = 1; i < subExpressions.size(); i++) {

                String rightOp = subExpressions.get(i).getUpperOperator().trim().toLowerCase();

                if (rightOp.equalsIgnoreCase(AND)) {
                    result = result.and(parseExprTree(subExpressions.get(i)));
                } else if (rightOp.equalsIgnoreCase(OR)) {
                    result = result.or(parseExprTree(subExpressions.get(i)));
                }

            }
        } else {
            result = linearWhereToSpecification(expr.getThisExpr());
        }

        if (result == null) {
            throw new BadRequestException();
        }

        return result;
    }

    private Specification<TEntity> linearWhereToSpecification(String linearWhere) {
        Specification<TEntity> result = null;

        Matcher matcher = COMPILED_SEARCH_FILTER_PATTERN.matcher(linearWhere + " " + AND);
        String prevAndOR = null;
        while (matcher.find()) {

            String operation = StringUtils.trim(matcher.group(2));
            validateOperation(operation);
            SearchCriteria sc = new SearchCriteria(
                    StringUtils.trim(matcher.group(1)),
                    operation,
                    removeQuote(
                            StringUtils.trim(UriUtils.decode(matcher.group(3), StandardCharsets.UTF_8.name()))));

            if (result == null) {
                result = getSpec(sc);
            } else if (AND.equalsIgnoreCase(prevAndOR)) {
                result = result.and(getSpec(sc));
            } else {
                result = result.or(getSpec(sc));
            }
            prevAndOR = StringUtils.trim(matcher.group(9));
        }

        return result;
    }

    public static Expression parsePrecedences(Expression expr) {
        String whole = expr.getThisExpr();
        String remainder = whole;
        String remainderOp = "";
        String token;
        Set<String> consideredTokens = new HashSet<>();

        Stack<Character> openp = new Stack<>();

        int beginIndex = -1;
        for (int i = 0; i < whole.length(); i++) {
            if (whole.charAt(i) == '[') {
                openp.push('[');
                if (beginIndex == -1) {
                    beginIndex = i;
                }
            } else if (whole.charAt(i) == ']') {
                switch (openp.size()) {
                    case 0:
                        throw new BadRequestException();
                    case 1:
                        openp.clear();

                        token = whole.substring(beginIndex, i + 1);

                        if (consideredTokens.contains(token)) {
                            beginIndex = -1;
                            if (!remainder.equals(token)) {
                                remainder = getRemainder(remainder, token);
                            }
                            break;
                        }
                        consideredTokens.add(token);

                        String nextExprStr = trim(token, 1).trim();
                        String upperOp;
                        if (beginIndex > 0) {
                            upperOp = getPrevOp(whole, token);
                        } else {
                            upperOp = getNextOp(whole, token);
                        }

                        remainderOp = upperOp;

                        String preExpr;
                        if (remainder.indexOf(token) > 0) {
                            preExpr = remainder.substring(0, getPrevOpIdx(remainder, token)).trim();
                            expr.addSubExpression(new Expression(null, preExpr, upperOp));
                        }

                        Expression subExpression = new Expression(null, nextExprStr, upperOp);
                        expr.addSubExpression(parsePrecedences(subExpression));
                        beginIndex = -1;
                        if (!remainder.equals(token)) {
                            remainder = getRemainder(remainder, token);
                        }
                        break;
                    default:
                        openp.pop();
                }
            }
        }
        if (remainder != null && !whole.equals(remainder) &&
                !remainder.startsWith("[")) {
            expr.addSubExpression(new Expression(null, remainder, remainderOp));
        }
        return expr;
    }

    private static String trim(String s, int charNos) {
        StringBuilder sb = new StringBuilder(s);
        return sb.substring(charNos, s.length() - charNos);
    }

    private static String getRemainder(String whole, String token) {
        if (whole == null || token == null) {
            return null;
        }
        if (whole.length() > whole.indexOf(token) + token.length()) {
            return whole.substring(token.length() + getNextOp(whole, token).length() + 1).trim();
        } else {
            return null;
        }
    }

    private static String getPrevOp(String whole, String token) {
        return whole.substring(getPrevOpIdx(whole, token), whole.indexOf(token) - 1).trim();
    }

    private static String getNextOp(String whole, String token) {
        int leftIdx = whole.indexOf(token) + token.length();

        int rightIdx = leftIdx;
        int spaces = 0;
        while (spaces < 2) {
            if (whole.charAt(rightIdx++) == ' ') {
                spaces++;
            }
        }

        return whole.substring(leftIdx, rightIdx).trim();
    }

    private static int getPrevOpIdx(String whole, String token) {

        int leftIdx = whole.indexOf(token);
        int spaces = 0;
        while (spaces < 2) {
            if (whole.charAt(leftIdx--) == ' ') {
                spaces++;
            }
        }

        return leftIdx + 1;
    }
}
