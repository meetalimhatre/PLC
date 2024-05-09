package com.sap.plc.backend.filter.specification;

import java.util.ArrayList;
import java.util.List;

public class Expression {

    private List<Expression> subExpressions;
    private String thisExpr;
    private String upperOperator;

    public Expression(List<Expression> expr, String thisExpr, String upperOperator) {
        super();
        this.subExpressions = expr;
        this.thisExpr = thisExpr;
        this.upperOperator = upperOperator;
    }

    public String getThisExpr() {
        return thisExpr;
    }

    public void setThisExpr(String thisExpr) {
        this.thisExpr = thisExpr;
    }

    public List<Expression> getSubExpressions() {
        return subExpressions;
    }

    public void addSubExpression(Expression expr) {
        if (this.subExpressions == null) {
            this.subExpressions = new ArrayList<>();
        }
        this.subExpressions.add(expr);
    }

    public String getUpperOperator() {
        return upperOperator;
    }

    public void setUpperOperator(String upperOperator) {
        this.upperOperator = upperOperator;
    }
}
