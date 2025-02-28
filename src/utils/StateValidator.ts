import { Invariant } from './Invariant';
import { Logger } from './Logger';

export class StateValidator {
  private static instance: StateValidator;
  private readonly validStates: Set<string> = new Set();
  private currentState: string | null = null;
  private readonly logger = Logger.getInstance();

  private constructor() {}

  public static getInstance(): StateValidator {
    if (!this.instance) {
      this.instance = new StateValidator();
    }
    return this.instance;
  }

  public registerState(state: string): void {
    this.validStates.add(state);
  }

  public transition(from: string | null, to: string): void {
    Invariant.assert(
      this.validStates.has(to),
      `Invalid state transition to: ${to}`
    );

    if (from !== null) {
      Invariant.assert(
        this.currentState === from,
        `Invalid state transition from ${this.currentState} to ${to}`
      );
    }

    this.logger.log('debug', `State transition: ${from} -> ${to}`);
    this.currentState = to;
  }

  public getCurrentState(): string | null {
    return this.currentState;
  }
}