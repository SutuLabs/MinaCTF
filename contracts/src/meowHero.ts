/**
 * This file defines the `MeowHero` smart contract and the helpers it needs.
 */
const FLAG = 111111;
const LEGION_TREE_HEIGHT = 10;
const INIT_POINT = 1;
const MAX_POINT = 3;
const LEGION_ROOT = 21437966668462597419531228685056711434672956253044931657149388835408624663326n;
const SEED = 1938301114479194655n;

import { Field, State, SmartContract, state, method, MerkleWitness, Poseidon, UInt64, Struct, Provable, Bool } from 'snarkyjs';

export { Meow, MeowHeroContract, LegionMerkleWitness, LEGION_TREE_HEIGHT, LEGION_ROOT, MAX_POINT, INIT_POINT, SEED, combineMeow };

class LegionMerkleWitness extends MerkleWitness(LEGION_TREE_HEIGHT) {}

class Meow extends Struct({
  power: UInt64,
  magic: UInt64,
  speed: UInt64,
  lucky: UInt64,
  charm: UInt64,
}) {
  hash(): Field {
    return Poseidon.hash(Meow.toFields(this));
  }

  isMax(): Bool {
    return Bool.and(
      this.power.equals(UInt64.from(MAX_POINT)),
      Bool.and(
        this.magic.equals(UInt64.from(MAX_POINT)),
        Bool.and(
          this.speed.equals(UInt64.from(MAX_POINT)),
          Bool.and(this.lucky.equals(UInt64.from(MAX_POINT)), this.charm.equals(UInt64.from(MAX_POINT)))
        )
      )
    );
  }

  total(): UInt64 {
    return this.power.add(this.magic).add(this.speed).add(this.lucky).add(this.charm);
  }

  totalNum(): number {
    return Number(
      this.power.toBigInt() + this.magic.toBigInt() + this.speed.toBigInt() + this.lucky.toBigInt() + this.charm.toBigInt()
    );
  }

  toString() {
    return `${this.power}${this.magic}${this.speed}${this.lucky}${this.charm}`;
  }
}

class MeowHeroContract extends SmartContract {
  // the root is the root hash of our off-chain Merkle tree
  @state(Field) legionRoot = State<Field>();

  // number of meows in legion
  @state(Field) legionNumber = State<Field>();

  // seed number to randomize the process
  @state(Field) seed = State<Field>();

  // final flag for capturing
  @state(Field) flag = State<Field>();

  init() {
    super.init();

    this.flag.set(Field(0));
    this.legionRoot.set(Field(LEGION_ROOT));
    this.legionNumber.set(Field(2));
    this.seed.set(Field(SEED));
  }

  @method breed(meow1: Meow, path1: LegionMerkleWitness, meow2: Meow, path2: LegionMerkleWitness, babyPath: LegionMerkleWitness) {
    // check parents existence
    const root = this.legionRoot.get();
    this.legionRoot.assertEquals(root);
    path1.calculateRoot(meow1.hash()).assertEquals(root);
    path2.calculateRoot(meow2.hash()).assertEquals(root);

    // meow cannot breed with itself
    path1.calculateIndex().assertNotEquals(path2.calculateIndex());

    // check new slot existence
    const num = this.legionNumber.get();
    this.legionNumber.assertEquals(num);

    babyPath.calculateRoot(Field(0)).assertEquals(root);
    // index = num - 1 => new_index = index + 1 = num
    babyPath.calculateIndex().assertEquals(num);

    // breed new meow
    const seed = this.seed.get();
    this.seed.assertEquals(seed);
    const meow = combineMeow(meow1, meow2, seed);

    // calculate and update new seed
    const newseed = Poseidon.hash([seed, path1.calculateIndex(), path2.calculateIndex()]);
    this.seed.set(newseed);

    // store to merkle tree
    const newRoot = babyPath.calculateRoot(meow.hash());

    this.legionRoot.set(newRoot);
    this.legionNumber.set(num.add(1));
  }

  @method capture(meow: Meow, path: LegionMerkleWitness) {
    // we fetch the on-chain commitment
    const root = this.legionRoot.get();
    this.legionRoot.assertEquals(root);

    // we check that the meow is within the committed Merkle Tree
    path.calculateRoot(meow.hash()).assertEquals(root);

    // we check that the meow is fully upgraded
    meow.power.assertEquals(UInt64.from(MAX_POINT));
    meow.magic.assertEquals(UInt64.from(MAX_POINT));
    meow.speed.assertEquals(UInt64.from(MAX_POINT));
    meow.lucky.assertEquals(UInt64.from(MAX_POINT));
    meow.charm.assertEquals(UInt64.from(MAX_POINT));

    this.flag.set(Field(FLAG));
  }
}

function divMod(x: Field, y: bigint): { quotient: Field; rest: Field } {
  // q = xn / yn;
  const quotient = Provable.witness(Field, () => new Field(x.toBigInt() / y));
  // r = xn - q * yn;
  const rest = x.sub(quotient.mul(y));

  quotient.mul(Field(y)).add(rest).assertEquals(x);
  rest.assertLessThan(Field(y));

  return {
    quotient,
    rest,
  };
}

function combineAttr(attr1: UInt64, attr2: UInt64, seed: Field): { attr: UInt64; seed: Field } {
  const { quotient: newseed, rest } = divMod(seed, 3n);

  const r = UInt64.from(rest);

  // r \in [0, 2] => (2 * r - 2) \in {-2, 0, 2}
  // attr = (a_1 + a_2 + 2 * r - 2) / 2
  // Truth Table:
  // | a_1 | a_2 |  r  |  a  |
  // | --- | --- | --- | --- |
  // |  1  |  1  |  1  |  1  |
  // |  1  |  2  |  1  |  1  |
  // |  1  |  2  |  2  |  2  |
  // |  2  |  2  |  2  |  3  |
  const { quotient: q } = r.mul(2).add(attr1).add(attr2).sub(2).divMod(2);

  // newattr = q < 0 ? 0 : q > MAX ? MAX : q;
  const newattr = Provable.if(
    q.lessThan(UInt64.from(INIT_POINT)),
    UInt64.from(INIT_POINT),
    Provable.if(q.greaterThan(UInt64.from(MAX_POINT)), UInt64.from(MAX_POINT), q)
  );

  return { attr: newattr, seed: newseed };
}

function combineMeow(meow1: Meow, meow2: Meow, seed: Field): Meow {
  const s0 = seed;
  const { attr: power, seed: s1 } = combineAttr(meow1.power, meow2.power, s0);
  const { attr: magic, seed: s2 } = combineAttr(meow1.magic, meow2.magic, s1);
  const { attr: speed, seed: s3 } = combineAttr(meow1.speed, meow2.speed, s2);
  const { attr: lucky, seed: s4 } = combineAttr(meow1.lucky, meow2.lucky, s3);
  const { attr: charm } = combineAttr(meow1.charm, meow2.charm, s4);

  return new Meow({
    power,
    magic,
    speed,
    lucky,
    charm,
  });
}
