process.env['NODE_DEV'] = 'TEST';

import { assert, expect } from 'chai';
import { describe, it } from 'mocha';
import { DurationRange, GameEventManager, MultipleDurations, Test } from './index';

describe('isDurationRange', () => {
  it('valid duration range', () => {
    const duration = new DurationRange(0, 2);

    assert.equal(Test.isDurationRange!(duration), true);
  });

  it('x and y from range cannot be less than 0', () => {
    const duration1 = new DurationRange(-1, 2);

    assert.equal(Test.isDurationRange!(duration1), false);

    const duration2 = new DurationRange(0, -1);

    assert.equal(Test.isDurationRange!(duration2), false);
  });

  it('y must be greater than or equal to x in DurationRange', () => {
    const duration1 = new DurationRange(5, 1);

    assert.equal(Test.isDurationRange!(duration1), false);

    const duration2 = new DurationRange(5, 5);

    assert.equal(Test.isDurationRange!(duration2), true);
  });

  it('test check function', () => {
    const duration = new DurationRange(0, 2);

    assert.equal(duration.validate(-1), false);
    assert.equal(duration.validate(0), true);
    assert.equal(duration.validate(1), true);
    assert.equal(duration.validate(2), false);
    assert.equal(duration.validate(3), false);
  });
});

describe('isMultipleDurations', () => {
  it('valid multiple durations', () => {
    const duration = new MultipleDurations([0, 2]);

    assert.equal(Test.isMultipleDurations!(duration), true);
  });

  it('items cannot be less than 0', () => {
    const duration = new MultipleDurations([-1, 2]);

    assert.equal(Test.isMultipleDurations!(duration), false);
  });

  it('items must be unique', () => {
    const duration1 = new MultipleDurations([5, 1]);

    assert.equal(Test.isMultipleDurations!(duration1), true);

    const duration2 = new MultipleDurations([5, 5]);

    assert.equal(Test.isMultipleDurations!(duration2), false);

    const duration3 = new MultipleDurations([5, 4, 5]);

    assert.equal(Test.isMultipleDurations!(duration3), false);

    const duration4 = new MultipleDurations([1, 2, 3]);

    assert.equal(Test.isMultipleDurations!(duration4), true);
  });

  it('test check function', () => {
    const duration = new MultipleDurations([2, 3, 4]);

    assert.equal(duration.validate(1), false);
    assert.equal(duration.validate(2), true);
    assert.equal(duration.validate(3), true);
    assert.equal(duration.validate(4), true);
    assert.equal(duration.validate(5), false);
  });
});

describe('GameEvent', () => {
  it('valid game event usage', () => {
    const manager = new GameEventManager();

    manager.addEvent({
      type: 'A',
      duration: 0,
    });

    const firstEvent = manager.getEvent(0);
    assert.isObject(firstEvent);
    assert.equal(firstEvent!.duration, 0);

    manager.addEvent({
      type: 'B',
      duration: new DurationRange(2, 10),
    });

    for (let i = 2; i < 10; i++) {
      assert.isObject(manager.getEvent(i));
    }

    manager.addEvent({
      type: 'C',
      duration: new MultipleDurations([11, 15, 20]),
    });

    assert.isObject(manager.getEvent(15));
    assert.isObject(manager.getEvent(11));
    assert.isObject(manager.getEvent(20));
  });

  it('single game event only can be found by single time', () => {
    const manager = new GameEventManager();

    manager.addEvent({
      type: 'A',
      duration: 0,
    });

    // multiple events are registered at time 0 so that it won't add event
    expect(() => {
      manager.addEvent({
        type: 'B',
        duration: new DurationRange(0, 10),
      });
    }).to.throw('duplicated');

    for (let i = 0; i < 10; i++) {
      if (i === 0) {
        assert.isObject(manager.getEvent(0));
        continue;
      }

      assert.isUndefined(manager.getEvent(i));
    }

    // multiple events are registered at time 0 so that it won't add event
    expect(() => {
      manager.addEvent({
        type: 'C',
        duration: new MultipleDurations([0, 1, 3]),
      });
    }).to.throw('duplicated');

    // Event at time 0 is not changed
    assert.equal(manager.getEvent(0)!.type, 'A');

    // other events are not added
    assert.isUndefined(manager.getEvent(1));
    assert.isUndefined(manager.getEvent(3));
  });
});
