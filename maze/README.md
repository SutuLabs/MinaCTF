# Mina zkApp: Maze

## Procedure

1. Coordinator program generate a random feasible maze and a random flag number;
2. Coordinator program deploy and start the maze game;
3. Player get the contract id to interact;
4. Player try to figure out what the program is intended to do and work out the solution to capture the flag;
5. Submit flag to Coordinator to get points.

## Problem encountered

### Cannot deploy contract

If try to deploy with `zk deploy`, there is error: `Failed to send transaction to relayer. Errors: Couldn't send zkApp command: ["Fee_payer_not_permitted_to_send"]`

## How to build

```sh
npm run build
```

## How to run tests

```sh
npm run test
npm run testw # watch mode
```

## How to run coverage

```sh
npm run coverage
```

## License

[Apache-2.0](LICENSE)
