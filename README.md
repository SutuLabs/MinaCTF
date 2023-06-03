# MinaCTF

```mermaid
gantt
    dateFormat  YYYY-MM-DD
    title       Mina CTF Timeline
    excludes    weekends
    %% (`excludes` accepts specific dates in YYYY-MM-DD format, days of the week ("sunday") or "weekends", but not the word "weekdays".)

    section CTF Games
    1st CTF game : active, ctf1, 2023-05-08, 10d
    2nd CTF game : 10d
    3rd CTF game : 10d
    4th CTF game : 10d
    5th CTF game : 10d

    section Web Platform
    Challenge system : after ctf1, 2023-05-22, 10d
    Account/score: 10d
    Integration: 10d

    section Final
    Alpha testing : 2023-07-03, 15d
    Prepare Presentation              :2023-07-17, 12d
    Final Presentation               :milestone, 2023-08-02
```


## Web Platform Design

- Database
    - UserTable
        - id
        - username
        - passwordHash
    - UserChallengeTable
        - userId
        - challengeId
        - contractId
        - flag
        - startTime
        - captureTime
        - score
- Backend
    - start a challenge: POST /api/challenge/{name}
        - request: empty
        - response: { success: boolean }
    - submit the flag: POST /api/challenge/{name} 
        - request: { flag: string }
        - response: { success: boolean }
    - register: POST /api/user/register
        - request: { username: string, passwordHash: string }
        - response: { success: boolean }
    - login: POST /api/user/login
        - request: { username: string, passwordHash: string }
        - response: { token: string }
    - logout: POST /api/user/logout
        - request: { token: string }
        - response: { success: boolean }
    - scores: GET /api/score/list
        - response: { username: string, score: number }[]
- Frontend
    - Challenge
        - List
        - Guide page (include start and submit function)
    - Account
        - Login
        - Register
    - Scoreboard
        - List


## FAQ

### Is there a way to cache/skip compiling?

TLDR: No

REF:
- [• Discord | "Is it possible to precompile a zkApp on client side?" | Mina Protocol](https://discord.com/channels/484437221055922177/1070570936799084554)
- [• Discord | "is there a way to cache/skip compiling?" | Mina Protocol](https://discord.com/channels/484437221055922177/1105190653173960894/1105190653173960894)
- [Restore prover keys · Issue #87 · o1-labs/snarkyjs](https://github.com/o1-labs/snarkyjs/issues/87)
- [Unable to verify proof, without running compile on any contract first · Issue #427 · o1-labs/snarkyjs](https://github.com/o1-labs/snarkyjs/issues/427)