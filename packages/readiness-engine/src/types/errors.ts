/**
 * Error classes for the InternshipOS Readiness Engine.
 *
 * Deterministic and typed error reporting without hidden side-effects.
 */

export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EngineError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends EngineError {
  public readonly field?: string;
  public readonly value?: unknown;

  constructor(message: string, field?: string, value?: unknown) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
  }
}

export class IncompatibleQuestionSetError extends EngineError {
  public readonly questionSetVersion: string;
  public readonly activeVersion: string;

  constructor(message: string, questionSetVersion: string, activeVersion: string) {
    super(message);
    this.name = 'IncompatibleQuestionSetError';
    this.questionSetVersion = questionSetVersion;
    this.activeVersion = activeVersion;
  }
}

export class ScoreRangeError extends ValidationError {
  constructor(field: string, value: number) {
    super(`Invalid score: ${field} must be a finite number between 0 and 100, received ${value}`, field, value);
    this.name = 'ScoreRangeError';
  }
}

export class InvalidDateError extends ValidationError {
  constructor(field: string, message: string) {
    super(`Invalid date for ${field}: ${message}`, field);
    this.name = 'InvalidDateError';
  }
}
