interface ValidateDuration {
  validate(currIndex: number): boolean;
}

/**
 * Duration indicates range using x and y.
 * x must be less than or equal to y.
 * Both x and y must be more than 0.
 */
export class DurationRange implements ValidateDuration {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  validate(currIndex: number): boolean {
    return this.x <= currIndex && this.y > currIndex;
  }
}

function isDurationRange(value: any): value is DurationRange {
  return value?.x != null && value.x > -1 &&
    value.y != null && value.y > -1 &&
    value.x <= value.y;
}

/**
 * Duration indicates multiple values.
 * Each value must be more than 0, and they must be unique.
 */
export class MultipleDurations implements ValidateDuration {
  constructor(
    public readonly durations: number[] = [],
  ) {}

  validate(currIndex: number): boolean {
    return this.durations.indexOf(currIndex) > -1;
  }
}

/**
 * checks if elements of array are unique and more than 0
 * @param array
 */
function isUniqueNumericArray(array: any[]) {
  const sorted: number[] = [];

  return array.every(value => {
    if (typeof value !== 'number' || value < 0) {
      return false;
    }

    // Check few conditions before iteration
    // Add value into sorted if sorted is empty
    if (sorted.length === 0) {
      sorted.push(value);
      return true;
    }

    // Add value at the beginning of sorted if value is less than first element of sorted
    if (sorted[0] > value) {
      sorted.unshift(value);
      return true;
    }

    // Add value at the end of sorted if value is less than last element of sorted
    if (sorted[sorted.length - 1] < value) {
      sorted.push(value);
      return true;
    }

    // Iterate sorted
    for (let index = 0; index < sorted.length; index++) {
      const occurrence = sorted[index];
      const prevOccurrence = index > 0 ? sorted[index - 1] : undefined;

      if (occurrence === value) {
        // Return false if there is non-unique item in array
        return false;
      } else if (prevOccurrence != null && prevOccurrence < value && occurrence > value) {
        // Insert value at index - 1 if value is more than prevOccurrence and less than occurrence
        sorted.splice(index - 1, 0, value);
        return true;
      }
    }

    return true;
  });
}

function isMultipleDurations(value: any): value is MultipleDurations {
  return value?.durations != null && Array.isArray(value.durations) &&
    value.durations.length > 0 && isUniqueNumericArray(value.durations)
}

type Duration = number | DurationRange | MultipleDurations;

export class GameEvent {
  public type = "A";
  public duration: Duration = 0;
}

export class GameEventManager {
  private events: GameEvent[] = [];

  /**
   * validate eventDetails input
   * @param eventDetails
   */
  public static validateEvent(eventDetails: GameEvent): eventDetails is GameEvent {
    return eventDetails.type != null && eventDetails.type !== "" && eventDetails.duration != null && (
      (typeof eventDetails.duration === 'number' && eventDetails.duration > -1) ||
      isDurationRange(eventDetails.duration) ||
      isMultipleDurations(eventDetails.duration)
    );
  }

  public static validateDuplication(events: GameEvent[], eventDetails: GameEvent): boolean {
    events.forEach(value => {
      if (typeof value.duration === 'number') {
        // When value.duration is number
        if (typeof eventDetails.duration === 'number' && value.duration === eventDetails.duration) {
          throw Error('duplicated');
        }

        if (isDurationRange(eventDetails.duration)) {
          if (eventDetails.duration.validate(value.duration)) {
            throw Error('duplicated');
          }
        }

        if (isMultipleDurations(eventDetails.duration)) {
          if (eventDetails.duration.validate(value.duration)) {
            throw Error('duplicated');
          }
        }
      } else if (isDurationRange(value.duration)) {
        // When value.duration is DurationRange
        if (typeof eventDetails.duration === 'number' && value.duration.validate(eventDetails.duration)) {
          throw Error('duplicated');
        }

        if (isDurationRange(eventDetails.duration)) {
          if ((value.duration.x > eventDetails.duration.x && value.duration.x < eventDetails.duration.y) ||
            (value.duration.y > eventDetails.duration.x && value.duration.y < eventDetails.duration.y)) {
            throw Error('duplicated');
          }
        }

        if (isMultipleDurations(eventDetails.duration)) {
          if (eventDetails.duration.durations.findIndex((duration) => {
            return !(value.duration instanceof DurationRange) ||
              value.duration.validate(duration);
          }) > -1) {
            throw Error('duplicated');
          }
        }
      } else if (isMultipleDurations(value.duration)) {
        // When value.duration is MultipleDurations
        if (typeof eventDetails.duration === 'number' &&
          value.duration.durations.indexOf(eventDetails.duration)) {
          throw Error('duplicated');
        }

        if (isDurationRange(eventDetails.duration)) {
          if (value.duration.durations.findIndex((duration) => {
            return !(eventDetails.duration instanceof DurationRange) ||
            eventDetails.duration.validate(duration);
          }) > -1) {
            throw Error('duplicated');
          }
        }

        if (isMultipleDurations(eventDetails.duration)) {
          if (value.duration.durations.findIndex((duration) => {
            return !(eventDetails.duration instanceof MultipleDurations) ||
            (eventDetails.duration.durations.indexOf(duration) > -1);
          }) > -1) {
            throw Error('duplicated');
          }
        }
      }
    });

    return true;
  }

  public addEvent(eventDetails: GameEvent) {
    // Validate duplication
    if (!GameEventManager.validateDuplication(this.events, eventDetails)) {
      throw Error('invalid');
    }

    // Validate eventDetails
    if (!GameEventManager.validateEvent(eventDetails)) {
      throw Error('invalid');
    }

    this.events.push(eventDetails);
  }

  public getEvent(time: number): GameEvent | undefined {
    return this.events.find(value => {
      if (typeof value.duration === 'number' && value.duration === time) {
        return true;
      }

      if (isMultipleDurations(value.duration)) {
        return value.duration.validate(time);
      }

      if (isDurationRange(value.duration)) {
        return value.duration.validate(time);
      }

      return false;
    })
  }
}

// Exports for test
export const Test = {
  ...((process.env['NODE_DEV'] === 'TEST') ? {
    isDurationRange,
    isMultipleDurations,
  } : {}),
};
