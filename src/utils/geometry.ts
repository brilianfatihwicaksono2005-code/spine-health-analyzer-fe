// ============================================================
// src/utils/geometry.ts — 7 landmarks → 6 spinopelvic features
// ============================================================

import type { Landmarks, SpinopelvicFeatures, Point } from '../types/spine';

/** Clamp a value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Euclidean distance between two points */
function hypot(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

/** Dot product of two 2D vectors */
function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

/** Magnitude (norm) of a 2D vector */
function norm(v: Point): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Compute the 6 spinopelvic parameters from 7 pixel-coordinate landmarks
 * and the pixel spacing (mm per pixel).
 *
 * Formulas follow §5.2 of FRONTEND_PRD.md exactly.
 */
export function computeSpinopelvicFeatures(
  landmarks: Landmarks,
  pixelSpacing: number,
): SpinopelvicFeatures {
  const { fh, s1_ant, s1_post, l1_ant, l1_post, l5_ant: _l5_ant, l5_post } = landmarks;

  // ── Derived midpoints & vectors ──────────────────────────

  // Midpoint of S1 endplate
  const s1_mid: Point = {
    x: (s1_ant.x + s1_post.x) / 2,
    y: (s1_ant.y + s1_post.y) / 2,
  };

  // S1 endplate direction vector (anterior → posterior)
  const v_s1: Point = {
    x: s1_ant.x - s1_post.x,
    y: s1_ant.y - s1_post.y,
  };

  // L1 endplate direction vector
  const v_l1: Point = {
    x: l1_ant.x - l1_post.x,
    y: l1_ant.y - l1_post.y,
  };

  // ── 1. Sacral Slope ──────────────────────────────────────
  const sacral_slope =
    Math.abs(Math.atan2(v_s1.y, Math.abs(v_s1.x))) * (180 / Math.PI);

  // ── 2. Pelvic Tilt ───────────────────────────────────────
  const dy_fh_s1 = Math.abs(fh.y - s1_mid.y);
  const dist_fh_s1 = hypot(fh.x - s1_mid.x, fh.y - s1_mid.y);
  const pt_ratio = dist_fh_s1 === 0 ? 0 : dy_fh_s1 / dist_fh_s1;
  const pelvic_tilt =
    Math.acos(clamp(pt_ratio, -1, 1)) * (180 / Math.PI);

  // ── 3. Pelvic Incidence ──────────────────────────────────
  const pelvic_incidence = pelvic_tilt + sacral_slope;

  // ── 4. Lumbar Lordosis Angle ─────────────────────────────
  const norm_l1 = norm(v_l1);
  const norm_s1 = norm(v_s1);
  const cosAngle =
    norm_l1 === 0 || norm_s1 === 0
      ? 0
      : dot(v_l1, v_s1) / (norm_l1 * norm_s1);
  const lumbar_lordosis_angle =
    Math.acos(clamp(cosAngle, -1, 1)) * (180 / Math.PI);

  // ── 5. Pelvic Radius ────────────────────────────────────
  const pelvic_radius =
    hypot(fh.x - s1_post.x, fh.y - s1_post.y) * pixelSpacing;

  // ── 6. Degree of Spondylolisthesis ──────────────────────
  // Projection of (l5_post − s1_post) onto the unit vector of v_s1
  const slip: Point = {
    x: l5_post.x - s1_post.x,
    y: l5_post.y - s1_post.y,
  };
  const v_s1_norm = norm(v_s1);
  const projScalar =
    v_s1_norm === 0
      ? 0
      : dot(slip, v_s1) / v_s1_norm;
  const degree_spondylolisthesis = Math.max(
    0,
    Math.abs(projScalar) * pixelSpacing,
  );

  return {
    pelvic_incidence: round2(pelvic_incidence),
    pelvic_tilt: round2(pelvic_tilt),
    lumbar_lordosis_angle: round2(lumbar_lordosis_angle),
    sacral_slope: round2(sacral_slope),
    pelvic_radius: round2(pelvic_radius),
    degree_spondylolisthesis: round2(degree_spondylolisthesis),
  };
}

/** Round to 2 decimal places */
function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
