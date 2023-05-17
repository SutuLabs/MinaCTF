interface MazeEntity {
    maze: bigint;
    start: number;
    end: number;
}

export function serializeToMaze(maze: string): MazeEntity {
    const lines = maze.split("\n").filter(_ => !!_);
    const height = lines.length;
    const width = lines[0].length;
    // console.log(width,height)
    const m = [];
    let start = 0;
    let end = 0;
    for (let y = 0; y < height; y++) {
        const line = lines[y];
        for (let x = 0; x < width; x++) {
            const ele = line[x];
            const pos = y * width + x;
            if (ele == "S") {
                start = pos;
            } else if (ele == "E") {
                end = pos;
            }
            m[pos] = ele == "1" ? 1 : 0;
        }
    }

    // console.log(m);
    const fm = m.reduce((pv, cv) => ({ total: pv.total + pv.acc * BigInt(cv), acc: pv.acc * 2n }), { total: 0n, acc: 1n })

    return {
        start, end,
        maze: fm.total,
    }

}