// ===================================================================
// Focus 17/68 — Solides de Platon (inspiré d'AttentionGrid.com)
// Chaque séance de 68s complétée « grave » une face du solide.
// Géométrie vérifiée : caractéristique d'Euler V−E+F = 2,
// chaque arête appartient à exactement 2 faces, degrés corrects.
// ===================================================================

export type PolyhedronId =
    | 'tetrahedron'
    | 'cube'
    | 'octahedron'
    | 'dodecahedron'
    | 'icosahedron';

export interface PolyhedronDef {
    id: PolyhedronId;
    name: string;
    faceLabel: string; // « face » au singulier
    faceCount: number;
    timeLabel: string; // durée totale estimée (68s par face)
    vertices: [number, number, number][];
    faces: number[][]; // chaque face = indices de sommets, ordre cyclique
}

export const POLYHEDRA: PolyhedronDef[] = [
    {
        id: 'tetrahedron',
        name: 'Tétraèdre',
        faceLabel: 'face',
        faceCount: 4,
        timeLabel: '≈ 4 min 30',
        vertices: [
            [1, 1, 1],
            [1, -1, -1],
            [-1, 1, -1],
            [-1, -1, 1],
        ],
        faces: [
            [0, 1, 2],
            [0, 1, 3],
            [1, 2, 3],
            [0, 2, 3],
        ],
    },
    {
        id: 'cube',
        name: 'Cube',
        faceLabel: 'face',
        faceCount: 6,
        timeLabel: '≈ 7 min',
        vertices: [
            [-1, -1, -1],
            [-1, -1, 1],
            [-1, 1, -1],
            [-1, 1, 1],
            [1, -1, -1],
            [1, -1, 1],
            [1, 1, -1],
            [1, 1, 1],
        ],
        faces: [
            [3, 2, 0, 1],
            [7, 6, 4, 5],
            [4, 6, 2, 0],
            [5, 7, 3, 1],
            [5, 4, 0, 1],
            [7, 6, 2, 3],
        ],
    },
    {
        id: 'octahedron',
        name: 'Octaèdre',
        faceLabel: 'face',
        faceCount: 8,
        timeLabel: '≈ 9 min',
        vertices: [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 1, 0],
            [0, -1, 0],
            [0, 0, 1],
            [0, 0, -1],
        ],
        faces: [
            [0, 2, 4],
            [3, 5, 1],
            [0, 3, 4],
            [3, 4, 1],
            [2, 5, 1],
            [0, 2, 5],
            [0, 3, 5],
            [2, 4, 1],
        ],
    },
    {
        id: 'dodecahedron',
        name: 'Dodécaèdre',
        faceLabel: 'face',
        faceCount: 12,
        timeLabel: '≈ 13 min 30',
        vertices: [
            [0, -0.618034, -1.618034],
            [0, -0.618034, 1.618034],
            [0, 0.618034, -1.618034],
            [0, 0.618034, 1.618034],
            [-0.618034, -1.618034, 0],
            [-0.618034, 1.618034, 0],
            [0.618034, -1.618034, 0],
            [0.618034, 1.618034, 0],
            [-1.618034, 0, -0.618034],
            [-1.618034, 0, 0.618034],
            [1.618034, 0, -0.618034],
            [1.618034, 0, 0.618034],
            [-1, -1, -1],
            [-1, -1, 1],
            [-1, 1, -1],
            [-1, 1, 1],
            [1, -1, -1],
            [1, -1, 1],
            [1, 1, -1],
            [1, 1, 1],
        ],
        faces: [
            [18, 10, 16, 0, 2],
            [6, 16, 0, 12, 4],
            [10, 11, 17, 6, 16],
            [19, 7, 18, 10, 11],
            [6, 17, 1, 13, 4],
            [15, 5, 14, 8, 9],
            [19, 11, 17, 1, 3],
            [1, 3, 15, 9, 13],
            [0, 2, 14, 8, 12],
            [7, 19, 3, 15, 5],
            [8, 9, 13, 4, 12],
            [7, 18, 2, 14, 5],
        ],
    },
    {
        id: 'icosahedron',
        name: 'Icosaèdre',
        faceLabel: 'face',
        faceCount: 20,
        timeLabel: '≈ 22 min 40',
        vertices: [
            [0, -1, -1.618034],
            [0, -1, 1.618034],
            [0, 1, -1.618034],
            [0, 1, 1.618034],
            [-1, -1.618034, 0],
            [-1, 1.618034, 0],
            [1, -1.618034, 0],
            [1, 1.618034, 0],
            [-1.618034, 0, -1],
            [-1.618034, 0, 1],
            [1.618034, 0, -1],
            [1.618034, 0, 1],
        ],
        faces: [
            [0, 4, 8],
            [7, 10, 11],
            [3, 5, 9],
            [7, 2, 5],
            [7, 10, 2],
            [1, 3, 9],
            [10, 0, 2],
            [6, 10, 0],
            [6, 11, 1],
            [7, 11, 3],
            [11, 1, 3],
            [6, 0, 4],
            [8, 9, 4],
            [7, 3, 5],
            [5, 8, 9],
            [2, 5, 8],
            [6, 1, 4],
            [1, 4, 9],
            [10, 11, 6],
            [0, 2, 8],
        ],
    },
];

export function getPolyhedron(id: PolyhedronId): PolyhedronDef {
    return POLYHEDRA.find((p) => p.id === id) ?? POLYHEDRA[0];
}

/** Première face non gravée (la plus petite), ou null si le solide est complet. */
export function firstUnfilledFace(
    shape: PolyhedronDef,
    filledFaces: number[]
): number | null {
    const filled = new Set(filledFaces);
    for (let i = 0; i < shape.faceCount; i++) {
        if (!filled.has(i)) return i;
    }
    return null;
}
