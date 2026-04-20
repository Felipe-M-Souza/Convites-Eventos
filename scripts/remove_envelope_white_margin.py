"""
Remove margens claras dos PNGs de envelope: flood a partir das bordas, peel de halos,
e (em artes escuras) remoção de «ilhas» claras no interior não ligadas à borda da imagem.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def flood_remove_near_white_rgba(arr: np.ndarray, thresh: int) -> np.ndarray:
    """Apaga branco ligado à borda (propagação por dilatação em numpy)."""
    h, w = arr.shape[:2]
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    a = arr[:, :, 3].astype(np.int16)
    removable = (a > 0) & (r >= thresh) & (g >= thresh) & (b >= thresh)

    reachable = np.zeros((h, w), dtype=bool)
    reachable[0, :] = removable[0, :]
    reachable[-1, :] = removable[-1, :]
    reachable[:, 0] = removable[:, 0]
    reachable[:, -1] = removable[:, -1]

    for _ in range(max(h, w) + 4):
        nxt = reachable.copy()
        nxt[1:, :] |= reachable[:-1, :]
        nxt[:-1, :] |= reachable[1:, :]
        nxt[:, 1:] |= reachable[:, :-1]
        nxt[:, :-1] |= reachable[:, 1:]
        nxt &= removable
        if np.array_equal(nxt, reachable):
            break
        reachable = nxt

    arr[reachable] = (0, 0, 0, 0)
    return arr


def peel_border_neutral_halo(arr: np.ndarray, max_iter: int = 120) -> np.ndarray:
    """Remove halos claros que encostam em transparência (conservador: artes claras)."""
    h, w = arr.shape[:2]
    for _ in range(max_iter):
        alpha = arr[:, :, 3].astype(np.int16)
        opaque = alpha > 25
        touches = np.zeros((h, w), dtype=bool)
        touches[1:, :] |= opaque[1:, :] & (alpha[:-1, :] < 25)
        touches[:-1, :] |= opaque[:-1, :] & (alpha[1:, :] < 25)
        touches[:, 1:] |= opaque[:, 1:] & (alpha[:, :-1] < 25)
        touches[:, :-1] |= opaque[:, :-1] & (alpha[:, 1:] < 25)

        r = arr[:, :, 0].astype(np.int16)
        g = arr[:, :, 1].astype(np.int16)
        b = arr[:, :, 2].astype(np.int16)
        near_white = (r >= 244) & (g >= 244) & (b >= 244)

        luma = (r + g + b) / 3.0
        mx = np.maximum(np.maximum(r, g), b)
        mn = np.minimum(np.minimum(r, g), b)
        neutral_gray = (
            (luma >= 218)
            & (luma <= 235)
            & ((mx - mn) < 26)
            & ((r - b) < 12)
        )
        peel = touches & (near_white | neutral_gray)
        if not np.any(peel):
            break
        arr[peel] = (0, 0, 0, 0)
    return arr


def median_opaque_luma(arr: np.ndarray) -> float:
    a = arr[:, :, 3] > 30
    if not np.any(a):
        return 255.0
    rgb = arr[a][:, :3].astype(np.float64)
    return float(np.median(rgb.mean(axis=1)))


def remove_interior_light_islands_dark_envelope(
    arr: np.ndarray,
    *,
    median_luma_max: float = 135.0,
    min_component_area: int = 1800,
    luma_floor: int = 228,
    chroma_max: int = 22,
    rb_max: int = 12,
) -> np.ndarray:
    """
    Em envelopes escuros, remove painéis claros no meio da arte (não ligados à borda
    do ficheiro). Não corre em artes claras (bodas, etc.).
    """
    if median_opaque_luma(arr) > median_luma_max:
        return arr

    h, w = arr.shape[:2]
    r = arr[:, :, 0].astype(np.int16)
    g = arr[:, :, 1].astype(np.int16)
    b = arr[:, :, 2].astype(np.int16)
    a = arr[:, :, 3].astype(np.int16)
    luma = (r + g + b) / 3.0
    mx = np.maximum(np.maximum(r, g), b)
    mn = np.minimum(np.minimum(r, g), b)

    mask = (
        (a > 30)
        & (luma >= luma_floor)
        & ((mx - mn) <= chroma_max)
        & ((r - b) <= rb_max)
    )

    labels = np.zeros((h, w), dtype=np.int32)
    current = 0

    for y in range(h):
        for x in range(w):
            if not mask[y, x] or labels[y, x]:
                continue
            current += 1
            stack = [(x, y)]
            while stack:
                cx, cy = stack.pop()
                if cx < 0 or cx >= w or cy < 0 or cy >= h:
                    continue
                if not mask[cy, cx] or labels[cy, cx]:
                    continue
                labels[cy, cx] = current
                stack.append((cx + 1, cy))
                stack.append((cx - 1, cy))
                stack.append((cx, cy + 1))
                stack.append((cx, cy - 1))

    for lab in range(1, current + 1):
        ys, xs = np.where(labels == lab)
        if ys.size < min_component_area:
            continue
        touches_border = (
            np.any(xs == 0)
            or np.any(xs == w - 1)
            or np.any(ys == 0)
            or np.any(ys == h - 1)
        )
        if touches_border:
            continue
        arr[labels == lab] = (0, 0, 0, 0)

    return arr


def peel_bright_contour_dark_envelope(
    arr: np.ndarray,
    *,
    max_iter: int = 100,
    luma_remove_ge: float = 162.0,
) -> np.ndarray:
    """
    Em envelopes escuros, remove em camadas só os pixels **claros** do contorno (luma alta).
    Preserva o recorte azul escuro e detalhes saturados (ouro); elimina o halo cinza-claro
    que no ecrã parece faixa branca.
    """
    h, w = arr.shape[:2]
    for _ in range(max_iter):
        alpha = arr[:, :, 3].astype(np.int16)
        opaque = alpha > 25
        touches = np.zeros((h, w), dtype=bool)
        touches[1:, :] |= opaque[1:, :] & (alpha[:-1, :] < 25)
        touches[:-1, :] |= opaque[:-1, :] & (alpha[1:, :] < 25)
        touches[:, 1:] |= opaque[:, 1:] & (alpha[:, :-1] < 25)
        touches[:, :-1] |= opaque[:, :-1] & (alpha[:, 1:] < 25)

        r = arr[:, :, 0].astype(np.float32)
        g = arr[:, :, 1].astype(np.float32)
        b = arr[:, :, 2].astype(np.float32)
        luma = (r + g + b) / 3.0
        mx = np.maximum(np.maximum(r, g), b)
        mn = np.minimum(np.minimum(r, g), b)
        # Croma até ~72: apanha cinzas azulados no bordo (44–64); dourado típico no contorno
        # costuma ter croma maior ou não estar só em «touches» exterior.
        peel = (
            touches
            & opaque
            & (luma >= luma_remove_ge)
            & ((mx - mn) < 72.0)
        )
        if not np.any(peel):
            break
        arr[peel] = (0, 0, 0, 0)
    return arr


def peel_dark_envelope_halo_passes(arr: np.ndarray) -> np.ndarray:
    """Passagens com limiares descendentes para eliminar halos claros (incl. azul-acinzentado no bordo)."""
    arr = peel_bright_contour_dark_envelope(arr, luma_remove_ge=168.0, max_iter=120)
    arr = peel_bright_contour_dark_envelope(arr, luma_remove_ge=148.0, max_iter=80)
    # Borda inferior costuma ficar ~145–150 (tom mais quente).
    arr = peel_bright_contour_dark_envelope(arr, luma_remove_ge=138.0, max_iter=50)
    return arr


def process_file(path: Path, thresh: int) -> None:
    im = Image.open(path).convert("RGBA")
    arr = np.array(im)
    arr = flood_remove_near_white_rgba(arr, thresh)
    arr = peel_border_neutral_halo(arr)
    arr = remove_interior_light_islands_dark_envelope(arr)
    if median_opaque_luma(arr) < 135.0:
        arr = peel_dark_envelope_halo_passes(arr)
    Image.fromarray(arr).save(path, optimize=True)
    opaque = float((arr[:, :, 3] > 0).mean())
    print(f"{path.name}: opaque_fraction={opaque:.4f}")


def default_demo_paths(root: Path) -> list[tuple[Path, int]]:
    """Todos os pares demo-* em public/images/envelopes."""
    jobs: list[tuple[Path, int]] = []
    for p in sorted(root.glob("demo-*-closed.png")):
        jobs.append((p, 251))
        open_p = p.with_name(p.name.replace("-closed.png", "-open.png"))
        if open_p.is_file():
            jobs.append((open_p, 251))
    return jobs


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--thresh",
        type=int,
        default=None,
        help="Limiar RGB mínimo no flood (default: 251 para todos os demos)",
    )
    p.add_argument(
        "files",
        nargs="*",
        type=Path,
        help="PNG (default: todos os demo-*-closed/open em public/images/envelopes)",
    )
    args = p.parse_args()
    root = Path(__file__).resolve().parents[1] / "public" / "images" / "envelopes"

    if args.files:
        t = args.thresh if args.thresh is not None else 251
        jobs = [(f, t) for f in args.files]
    else:
        jobs = default_demo_paths(root)
        if args.thresh is not None:
            jobs = [(path, args.thresh) for path, _ in jobs]

    for f, thresh in jobs:
        if not f.is_file():
            raise SystemExit(f"Missing file: {f}")
        process_file(f, thresh)


if __name__ == "__main__":
    main()
