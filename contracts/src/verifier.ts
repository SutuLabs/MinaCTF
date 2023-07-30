/**
 * This file defines the `Verifier` smart contract and the helpers it needs.
 */
const FLAG = 111111;
const PUBLICKEY = 'B62qoYts8pW1GVTt44vhA3esBDN67UsX9jLBackLGarfVKBRWtjQBkU';
const PAYLOAD = 20;

import { Field, State, SmartContract, state, method, Circuit, PublicKey, Signature } from 'snarkyjs';

export { VerifierContract };

class VerifierContract extends SmartContract {
  // target publicKey
  @state(PublicKey) publicKey = State<PublicKey>();
  // target payload
  @state(Field) payload = State<Field>();
  // final flag for capturing
  @state(Field) flag = State<Field>();

  init() {
    super.init();
    this.flag.set(Field(0));
    this.publicKey.set(PublicKey.fromBase58(PUBLICKEY));
    this.payload.set(Field(PAYLOAD));
  }

  @method play(signature: Signature) {
    // precondition that links to the actual on-chain state
    this.publicKey.assertEquals(this.publicKey.get());
    this.payload.assertEquals(this.payload.get());

    // verfify signature
    const pk = this.publicKey.get();
    const verified = signature.verify(pk, [this.payload.get()]);

    const flag = Circuit.if(verified, Field(FLAG), Field(0));
    this.flag.set(flag);
  }
}
