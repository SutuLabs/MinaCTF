/**
 * This file defines the `Checkin` smart contract and the helpers it needs.
 */
const FLAG = 111111;

import { Field, State, SmartContract, state, method } from 'snarkyjs';

export { CheckinContract };

class CheckinContract extends SmartContract {
  // start flag
  @state(Field) start = State<Field>();
  // final flag for capturing
  @state(Field) flag = State<Field>();

  init() {
    super.init();
    this.flag.set(Field(0));
    this.start.set(Field(1));
  }

  @method play() {
    // precondition that links to the actual on-chain state
    this.start.assertEquals(this.start.get());

    // check started
    this.start.assertEquals(Field(1));

    // set flag
    this.flag.set(Field(FLAG));
  }
}
