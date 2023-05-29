/**
 * This file defines the `Prime` smart contract and the helpers it needs.
 */
const FLAG = 111111n;

import { Field, State, SmartContract, state, method, Circuit } from 'snarkyjs';

export { PrimeContract };

class PrimeContract extends SmartContract {
  // target number, to be challenging, should be a prime
  @state(Field) number = State<Field>();
  // final flag for capturing
  @state(Field) flag = State<Field>();

  init() {
    super.init();
    this.number.set(Field(0));
    this.flag.set(Field(0));
  }

  @method startGame(number: Field) {
    this.number.assertEquals(Field(0));
    this.number.set(number);
  }

  @method play(x: Field, y: Field) {
    const num = x.mul(y);

    // precondition that links to the actual on-chain state
    this.number.assertEquals(this.number.get());

    const flag = Circuit.if(
      this.number.get().equals(num),
      Field(FLAG),
      Field(0)
    );
    this.flag.set(flag);
  }
}
