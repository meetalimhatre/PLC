package com.sap.plc.backend.exception;

public class RepositoryException extends PlcException {
	
	private static final long serialVersionUID = 6967596995115130216L;
	
	public RepositoryException() {}
	
	public RepositoryException(String message) {
		super(message);
	}
}
